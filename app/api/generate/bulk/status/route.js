import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export async function GET(request) {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  // ── 2. Get parent_id from query params ───────────────────────────────────
  const { searchParams } = new URL(request.url)
  const parentId = searchParams.get('parent_id')

  if (!parentId)
    return Response.json({ error: 'parent_id is required' }, { status: 400 })

  // ── 3. Fetch parent generation row ────────────────────────────────────────
  const { data: parent, error: parentErr } = await adminSupabase
    .from('content_generations')
    .select('id, status, metadata')
    .eq('id', parentId)
    .eq('user_id', user.id)
    .single()

  if (parentErr || !parent) {
    logger.error('[GET /api/generate/bulk/status] Parent not found', { parentId, userId: user.id })
    return Response.json({ error: 'Generation not found' }, { status: 404 })
  }

  // ── 4. Fetch child generation rows ───────────────────────────────────────
  const { data: children, error: childrenErr } = await adminSupabase
    .from('content_generations')
    .select('id, status, prompt_params')
    .eq('parent_generation_id', parentId)
    .eq('user_id', user.id)

  if (childrenErr) {
    logger.error('[GET /api/generate/bulk/status] Failed to fetch children', childrenErr)
    return Response.json({ error: 'Failed to fetch generation status' }, { status: 500 })
  }

  const childList  = children ?? []
  const completed  = childList.filter(c => c.status === 'completed').length
  const failed     = childList.filter(c => c.status === 'failed').length
  const total      = parent.metadata?.topic_count ?? childList.length

  return Response.json({
    total,
    completed,
    failed,
    status: parent.status,
  })
}
