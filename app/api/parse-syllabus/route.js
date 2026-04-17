/**
 * Phase 10B — AI-Assisted Syllabus Parse Route
 *
 * Two-stage pipeline:
 *   Stage 1: pdf-parse → raw text
 *   Stage 2: GPT-4o JSON extraction → structured chunks
 *
 * DB migration required before deploying (run in Supabase SQL Editor):
 *   ALTER TABLE public.syllabus_chunks
 *     ADD COLUMN IF NOT EXISTS parse_confidence NUMERIC(3,2),
 *     ADD COLUMN IF NOT EXISTS raw_source_text  TEXT;
 *
 *   ALTER TABLE public.syllabus_files
 *     DROP CONSTRAINT IF EXISTS syllabus_files_parse_status_check;
 *   ALTER TABLE public.syllabus_files
 *     ADD CONSTRAINT syllabus_files_parse_status_check
 *     CHECK (parse_status IN ('pending','processing','completed','failed','low_confidence'));
 *
 * NOTE: The 'syllabuses' Supabase Storage bucket must exist (private, PDF only, 10MB limit).
 */

import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { parseSyllabusWithAI } from '@/lib/ai/syllabus-parser'
import { logger } from '@/lib/logger'

const LOW_CONFIDENCE_THRESHOLD = 0.5

