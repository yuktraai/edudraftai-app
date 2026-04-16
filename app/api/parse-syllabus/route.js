// NOTE: The 'syllabuses' Supabase Storage bucket must be created in the
// Supabase dashboard with the following settings:
//   - Bucket name: syllabuses
//   - Public: false (private)
//   - Allowed MIME types: application/pdf

import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

function chunkByUnits(text, subjectName) {
  const unitRegex = /^(UNIT|Unit|Chapter|MODULE)\s+[\dIVX]+.*$/gm
  const matches = [...text.matchAll(unitRegex)]
  if (matches.length === 0) {
    return [{ unit_number: 1, topic: subjectName, subtopics: [], raw_text: text.slice(0, 2000) }]
  }
  return matches.map((match, i) => {
    const start = match.index
    const end = matches[i + 1]?.index ?? text.length
    const chunkText = text.slice(start, end)
    const lines = chunkText.split('\n').filter((l) => l.trim())
    const subtopics = lines.slice(1, 8).map((l) => l.trim()).filter(Boolean)
    return {
      unit_number: i + 1,
      topic:       match[0].trim(),
      subtopics,
      raw_text:    chunkText.slice(0, 2000),
    }
  })
}

// Health check — open in browser to confirm route loads and pdf-parse is reachable
export async function GET() {
  try {
    const m  = await import('pdf-parse')
    const fn = m.default ?? m
    return Response.json({ ok: true, pdfParseLoaded: typeof fn === 'function' })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  const insertedFileIds = []
  let collegeId = null
  let step = 'init'

  try {
    // ── 1. Auth: super_admin only ─────────────────────────────────────────────
    step = 'auth'
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

    // ── 2. Parse multipart form ───────────────────────────────────────────────
    step = 'formdata'
    const formData = await request.formData()
    const file = formData.get('file')

    // Accept subject_ids (JSON array, preferred) or legacy subject_id (string)
    let subjectIds = []
    const rawIds = formData.get('subject_ids')
    const rawId  = formData.get('subject_id')
    if (rawIds) {
      try { subjectIds = JSON.parse(rawIds) } catch { subjectIds = [] }
    } else if (rawId) {
      subjectIds = [rawId]
    }

    if (!file || subjectIds.length === 0)
      return Response.json({ error: 'Missing file or subject_id(s)', code: 'MISSING_FIELDS' }, { status: 400 })

    if (file.type !== 'application/pdf')
      return Response.json({ error: 'Only PDF files are allowed', code: 'INVALID_TYPE' }, { status: 400 })

    // ── 3. Validate all subjects exist (no college_id restriction for super_admin) ─
    step = 'validate-subjects'
    const { data: subjects, error: subjectErr } = await adminSupabase
      .from('subjects')
      .select('id, name, college_id')
      .in('id', subjectIds)

    if (subjectErr || !subjects || subjects.length === 0)
      return Response.json({ error: 'No valid subjects found', code: 'SUBJECT_NOT_FOUND' }, { status: 404 })

    // All subjects must belong to the same college
    const colleges = [...new Set(subjects.map((s) => s.college_id))]
    if (colleges.length > 1)
      return Response.json({ error: 'All subjects must belong to the same college', code: 'COLLEGE_MISMATCH' }, { status: 400 })

    collegeId = colleges[0]
    const primarySubject = subjects[0]

    // ── 4. Upload PDF to Supabase Storage (once, under primary subject path) ──
    step = 'storage-upload'
    const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${collegeId}/${primarySubject.id}/${filename}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadErr } = await adminSupabase.storage
      .from('syllabuses')
      .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true })

    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

    // ── 5. Insert syllabus_files row for EACH subject_id ─────────────────────
    step = 'insert-syllabus-files'
    // NOTE: syllabus_files has no updated_at column — only created_at + parse_status
    const fileRows = subjects.map((s) => ({
      subject_id:   s.id,
      college_id:   collegeId,
      file_name:    filename,
      storage_path: storagePath,
      parse_status: 'processing',
      uploaded_by:  user.id,
    }))

    const { data: insertedFiles, error: insertFileErr } = await adminSupabase
      .from('syllabus_files')
      .insert(fileRows)
      .select('id, subject_id')

    if (insertFileErr) throw new Error(`Failed to insert syllabus_files: ${insertFileErr.message}`)
    insertedFiles.forEach((f) => insertedFileIds.push(f.id))

    // Build a map from subject_id → syllabus_file_id for linking chunks
    const fileIdBySubject = Object.fromEntries(insertedFiles.map((f) => [f.subject_id, f.id]))

    // ── 6. Parse PDF text ────────────────────────────────────────────────────
    step = 'pdf-parse'
    // Imported lazily (inside the handler) so Next.js build never evaluates it.
    // serverExternalPackages in next.config.mjs ensures Node uses native fs at runtime.
    const pdfModule = await import('pdf-parse')
    const pdfParse  = pdfModule.default ?? pdfModule
    const pdfData   = await pdfParse(buffer)
    const text      = pdfData.text

    // ── 7. Chunk by unit headings ─────────────────────────────────────────────
    step = 'chunking'
    const chunks = chunkByUnits(text, primarySubject.name)

    // ── 8. Delete old chunks for ALL subject_ids, then bulk insert ────────────
    step = 'delete-old-chunks'
    await adminSupabase
      .from('syllabus_chunks')
      .delete()
      .in('subject_id', subjectIds)
      .eq('college_id', collegeId)

    step = 'insert-chunks'
    // Fan out: same chunk content inserted for each subject_id, linked to its file
    const chunkRows = subjects.flatMap((s) =>
      chunks.map((c) => ({
        subject_id:       s.id,
        college_id:       collegeId,
        syllabus_file_id: fileIdBySubject[s.id] ?? null,
        unit_number:      c.unit_number,
        topic:            c.topic,
        subtopics:        c.subtopics,
        raw_text:         c.raw_text,
      }))
    )

    const { error: chunksErr } = await adminSupabase
      .from('syllabus_chunks')
      .insert(chunkRows)

    if (chunksErr) throw new Error(`Failed to insert chunks: ${chunksErr.message}`)

    // ── 9. Mark all syllabus_files as completed ───────────────────────────────
    step = 'mark-completed'
    // No updated_at column — only update parse_status
    const { error: updateErr } = await adminSupabase
      .from('syllabus_files')
      .update({ parse_status: 'completed' })
      .in('id', insertedFileIds)

    if (updateErr) throw new Error(`Failed to mark files completed: ${updateErr.message}`)

    // ── 10. Write success system_log ─────────────────────────────────────────
    try {
      await adminSupabase.from('system_logs').insert({
        college_id: collegeId,
        user_id:    user.id,
        event_type: 'syllabus_parse',
        severity:   'info',
        message:    `Syllabus parsed successfully: ${filename}`,
        metadata: {
          subject_ids:    subjectIds,
          college_id:     collegeId,
          chunks_created: chunks.length,
          dept_count:     subjects.length,
          file_name:      filename,
        },
      })
    } catch { /* non-fatal */ }

    logger.info('[parse-syllabus] Success', { subjectIds, chunks: chunks.length, depts: subjects.length })

    return Response.json({
      data: {
        syllabus_file_ids: insertedFileIds,
        chunks_created:    chunks.length,
        dept_count:        subjects.length,
        file_name:         filename,
      },
    }, { status: 201 })

  } catch (err) {
    logger.error('[POST /api/parse-syllabus]', err)

    // Mark any inserted file rows as failed (no updated_at column)
    if (insertedFileIds.length > 0) {
      try {
        await adminSupabase
          .from('syllabus_files')
          .update({ parse_status: 'failed' })
          .in('id', insertedFileIds)
      } catch { /* non-fatal */ }
    }

    // Write error system_log (non-fatal)
    try {
      await adminSupabase.from('system_logs').insert({
        college_id: collegeId ?? null,
        event_type: 'syllabus_parse',
        severity:   'error',
        message:    err.message,
        metadata:   { error: err.message, syllabus_file_ids: insertedFileIds },
      })
    } catch { /* non-fatal */ }

    return Response.json({ error: `[${step}] ${err.message}`, code: step }, { status: 500 })
  }
}
