/**
 * Phase 11C — POST /api/rag/index-document
 *
 * Super admin only. Accepts a PDF + metadata, uploads to Storage,
 * parses + embeds + upserts to Pinecone, and updates rag_documents row.
 *
 * Returns 202 immediately; indexing runs async (fire-and-forget) to avoid
 * Vercel's 60s timeout on large PDFs.
 *
 * Multipart body fields:
 *   file          — PDF file (max 20MB)
 *   subject_id    — UUID
 *   doc_type      — 'textbook' | 'past_paper' | 'model_answer' | 'reference_notes'
 *   title         — display name (e.g. "Basic Electronics – R.K. Rajput")
 */

import { createClient }  from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger }        from '@/lib/logger'
import { chunkText, embedChunks } from '@/lib/rag/embedder'
import { upsertChunks }  from '@/lib/rag/pinecone'
import pdf               from 'pdf-parse'
import { randomUUID }    from 'crypto'

const MAX_SIZE_BYTES = 20 * 1024 * 1024  // 20 MB
const VALID_TYPES    = ['textbook', 'past_paper', 'model_answer', 'reference_notes']

/**
 * Classifies the indexing failure into a user-friendly reason.
 * Returns { short, detail } strings.
 */
function classifyError(err) {
  const msg = err?.message ?? ''

  if (msg.includes('no extractable text') || msg.includes('No text found')) {
    return {
      short:  'Scanned PDF — no text layer',
      detail: 'This PDF contains scanned images, not selectable text. Fix: open it in Google Drive (it auto-OCRs), then download as PDF. Or use Smallpdf.com → OCR PDF. Re-upload the OCR\'d version.',
    }
  }
  if (msg.includes('Invalid PDF') || msg.includes('password') || msg.includes('encrypted')) {
    return {
      short:  'Invalid or password-protected PDF',
      detail: 'The file is corrupted, password-protected, or not a valid PDF. Remove the password and re-upload.',
    }
  }
  if (msg.includes('too few chunks') || msg.includes('empty')) {
    return {
      short:  'PDF has too little text',
      detail: 'The PDF was parsed but produced almost no text. It may be mostly images or diagrams. Try a different version.',
    }
  }
  if (msg.toLowerCase().includes('rate limit') || msg.includes('429')) {
    return {
      short:  'OpenAI rate limit during embedding',
      detail: 'Hit OpenAI rate limits while generating embeddings. Wait a few minutes and try again.',
    }
  }
  if (msg.toLowerCase().includes('pinecone') || msg.toLowerCase().includes('upsert')) {
    return {
      short:  'Pinecone upsert failed',
      detail: `Vector database error: ${msg}. Check your PINECONE_API_KEY and index configuration.`,
    }
  }

  return {
    short:  'Indexing failed',
    detail: msg || 'Unknown error during indexing.',
  }
}

