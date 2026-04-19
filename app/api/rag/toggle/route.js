/**
 * Phase 11E — PATCH /api/rag/toggle
 *
 * Super admin only. Toggle RAG on/off for a subject.
 * Body: { subject_id: string, enabled: boolean }
 */

import { createClient }  from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger }        from '@/lib/logger'

export async function PATCH(request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: profile } = await adminSupabase
    .from('users').select('role').eq('id', user.id).single()

  if (profile?.role !== 'super_admin')
    return Response.json({ error: 'Forbidden — super_admin only' }, { status: 403 })

  let body
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { subject_id, enabled } = body
  if (!subject_id) return Response.json({ error: 'subject_id required' }, { status: 400 })
  if (typeof enabled !== 'boolean') return Response.json({ error: 'enabled must be boolean' }, { status: 400 })

  const { data, error } = await adminSupabase
    .from('subjects')
    .update({ rag_enabled: enabled })
    .eq('id', subject_id)
    .select('id, name, rag_enabled')
    .single()

  if (error) {
    logger.error('[PATCH /api/rag/toggle]', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ data })
}
