import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// GET /api/notifications — list last 20 notifications for the current user
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return Response.json({ notifications: notifications ?? [] })
  } catch (err) {
    logger.error('[GET /api/notifications]', err)
    return Response.json({ error: 'Failed to fetch notifications', code: err.message }, { status: 500 })
  }
}

// PATCH /api/notifications — mark all notifications as read for the current user
export async function PATCH() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) throw error

    return Response.json({ success: true })
  } catch (err) {
    logger.error('[PATCH /api/notifications]', err)
    return Response.json({ error: 'Failed to mark notifications as read', code: err.message }, { status: 500 })
  }
}
