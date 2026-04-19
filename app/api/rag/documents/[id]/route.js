/**
 * Phase 11E — DELETE /api/rag/documents/[id]
 *
 * Super admin only.
 * 1. Fetch rag_document row to get vector_ids + storage_path + subject_id
 * 2. Delete vectors from Pinecone namespace
 * 3. Delete file from Supabase Storage
 * 4. Delete DB row
 * 5. If subject has no remaining rag_documents, set subjects.rag_enabled = false
 */

import { createClient }  from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger }        from '@/lib/logger'
import { deleteDocumentVectors } from '@/lib/rag/pinecone'

export async function DELETE(request, { params }) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: profile } = await adminSupabase
    .from('users').select('role').eq('id', user.id).single()

  if (profile?.role !== 'super_admin')
    return Response.json({ error: 'Forbidden — super_admin only' }, { status: 403 })

  const { id } = params

  // ── Fetch document ─────────────────────────────────────────────────────────
  const { data: doc, error: fetchErr } = await adminSupabase
    .from('rag_documents')
    .select('id, subject_id, college_id, storage_path, vector_ids, title')
    .eq('id', id)
    .single()

  if (fetchErr || !doc)
    return Response.json({ error: 'Document not found' }, { status: 404 })

  const errors = []

  // ── 1. Delete vectors from Pinecone ────────────────────────────────────────
  try {
    if (doc.vector_ids?.length > 0) {
      await deleteDocumentVectors(doc.subject_id, doc.vector_ids)
    }
  } catch (err) {
    logger.error('[DELETE /api/rag/documents] Pinecone delete failed', err)
    errors.push(`Pinecone: ${err.message}`)
    // Continue — partial cleanup is better than nothing
  }

  // ── 2. Delete from Storage ─────────────────────────────────────────────────
  try {
    if (doc.storage_path) {
      await adminSupabase.storage
        .from('rag-documents')
        .remove([doc.storage_path])
    }
  } catch (err) {
    logger.error('[DELETE /api/rag/documents] Storage delete failed', err)
    errors.push(`Storage: ${err.message}`)
  }

  // ── 3. Delete DB row ───────────────────────────────────────────────────────
  const { error: deleteErr } = await adminSupabase
    .from('rag_documents')
    .delete()
    .eq('id', id)

  if (deleteErr) {
    logger.error('[DELETE /api/rag/documents] DB delete failed', deleteErr)
    return Response.json({ error: 'Failed to delete document record', detail: deleteErr.message }, { status: 500 })
  }

  // ── 4. Disable RAG if no remaining indexed documents for this subject ───────
  try {
    const { count } = await adminSupabase
      .from('rag_documents')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', doc.subject_id)
      .eq('index_status', 'indexed')

    if ((count ?? 0) === 0) {
      await adminSupabase
        .from('subjects')
        .update({ rag_enabled: false })
        .eq('id', doc.subject_id)
    }
  } catch (err) {
    logger.error('[DELETE /api/rag/documents] rag_enabled update failed', err)
  }

  logger.info('[DELETE /api/rag/documents] Deleted', { id, title: doc.title })

  return Response.json({
    message: 'Document deleted',
    warnings: errors.length > 0 ? errors : undefined,
  })
}
