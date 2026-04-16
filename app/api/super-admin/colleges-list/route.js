import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/super-admin/colleges-list — lightweight list for filter dropdowns
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role').eq('id', user.id).single()

    if (profile?.role !== 'super_admin')
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await adminSupabase
      .from('colleges')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return Response.json({ data: data ?? [] })
  } catch (err) {
    logger.error('[GET /api/super-admin/colleges-list]', err)
    return Response.json({ error: 'Failed to fetch colleges', code: err.message }, { status: 500 })
  }
}
