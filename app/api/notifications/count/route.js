import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// GET /api/notifications/count — return unread notification count for the current user
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) throw error

    return Response.json({ count: count ?? 0 })
  } catch (err) {
    logger.error('[GET /api/notifications/count]', err)
    return Response.json({ error: 'Failed to fetch notification count', code: err.message }, { status: 500 })
  }
}
