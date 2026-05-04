import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

async function verifySuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('id, role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? { ...user, id: profile.id } : null
}

// POST /api/super-admin/copy-department
// Body: { src_college_id, src_dept_id, tgt_college_id, tgt_dept_id }
//
// Copies all subjects (and their syllabus chunks) from one department to another.
// Subjects whose code already exists in the target college are skipped.
// Does NOT call the Postgres RPC — performs copy in application code.
export async function POST(request) {
  const user = await verifySuperAdmin()
  if (!user) return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })

  try {
    const body = await request.json()
    const { src_college_id, src_dept_id, tgt_college_id, tgt_dept_id } = body

    if (!src_college_id || !src_dept_id || !tgt_college_id || !tgt_dept_id) {
      return Response.json(
        { error: 'Missing required fields: src_college_id, src_dept_id, tgt_college_id, tgt_dept_id', code: 'VALIDATION_ERROR' },
        { status: 422 }
      )
    }
    if (src_college_id === tgt_college_id && src_dept_id === tgt_dept_id) {
      return Response.json(
        { error: 'Source and target department cannot be the same', code: 'VALIDATION_ERROR' },
        { status: 422 }
      )
    }

    // ── Verify both departments exist ─────────────────────────────────────────
    const [srcDeptRes, tgtDeptRes] = await Promise.all([
      adminSupabase.from('departments').select('id, name').eq('id', src_dept_id).eq('college_id', src_college_id).single(),
      adminSupabase.from('departments').select('id, name').eq('id', tgt_dept_id).eq('college_id', tgt_college_id).single(),
    ])

    if (srcDeptRes.error || !srcDeptRes.data)
      return Response.json({ error: 'Source department not found', code: 'NOT_FOUND' }, { status: 404 })
    if (tgtDeptRes.error || !tgtDeptRes.data)
      return Response.json({ error: 'Target department not found', code: 'NOT_FOUND' }, { status: 404 })

    // ── Fetch source subjects ─────────────────────────────────────────────────
    const { data: srcSubjects, error: srcErr } = await adminSupabase
      .from('subjects')
      .select('id, name, code, semester, is_active, has_math, rag_enabled')
      .eq('college_id', src_college_id)
      .eq('department_id', src_dept_id)

    if (srcErr) throw srcErr
    if (!srcSubjects || srcSubjects.length === 0) {
      return Response.json({
        success:         true,
        subjects_copied: 0,
        chunks_copied:   0,
        src_dept_name:   srcDeptRes.data.name,
        tgt_dept_name:   tgtDeptRes.data.name,
        message:         'Source department has no subjects to copy.',
      })
    }

    // ── Fetch existing subject codes in target DEPARTMENT only ───────────────
    // (UNIQUE constraint is college-level, but duplicate check is dept-level so
    //  subjects that exist in OTHER departments don't block this copy)
    const { data: existingInDept } = await adminSupabase
      .from('subjects')
      .select('code')
      .eq('college_id', tgt_college_id)
      .eq('department_id', tgt_dept_id)

    const existingDeptCodes = new Set((existingInDept ?? []).map(s => s.code?.trim().toUpperCase()))

    // ── Copy subjects that don't already exist in target DEPARTMENT ───────────
    const subjectsToCopy = srcSubjects.filter(
      s => !existingDeptCodes.has(s.code?.trim().toUpperCase())
    )

    let subjectsCopied = 0
    let chunksCopied   = 0
    let conflicts      = 0   // codes that exist in another dept of target college

    for (const src of subjectsToCopy) {
      // Insert new subject into target college / department
      const { data: newSubject, error: insertErr } = await adminSupabase
        .from('subjects')
        .insert({
          college_id:    tgt_college_id,
          department_id: tgt_dept_id,
          name:          src.name,
          code:          src.code,
          semester:      src.semester,
          is_active:     src.is_active,
          has_math:      src.has_math ?? false,
          rag_enabled:   false,   // RAG is opt-in per college — never copy the flag
        })
        .select('id')
        .single()

      if (insertErr) {
        // unique_violation = code exists in a different dept of the same college
        if (insertErr.code === '23505') {
          conflicts++
          logger.error('[copy-department] code conflict in another dept', { code: src.code })
        } else {
          logger.error('[copy-department] subject insert failed', { code: src.code, err: insertErr.message })
        }
        continue
      }

      subjectsCopied++

      // ── Copy syllabus chunks for this subject ────────────────────────────
      const { data: srcChunks } = await adminSupabase
        .from('syllabus_chunks')
        .select('unit_number, topic, subtopics, raw_text')
        .eq('subject_id', src.id)
        .eq('college_id', src_college_id)

      if (srcChunks && srcChunks.length > 0) {
        const chunkRows = srcChunks.map(c => ({
          subject_id:       newSubject.id,
          college_id:       tgt_college_id,
          syllabus_file_id: null,   // no file association on copy
          unit_number:      c.unit_number,
          topic:            c.topic,
          subtopics:        c.subtopics,
          raw_text:         c.raw_text,
        }))

        const { error: chunkErr } = await adminSupabase
          .from('syllabus_chunks')
          .insert(chunkRows)

        if (chunkErr) {
          logger.error('[copy-department] chunk insert failed', { subject_id: newSubject.id, err: chunkErr.message })
        } else {
          chunksCopied += chunkRows.length
        }
      }
    }

    // ── Log to system_logs ─────────────────────────────────────────────────────
    try {
      await adminSupabase.from('system_logs').insert({
        event_type: 'department_copied',
        severity:   'info',
        message:    `Copied ${subjectsCopied} subjects (${chunksCopied} chunks) from ${srcDeptRes.data.name} → ${tgtDeptRes.data.name}`,
        metadata:   {
          src_college_id, src_dept_id,
          tgt_college_id, tgt_dept_id,
          subjects_copied: subjectsCopied,
          chunks_copied:   chunksCopied,
          skipped_dept:    existingDeptCodes.size,
          skipped_conflict: conflicts,
          performed_by:    user.id,
        },
      })
    } catch {}

    return Response.json({
      success:          true,
      subjects_copied:  subjectsCopied,
      chunks_copied:    chunksCopied,
      skipped:          existingDeptCodes.size,
      conflicts:        conflicts,
      src_dept_name:    srcDeptRes.data.name,
      tgt_dept_name:    tgtDeptRes.data.name,
    })

  } catch (err) {
    logger.error('POST /api/super-admin/copy-department — unexpected', err)
    return Response.json({ error: 'Internal server error: ' + err.message, code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
