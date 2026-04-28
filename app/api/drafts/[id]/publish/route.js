import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// PATCH /api/drafts/[id]/publish  — toggle is_published on a draft
export async function PATCH(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { id } = params

    // Verify ownership
    const { data: draft } = await adminSupabase
      .from('content_generations')
      .select('id, user_id, is_published, status')
      .eq('id', id)
      .single()

    if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 })
    if (draft.user_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 })
    if (draft.status !== 'completed') return Response.json({ error: 'Only completed drafts can be published' }, { status: 400 })

    const newPublished = !draft.is_published
    const { error } = await adminSupabase
      .from('content_generations')
      .update({
        is_published: newPublished,
        published_at: newPublished ? new Date().toISOString() : null,
        updated_at:   new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
    return Response.json({ is_published: newPublished })
  } catch (err) {
    logger.error('[PATCH /api/drafts/[id]/publish]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