// Health check — open in browser to confirm route + dependencies load
export async function GET() {
  try {
    const pdfModule = await import('pdf-parse')
    const fn = pdfModule.default ?? pdfModule
    return Response.json({ ok: true, pdfParseLoaded: typeof fn === 'function', phase: 10 })
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
    const file     = formData.get('file')

    // Accept subject_ids (JSON array) or legacy subject_id (single string)
    let subjectIds = []
    const rawIds   = formData.get('subject_ids')
    const rawId    = formData.get('subject_id')
    if (rawIds) {
      try { subjectIds = JSON.parse(rawIds) } catch { subjectIds = [] }
    } else if (rawId) {
      subjectIds = [rawId]
    }

    if (!file || subjectIds.length === 0)
      return Response.json({ error: 'Missing file or subject_id(s)', code: 'MISSING_FIELDS' }, { status: 400 })

    if (file.type !== 'application/pdf')
      return Response.json({ error: 'Only PDF files are allowed', code: 'INVALID_TYPE' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

    if (buffer.length > 10 * 1024 * 1024)
      return Response.json({ error: 'File too large (max 10MB)', code: 'FILE_TOO_LARGE' }, { status: 413 })

    // ── 3. Validate all subjects exist (no college_id restriction for super_admin) ─
    step = 'validate-subjects'
    const { data: subjects, error: subjectErr } = await adminSupabase
      .from('subjects')
      .select('id, name, college_id')
      .in('id', subjectIds)

    if (subjectErr || !subjects || subjects.length === 0)
      return Response.json({ error: 'No valid subjects found', code: 'SUBJECT_NOT_FOUND' }, { status: 404 })

    const collegeIds = [...new Set(subjects.map(s => s.college_id))]
    if (collegeIds.length > 1)
      return Response.json({ error: 'All subjects must belong to the same college', code: 'COLLEGE_MISMATCH' }, { status: 400 })

    collegeId = collegeIds[0]
    const primarySubject = subjects[0]

    // ── 4. Upload PDF to Supabase Storage ────────────────────────────────────
    step = 'storage-upload'
    const filename    = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${collegeId}/${primarySubject.id}/${filename}`

    const { error: uploadErr } = await adminSupabase.storage
      .from('syllabuses')
      .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true })

    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

    // ── 5. Insert syllabus_files rows (one per subject_id) ───────────────────
    step = 'insert-syllabus-files'
    const fileRows = subjects.map(s => ({
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
    insertedFiles.forEach(f => insertedFileIds.push(f.id))

    // Map subject_id → syllabus_file_id
    const fileIdBySubject = Object.fromEntries(insertedFiles.map(f => [f.subject_id, f.id]))

    // ── 6. Extract text with pdf-parse ────────────────────────────────────────
    step = 'pdf-parse'
    const pdfModule = await import('pdf-parse')
    const pdfParse  = pdfModule.default ?? pdfModule
    const pdfData   = await pdfParse(buffer)
    const rawText   = pdfData.text ?? ''

    if (!rawText.trim()) throw new Error('PDF text extraction returned empty content')

    // ── 7. AI-assisted structured extraction ─────────────────────────────────
    // parseSyllabusWithAI uses GPT-4o (JSON mode) to produce clean, structured chunks
    step = 'ai-extraction'
    logger.info('[parse-syllabus] Starting AI extraction', { subjectIds, textLen: rawText.length })

    // We parse once for the primary subject; fan-out to other subjects below
    const aiChunks = await parseSyllabusWithAI(
      rawText,
      primarySubject.id,
      fileIdBySubject[primarySubject.id],
      collegeId,
      primarySubject.name,
    )

    logger.info('[parse-syllabus] AI extraction complete', { chunks: aiChunks.length })

    // ── 8. Delete old chunks for ALL subject_ids, then bulk insert ────────────
    step = 'delete-old-chunks'
    await adminSupabase
      .from('syllabus_chunks')
      .delete()
      .in('subject_id', subjectIds)
      .eq('college_id', collegeId)

    step = 'insert-chunks'
    // Fan out: same chunk content for each subject_id, linked to its file row
    const chunkRows = subjects.flatMap(s =>
      aiChunks.map(c => ({
        subject_id:        s.id,
        college_id:        collegeId,
        syllabus_file_id:  fileIdBySubject[s.id] ?? null,
        unit_number:       c.unit_number,
        topic:             c.topic,
        subtopics:         c.subtopics,
        raw_text:          c.raw_text,
        // Phase 10 columns (graceful if migration not yet run)
        ...(c.raw_source_text   != null ? { raw_source_text:  c.raw_source_text  } : {}),
        ...(c.parse_confidence  != null ? { parse_confidence: c.parse_confidence } : {}),
      }))
    )

    const { error: chunksErr } = await adminSupabase
      .from('syllabus_chunks')
      .insert(chunkRows)

    if (chunksErr) throw new Error(`Failed to insert chunks: ${chunksErr.message}`)

    // ── 9. Compute average confidence + determine final parse_status ──────────
    step = 'mark-completed'
    const avgConfidence = aiChunks.length > 0
      ? aiChunks.reduce((s, c) => s + (c.parse_confidence ?? 0), 0) / aiChunks.length
      : 0

    const finalStatus = avgConfidence < LOW_CONFIDENCE_THRESHOLD && aiChunks.length > 0
      ? 'low_confidence'
      : 'completed'

    // Try to use low_confidence status; fall back to 'completed' if DB constraint not yet updated
    let markErr = null
    try {
      const { error } = await adminSupabase
        .from('syllabus_files')
        .update({ parse_status: finalStatus })
        .in('id', insertedFileIds)
      markErr = error
    } catch {}

    if (markErr) {
      // DB constraint may not include 'low_confidence' yet — fall back gracefully
      await adminSupabase
        .from('syllabus_files')
        .update({ parse_status: 'completed' })
        .in('id', insertedFileIds)
    }

    // ── 10. Write system_log ─────────────────────────────────────────────────
    try {
      await adminSupabase.from('system_logs').insert({
        college_id: collegeId,
        user_id:    user.id,
        event_type: 'syllabus_parse',
        severity:   avgConfidence < LOW_CONFIDENCE_THRESHOLD ? 'warning' : 'info',
        message:    `Syllabus parsed (AI): ${filename} — avg confidence ${(avgConfidence * 100).toFixed(0)}%`,
        metadata: {
          subject_ids:      subjectIds,
          college_id:       collegeId,
          chunks_created:   aiChunks.length,
          dept_count:       subjects.length,
          file_name:        filename,
          avg_confidence:   Number(avgConfidence.toFixed(2)),
          final_status:     finalStatus,
        },
      })
    } catch { /* non-fatal */ }

    logger.info('[parse-syllabus] Done', {
      subjectIds,
      chunks: aiChunks.length,
      depts: subjects.length,
      avgConfidence: avgConfidence.toFixed(2),
      finalStatus,
    })

    return Response.json({
      data: {
        syllabus_file_ids: insertedFileIds,
        chunks_created:    aiChunks.length,
        dept_count:        subjects.length,
        file_name:         filename,
        avg_confidence:    Number(avgConfidence.toFixed(2)),
        parse_status:      finalStatus,
      },
    }, { status: 201 })

  } catch (err) {
    logger.error('[POST /api/parse-syllabus]', err)

    // Mark failed files
    if (insertedFileIds.length > 0) {
      try {
        await adminSupabase
          .from('syllabus_files')
          .update({ parse_status: 'failed' })
          .in('id', insertedFileIds)
      } catch { /* non-fatal */ }
    }

    // Write error log
    try {
      await adminSupabase.from('system_logs').insert({
        college_id: collegeId ?? null,
        event_type: 'syllabus_parse',
        severity:   'error',
        message:    err.message,
        metadata:   { step, error: err.message, syllabus_file_ids: insertedFileIds },
      })
    } catch { /* non-fatal */ }

    return Response.json({ error: `[${step}] ${err.message}`, code: step }, { status: 500 })
  }
}
