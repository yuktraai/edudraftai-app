import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('role, college_id').eq('id', user.id).single()

    if (!['college_admin', 'super_admin'].includes(profile?.role))
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await adminSupabase
      .from('users')
      .select('id, name, email, role, is_active, created_at')
      .eq('college_id', profile.college_id)
      .neq('role', 'super_admin')
      .order('created_at', { ascending: false })

    if (error) throw error
    return Response.json({ data })
  } catch (error) {
    logger.error('[GET /api/admin/users]', error)
    return Response.json({ error: 'Internal server error', code: error.message }, { status: 500 })
  }
}
