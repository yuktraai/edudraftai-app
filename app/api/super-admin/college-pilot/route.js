import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

async function verifySuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? user : null
}

// GET /api/super-admin/college-pilot — list all submissions
export async function GET() {
  const user = await verifySuperAdmin()
  if (!user) return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })

  try {
    const { data, error } = await adminSupabase
      .from('college_pilot_requests')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (error) {
      logger.error('GET /api/super-admin/college-pilot — db error', error)
      return Response.json({ error: 'Failed to fetch requests', code: 'DB_ERROR' }, { status: 500 })
    }

    return Response.json({ data: data ?? [] })
  } catch (err) {
    logger.error('GET /api/super-admin/college-pilot — unexpected', err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
