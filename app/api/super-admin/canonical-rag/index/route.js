/**
 * Phase 51.4 — POST /api/super-admin/canonical-rag/index
 *
 * Uploads a reference PDF for a canonical SCTEVT subject code,
 * parses + chunks + embeds it, and upserts vectors to Pinecone
 * under the canonical namespace ("code:TH2").
 *
 * super_admin only. maxDuration=60 (Vercel free tier cap).
 * Does NOT auto-toggle subjects.rag_enabled — that stays manual.
 */

import { createClient }        from '@/lib/supabase/server'
import { adminSupabase }       from '@/lib/supabase/admin'
import { logger }              from '@/lib/logger'
import { chunkText, embedChunks } from '@/lib/rag/embedder'
import { upsertChunks, canonicalNamespace } from '@/lib/rag/pinecone'
import pdf                     from 'pdf-parse/lib/pdf-parse.js'
import { randomUUID }          from 'crypto'

export const maxDuration = 60

const MAX_FILE_SIZE = 20 * 1024 * 1024  // 20 MB

function classifyError(err) {
  const msg = err?.message ?? ''
  if (msg.includes('password') || msg.includes('encrypt'))
    return { userMessage: 'This PDF is password-protected. Please remove the password and re-upload.', code: 'PDF_ENCRYPTED' }
  if (msg.includes('No text') || msg.includes('no extractable'))
    return { userMessage: 'No readable text found. Please upload a text-based PDF, not a scanned image.', code: 'PDF_NO_TEXT' }
  return { userMessage: `Processing failed: ${msg}`, code: 'PROCESSING_ERROR' }
}

export async function POST(request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin')
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    // ── Parse multipart ───────────────────────────────────────────────────────
    const formData    = await request.formData()
    const file        = formData.get('file')
    const subjectCode = formData.get('subject_code')
    const docType     = formData.get('doc_type')
    const title       = formData.get('title')

    if (!file || !subjectCode || !docType || !title)
      return Response.json({ error: 'file, subject_code, doc_type, and title are required' }, { status: 400 })

    const validDocTypes = ['textbook', 'past_paper', 'model_answer', 'reference_notes']
    if (!validDocTypes.includes(docType))
      return Response.json({ error: `doc_type must be one of: ${validDocTypes.join(', ')}` }, { status: 400 })

    if (file.size > MAX_FILE_SIZE)
      return Response.json({ error: 'File too large. Maximum size is 20 MB.' }, { status: 413 })

    if (file.type !== 'application/pdf')
      return Response.json({ error: 'Only PDF files are accepted.' }, { status: 400 })

    // ── Normalize code ────────────────────────────────────────────────────────
    const normalizedCode = subjectCode.trim().toUpperCase()

    // ── Verify subject code exists ────────────────────────────────────────────
    const { data: codeCheck } = await adminSupabase
      .from('subjects')
      .select('id')
      .ilike('code', normalizedCode)
      .limit(1)
      .maybeSingle()

    if (!codeCheck)
      return Response.json({ error: `Subject code "${normalizedCode}" not found in any college. Verify the code and try again.` }, { status: 404 })

    // ── Upload to Supabase Storage ────────────────────────────────────────────
    const docId       = randomUUID()
    const storagePath = `canonical/${normalizedCode}/${docId}.pdf`
    const fileBuffer  = Buffer.from(await file.arrayBuffer())

    const { error: storageError } = await adminSupabase.storage
      .from('rag-documents')
      .upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: false })

    if (storageError)
      return Response.json({ error: `Storage upload failed: ${storageError.message}` }, { status: 500 })

    // ── Insert DB row (status: indexing) ──────────────────────────────────────
    const { data: docRow, error: insertError } = await adminSupabase
      .from('canonical_rag_documents')
      .insert({
        id:           docId,
        subject_code: normalizedCode,
        title,
        doc_type:     docType,
        storage_path: storagePath,
        index_status: 'indexing',
        uploaded_by:  user.id,
      })
      .select('id')
      .single()

    if (insertError) {
      // Clean up storage if DB insert fails
      await adminSupabase.storage.from('rag-documents').remove([storagePath])
      throw insertError
    }

    // ── Parse PDF ─────────────────────────────────────────────────────────────
    let rawText
    try {
      const parsed = await pdf(fileBuffer)
      rawText = parsed.text ?? ''
      if (!rawText.trim())
        throw new Error('No extractable text found in PDF.')
    } catch (pdfErr) {
      const { userMessage, code } = classifyError(pdfErr)
      await adminSupabase
        .from('canonical_rag_documents')
        .update({ index_status: 'failed', error_message: userMessage, updated_at: new Date().toISOString() })
        .eq('id', docId)
      return Response.json({ error: userMessage, code }, { status: 422 })
    }

    // ── Chunk + Embed + Upsert ────────────────────────────────────────────────
    const textChunks    = chunkText(rawText, 500, 50)
    const embeddedChunks = await embedChunks(textChunks, {
      subjectCode: normalizedCode,
      docId,
      title,
    })

    const ns = canonicalNamespace(normalizedCode)
    await upsertChunks(ns, embeddedChunks)

    const vectorIds = embeddedChunks.map(c => c.id)

    // ── Update DB row: indexed ─────────────────────────────────────────────────
    await adminSupabase
      .from('canonical_rag_documents')
      .update({
        index_status: 'indexed',
        chunk_count:  textChunks.length,
        vector_ids:   vectorIds,
        indexed_at:   new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })
      .eq('id', docId)

    // ── Log to system_logs ────────────────────────────────────────────────────
    try {
      await adminSupabase.from('system_logs').insert({
        event_type:  'canonical_rag_indexed',
        severity:    'info',
        message:     `Canonical RAG indexed: ${title} (${normalizedCode}) — ${textChunks.length} chunks`,
        metadata:    { doc_id: docId, subject_code: normalizedCode, doc_type: docType, chunk_count: textChunks.length, uploaded_by: user.id },
      })
    } catch {}

    return Response.json({
      message: `Successfully indexed "${title}" with ${textChunks.length} chunks.`,
      data: { doc_id: docId, chunk_count: textChunks.length },
    })
  } catch (err) {
    logger.error('[POST /api/super-admin/canonical-rag/index]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
