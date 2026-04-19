import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const bodySchema = z.object({
  source_subject_id:  z.string().regex(UUID_REGEX, 'source_subject_id must be a valid UUID'),
  target_subject_ids: z
    .array(z.string().regex(UUID_REGEX, 'Each target_subject_id must be a valid UUID'))
    .min(1, 'target_subject_ids must contain at least one UUID'),
})

/**
 * POST /api/super-admin/syllabus/copy
 *
 * Copies syllabus chunks from one subject to one or more target subjects.
 * Super_admin only. Replaces existing chunks in each target.
 *
 * Body: { source_subject_id: string, target_subject_ids: string[] }
 */
export async function POST(request) {
  try {
    // ── 1. Auth: verify super_admin ─────────────────────────────────────────
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden — super_admin only', code: 'FORBIDDEN' }, { status: 403 })
    }

    // ── 2. Validate body ────────────────────────────────────────────────────
    let body
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body', code: 'BAD_REQUEST' }, { status: 400 })
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { source_subject_id, target_subject_ids } = parsed.data

    // ── 3. Fetch source subject ─────────────────────────────────────────────
    const { data: sourceSubject, error: sourceErr } = await adminSupabase
      .from('subjects')
      .select('id, name, college_id')
      .eq('id', source_subject_id)
      .single()

    if (sourceErr || !sourceSubject) {
      return Response.json({ error: 'Source subject not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    // ── 4. Fetch all chunks for source subject ──────────────────────────────
    const { data: sourceChunks, error: chunksErr } = await adminSupabase
      .from('syllabus_chunks')
      .select('subject_id, college_id, syllabus_file_id, unit_number, topic, subtopics, raw_text')
      .eq('subject_id', source_subject_id)
      .eq('college_id', sourceSubject.college_id)

    if (chunksErr) throw new Error(`Failed to fetch source chunks: ${chunksErr.message}`)

    const chunkCount = sourceChunks?.length ?? 0

    // ── 5. For each target subject: delete existing chunks, insert new ones ──
    const targetResults = []

    for (const targetId of target_subject_ids) {
      // 5a. Fetch target subject to get college_id
      const { data: targetSubject, error: targetErr } = await adminSupabase
        .from('subjects')
        .select('id, name, college_id')
        .eq('id', targetId)
        .single()

      if (targetErr || !targetSubject) {
        logger.warn('[POST /api/super-admin/syllabus/copy] Target subject not found', { targetId })
        targetResults.push({ subject_id: targetId, error: 'Target subject not found', chunks_copied: 0 })
        continue
      }

      // 5b. Delete existing chunks for target
      const { error: deleteErr } = await adminSupabase
        .from('syllabus_chunks')
        .delete()
        .eq('subject_id', targetId)
        .eq('college_id', targetSubject.college_id)

      if (deleteErr) {
        logger.error('[POST /api/super-admin/syllabus/copy] Delete failed', { targetId, deleteErr })
        targetResults.push({ subject_id: targetId, name: targetSubject.name, error: deleteErr.message, chunks_copied: 0 })
        continue
      }

      // 5c. Insert new chunks — override subject_id, college_id; set syllabus_file_id to null
      let copiedCount = 0
      if (chunkCount > 0) {
        const newChunks = sourceChunks.map((chunk) => ({
          subject_id:       targetId,
          college_id:       targetSubject.college_id,
          syllabus_file_id: null,
          unit_number:      chunk.unit_number,
          topic:            chunk.topic,
          subtopics:        chunk.subtopics,
          raw_text:         chunk.raw_text,
        }))

        const { error: insertErr, data: inserted } = await adminSupabase
          .from('syllabus_chunks')
          .insert(newChunks)
          .select('id')

        if (insertErr) {
          logger.error('[POST /api/super-admin/syllabus/copy] Insert failed', { targetId, insertErr })
          targetResults.push({ subject_id: targetId, name: targetSubject.name, error: insertErr.message, chunks_copied: 0 })
          continue
        }

        copiedCount = inserted?.length ?? newChunks.length
      }

      targetResults.push({
        subject_id:    targetId,
        name:          targetSubject.name,
        college_id:    targetSubject.college_id,
        chunks_copied: copiedCount,
      })
    }

    const successTargets = targetResults.filter((t) => !t.error)
    const targetsUpdated = successTargets.length

    // ── 6. Log to system_logs ────────────────────────────────────────────────
    try {
      const targetNames = successTargets.map((t) => t.name).join(', ')
      await adminSupabase.from('system_logs').insert({
        college_id: sourceSubject.college_id,
        user_id:    user.id,
        event_type: 'syllabus_copy',
        severity:   'info',
        message:    `Syllabus copied from "${sourceSubject.name}" (${source_subject_id}) to ${targetsUpdated} subject(s): ${targetNames}`,
        metadata: {
          source_subject_id,
          source_subject_name:  sourceSubject.name,
          source_college_id:    sourceSubject.college_id,
          chunks_in_source:     chunkCount,
          targets_updated:      targetsUpdated,
          targets:              targetResults,
          performed_by:         user.id,
        },
      })
    } catch (logErr) {
      // Non-fatal — log locally but don't fail the request
      logger.error('[POST /api/super-admin/syllabus/copy] system_logs insert failed', logErr)
    }

    logger.info('[POST /api/super-admin/syllabus/copy] Done', {
      source_subject_id,
      chunks_in_source: chunkCount,
      targets_updated:  targetsUpdated,
    })

    // ── 7. Return result ─────────────────────────────────────────────────────
    return Response.json({
      data: {
        source_subject_id,
        source_subject_name: sourceSubject.name,
        chunks_in_source:    chunkCount,
        targets_updated:     targetsUpdated,
        targets:             targetResults,
      },
    })

  } catch (err) {
    logger.error('[POST /api/super-admin/syllabus/copy]', err)
    return Response.json({ error: err.message, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
