import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/super-admin/logs?college_id=&severity=&event_type=&date_from=
export async function GET(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role').eq('id', user.id).single()

    if (profile?.role !== 'super_admin')
      return Response.json({ error: 'Forbidden — super_admin only' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const collegeId  = searchParams.get('college_id')
    const severity   = searchParams.get('severity')
    const eventType  = searchParams.get('event_type')
    const dateFrom   = searchParams.get('date_from')

    let query = adminSupabase
      .from('system_logs')
      .select(`
        id, event_type, severity, message, metadata, created_at,
        college_id, user_id,
        colleges ( name ),
        users ( name )
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    if (collegeId) query = query.eq('college_id', collegeId)
    if (severity)  query = query.eq('severity', severity)
    if (eventType) query = query.eq('event_type', eventType)
    if (dateFrom)  query = query.gte('created_at', new Date(dateFrom).toISOString())

    const { data, error } = await query
    if (error) throw error

    return Response.json({ data: data ?? [] })
  } catch (err) {
    logger.error('[GET /api/super-admin/logs]', err)
    return Response.json({ error: 'Failed to fetch logs', code: err.message }, { status: 500 })
  }
}