export async function POST(request) {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: profile } = await adminSupabase
    .from('users')
    .select('role, college_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin')
    return Response.json({ error: 'Forbidden — super_admin only' }, { status: 403 })

  // ── 2. Parse multipart ─────────────────────────────────────────────────────
  let formData
  try { formData = await request.formData() }
  catch { return Response.json({ error: 'Invalid multipart body' }, { status: 400 }) }

  const file       = formData.get('file')
  const subject_id = formData.get('subject_id')?.trim()
  const doc_type   = formData.get('doc_type')?.trim()
  const title      = formData.get('title')?.trim()

  if (!file || !(file instanceof Blob))
    return Response.json({ error: 'file is required' }, { status: 400 })
  if (!subject_id)
    return Response.json({ error: 'subject_id is required' }, { status: 400 })
  if (!VALID_TYPES.includes(doc_type))
    return Response.json({ error: `doc_type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })
  if (!title)
    return Response.json({ error: 'title is required' }, { status: 400 })
  if (file.size > MAX_SIZE_BYTES)
    return Response.json({ error: 'File exceeds 20 MB limit' }, { status: 413 })

  // ── 3. Verify subject belongs to a college ─────────────────────────────────
  const { data: subject } = await adminSupabase
    .from('subjects')
    .select('id, name, college_id')
    .eq('id', subject_id)
    .single()

  if (!subject)
    return Response.json({ error: 'Subject not found' }, { status: 404 })

  const collegeId = subject.college_id
  const docId     = randomUUID()
  const fileExt   = (file.name ?? 'document').split('.').pop() ?? 'pdf'
  const storagePath = `${collegeId}/${subject_id}/${docId}.${fileExt}`

  // ── 4. Upload to Supabase Storage ──────────────────────────────────────────
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const { error: storageErr } = await adminSupabase.storage
    .from('rag-documents')
    .upload(storagePath, fileBuffer, {
      contentType: file.type || 'application/pdf',
      upsert: false,
    })

  if (storageErr) {
    logger.error('[POST /api/rag/index-document] Storage upload failed', storageErr)
    return Response.json({ error: 'Storage upload failed', detail: storageErr.message }, { status: 500 })
  }

  // ── 5. Insert rag_documents row with status = 'indexing' ───────────────────
  const { data: ragDoc, error: insertErr } = await adminSupabase
    .from('rag_documents')
    .insert({
      id:           docId,
      subject_id,
      college_id:   collegeId,
      title,
      doc_type,
      storage_path: storagePath,
      index_status: 'indexing',
      uploaded_by:  user.id,
    })
    .select('id')
    .single()

  if (insertErr || !ragDoc) {
    logger.error('[POST /api/rag/index-document] DB insert failed', insertErr)
    return Response.json({ error: 'Failed to create document record' }, { status: 500 })
  }

  // ── 6. Return 202 immediately — indexing runs in background ────────────────
  ;(async () => {
    try {
      // Parse PDF text layer
      let rawText = ''
      try {
        const parsed = await pdf(fileBuffer, { max: 0 })
        rawText = parsed.text ?? ''
      } catch (parseErr) {
        // pdf-parse throws on some malformed PDFs — treat as no-text
        logger.error('[POST /api/rag/index-document] pdf-parse threw', parseErr.message)
        rawText = ''
      }

      if (!rawText.trim()) {
        throw new Error('PDF produced no extractable text')
      }

      // Filter out garbage lines (less than 3 chars, mostly symbols)
      const cleanedText = rawText
        .split('\n')
        .filter(line => line.trim().length > 3)
        .join('\n')

      if (cleanedText.trim().length < 100) {
        throw new Error('PDF has too little text (under 100 characters extracted). It may be a scanned or image-only PDF.')
      }

      // Chunk + embed
      const textChunks     = chunkText(cleanedText, 500, 50)
      const embeddedChunks = await embedChunks(textChunks, {
        subjectId: subject_id,
        docId,
        title,
      })

      // Upsert to Pinecone (namespace = subject_id)
      await upsertChunks(subject_id, embeddedChunks)

      // Store vector IDs in DB for precise deletion later
      const vectorIds = embeddedChunks.map(c => c.id)

      // Update rag_documents: indexed
      await adminSupabase
        .from('rag_documents')
        .update({
          index_status:  'indexed',
          chunk_count:   embeddedChunks.length,
          indexed_at:    new Date().toISOString(),
          vector_ids:    vectorIds,
          error_message: null,
        })
        .eq('id', docId)

      // Enable RAG on the subject
      await adminSupabase
        .from('subjects')
        .update({ rag_enabled: true })
        .eq('id', subject_id)

      logger.info('[POST /api/rag/index-document] Indexed successfully', {
        docId, subject_id, chunks: embeddedChunks.length,
      })

    } catch (err) {
      logger.error('[POST /api/rag/index-document] Indexing failed', err)

      const { short, detail } = classifyError(err)

      await adminSupabase
        .from('rag_documents')
        .update({
          index_status:  'failed',
          error_message: `${short}: ${detail}`,
        })
        .eq('id', docId)

      await adminSupabase.from('system_logs').insert({
        college_id: collegeId,
        user_id:    user.id,
        event_type: 'rag_index_failed',
        severity:   'error',
        message:    `RAG indexing failed for doc "${title}" (${docId}): ${short}`,
        metadata:   { doc_id: docId, subject_id, error: err.message, classified: short },
      }).catch(() => {})
    }
  })()

  return Response.json(
    {
      message:   'Document accepted — indexing started in background',
      data: { doc_id: docId, storage_path: storagePath },
    },
    { status: 202 },
  )
}
