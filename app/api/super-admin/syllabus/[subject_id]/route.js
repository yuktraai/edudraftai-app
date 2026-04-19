import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

/**
 * DELETE /api/super-admin/syllabus/[subject_id]
 *
 * Wipes all syllabus data for a subject:
 *   1. Storage objects (from Supabase Storage bucket "syllabuses")
 *   2. All syllabus_chunks rows
 *   3. All syllabus_files rows
 *   4. Writes a system_log warning entry
 *
 * Super_admin only. No college_id restriction.
 */
export async function DELETE(request, { params }) {
  try {
    // ── 1. Auth ───────────────────────────────────────────────────────────────
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin')
      return Response.json({ error: 'Forbidden — super_admin only', code: 'FORBIDDEN' }, { status: 403 })

    // ── 2. Validate subject ───────────────────────────────────────────────────
    const { subject_id } = params
    if (!subject_id) return Response.json({ error: 'Missing subject_id' }, { status: 400 })

    const { data: subject } = await adminSupabase
      .from('subjects')
      .select('id, name, college_id')
      .eq('id', subject_id)
      .single()

    if (!subject) return Response.json({ error: 'Subject not found' }, { status: 404 })

    // ── 3. Fetch all syllabus_files to collect storage paths ──────────────────
    const { data: syllabusFiles } = await adminSupabase
      .from('syllabus_files')
      .select('id, storage_path')
      .eq('subject_id', subject_id)

    const fileCount = syllabusFiles?.length ?? 0

    // ── 4. Delete storage objects (non-fatal — orphaned objects are acceptable) ─
    if (fileCount > 0) {
      const uniquePaths = [...new Set(
        (syllabusFiles ?? []).map(f => f.storage_path).filter(Boolean)
      )]
      if (uniquePaths.length > 0) {
        const { error: storageErr } = await adminSupabase.storage
          .from('syllabuses')
          .remove(uniquePaths)
        if (storageErr) {
          // Log but don't abort — DB cleanup is more important
          logger.error('[DELETE syllabus] Storage remove partial failure', storageErr)
        }
      }
    }

    // ── 5. Delete all syllabus_chunks ─────────────────────────────────────────
    const { error: chunksErr } = await adminSupabase
      .from('syllabus_chunks')
      .delete()
      .eq('subject_id', subject_id)
      .eq('college_id', subject.college_id)

    if (chunksErr) throw new Error(`Failed to delete chunks: ${chunksErr.message}`)

    // ── 6. Delete all syllabus_files ──────────────────────────────────────────
    const { error: filesErr } = await adminSupabase
      .from('syllabus_files')
      .delete()
      .eq('subject_id', subject_id)

    if (filesErr) throw new Error(`Failed to delete syllabus files: ${filesErr.message}`)

    // ── 7. System log ─────────────────────────────────────────────────────────
    try {
      await adminSupabase.from('system_logs').insert({
        college_id: subject.college_id,
        user_id:    user.id,
        event_type: 'syllabus_clear',
        severity:   'warning',
        message:    `Syllabus cleared for: ${subject.name} (${subject_id})`,
        metadata: {
          subject_id,
          college_id:    subject.college_id,
          files_deleted: fileCount,
          cleared_by:    user.id,
        },
      })
    } catch { /* non-fatal */ }

    logger.info('[DELETE /api/super-admin/syllabus/[subject_id]] Cleared', {
      subject_id, subject_name: subject.name, files_deleted: fileCount,
    })

    return Response.json({
      data: {
        subject_id,
        files_deleted: fileCount,
        message: 'Syllabus cleared successfully',
      },
    })

  } catch (err) {
    logger.error('[DELETE /api/super-admin/syllabus/[subject_id]]', err)
    return Response.json({ error: err.message, code: 'DELETE_FAILED' }, { status: 500 })
  }
}
