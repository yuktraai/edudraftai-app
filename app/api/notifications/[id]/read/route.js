import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// PATCH /api/notifications/[id]/read — mark a single notification as read
export async function PATCH(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { id } = params

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      // RLS policy ensures user_id = auth.uid(), so this is defence-in-depth
      .eq('user_id', user.id)

    if (error) throw error

    return Response.json({ success: true })
  } catch (err) {
    logger.error('[PATCH /api/notifications/[id]/read]', err)
    return Response.json({ error: 'Failed to mark notification as read', code: err.message }, { status: 500 })
  }
}
