import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/super-admin/departments?college_id=X — list departments for any college
export async function GET(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role').eq('id', user.id).single()

    if (profile?.role !== 'super_admin')
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const college_id = searchParams.get('college_id')

    if (!college_id)
      return Response.json({ error: 'college_id is required' }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('departments')
      .select('id, name, code, is_active')
      .eq('college_id', college_id)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return Response.json({ departments: data ?? [] })
  } catch (err) {
    logger.error('[GET /api/super-admin/departments]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
