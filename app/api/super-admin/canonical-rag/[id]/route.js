/**
 * Phase 51.5 — DELETE /api/super-admin/canonical-rag/[id]
 *
 * Deletes a canonical RAG document:
 * 1. Removes its vectors from Pinecone (canonicalNamespace)
 * 2. Removes the file from Supabase Storage
 * 3. Deletes the DB row
 * 4. Logs affected college count to system_logs
 *
 * super_admin only.
 */

import { createClient }   from '@/lib/supabase/server'
import { adminSupabase }  from '@/lib/supabase/admin'
import { logger }         from '@/lib/logger'
import { deleteDocumentVectors, canonicalNamespace } from '@/lib/rag/pinecone'

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin')
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    // ── Fetch document ────────────────────────────────────────────────────────
    const { data: doc } = await adminSupabase
      .from('canonical_rag_documents')
      .select('id, subject_code, title, storage_path, vector_ids')
      .eq('id', id)
      .single()

    if (!doc)
      return Response.json({ error: 'Document not found' }, { status: 404 })

    // ── Delete Pinecone vectors ────────────────────────────────────────────────
    if (doc.vector_ids?.length > 0) {
      try {
        const ns = canonicalNamespace(doc.subject_code)
        await deleteDocumentVectors(ns, doc.vector_ids)
      } catch (pineconeErr) {
        logger.error('[canonical-rag DELETE] Pinecone deletion failed', pineconeErr.message)
        // Continue — better to have orphan vectors than a stuck record
      }
    }

    // ── Delete from Storage ───────────────────────────────────────────────────
    if (doc.storage_path) {
      try {
        await adminSupabase.storage.from('rag-documents').remove([doc.storage_path])
      } catch (storageErr) {
        logger.error('[canonical-rag DELETE] Storage deletion failed', storageErr.message)
        // Non-fatal — continue
      }
    }

    // ── Delete DB row ─────────────────────────────────────────────────────────
    const { error: deleteError } = await adminSupabase
      .from('canonical_rag_documents')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    // ── Log affected colleges ─────────────────────────────────────────────────
    try {
      const { count: affectedColleges } = await adminSupabase
        .from('subjects')
        .select('id', { count: 'exact', head: true })
        .ilike('code', doc.subject_code)
        .eq('rag_enabled', true)

      await adminSupabase.from('system_logs').insert({
        event_type: 'canonical_rag_deleted',
        severity:   'info',
        message:    `Canonical RAG document deleted: ${doc.title} (${doc.subject_code})`,
        metadata:   {
          doc_id:           id,
          subject_code:     doc.subject_code,
          affected_colleges: affectedColleges ?? 0,
          deleted_by:       user.id,
        },
      })
    } catch {}

    return Response.json({ message: 'Canonical document deleted successfully' })
  } catch (err) {
    logger.error('[DELETE /api/super-admin/canonical-rag/[id]]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
