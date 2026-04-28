import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

async function getSuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await adminSupabase
    .from('users').select('role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? user : null
}

// GET /api/super-admin/tickets?status=&category=&priority=&limit=
export async function GET(request) {
  try {
    const admin = await getSuperAdmin()
    if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const status   = searchParams.get('status')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')
    const limit    = Math.min(Number(searchParams.get('limit') ?? 100), 500)

    let query = adminSupabase
      .from('support_tickets')
      .select(`
        id, ticket_number, subject, category, priority, status,
        created_at, updated_at, resolved_at,
        users(name, email, role),
        colleges(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status)   query = query.eq('status', status)
    if (category) query = query.eq('category', category)
    if (priority) query = query.eq('priority', priority)

    const { data, error } = await query
    if (error) throw error

    // Stats
    const { data: stats } = await adminSupabase
      .from('support_tickets')
      .select('status, resolved_at')

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const statCounts = {
      open:        0,
      in_progress: 0,
      resolved_week: 0,
    }
    for (const t of stats ?? []) {
      if (t.status === 'open')        statCounts.open++
      if (t.status === 'in_progress') statCounts.in_progress++
      if (t.status === 'resolved' && t.resolved_at && new Date(t.resolved_at) >= weekAgo)
        statCounts.resolved_week++
    }

    return Response.json({ tickets: data ?? [], stats: statCounts })
  } catch (err) {
    logger.error('[GET /api/super-admin/tickets]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
