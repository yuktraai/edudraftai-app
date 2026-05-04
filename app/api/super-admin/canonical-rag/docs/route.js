/**
 * Phase 51 — GET /api/super-admin/canonical-rag/docs?code=TH2
 *
 * Returns canonical_rag_documents rows for a given subject code.
 * super_admin only.
 */

import { createClient }   from '@/lib/supabase/server'
import { adminSupabase }  from '@/lib/supabase/admin'
import { logger }         from '@/lib/logger'

export async function GET(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin')
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')?.trim().toUpperCase()
    if (!code) return Response.json({ error: 'code query parameter required' }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('canonical_rag_documents')
      .select('id, subject_code, title, doc_type, index_status, chunk_count, error_message, indexed_at, created_at')
      .eq('subject_code', code)
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json({ docs: data ?? [] })
  } catch (err) {
    logger.error('[GET /api/super-admin/canonical-rag/docs]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
