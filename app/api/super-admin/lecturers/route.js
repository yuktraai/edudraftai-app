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

// GET /api/super-admin/lecturers?college_id=&role=
// Returns active lecturers (and optionally college_admins) for a given college.
export async function GET(request) {
  try {
    const admin = await getSuperAdmin()
    if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const college_id = searchParams.get('college_id')
    const role       = searchParams.get('role') ?? 'lecturer'   // 'lecturer' | 'college_admin' | 'all'

    if (!college_id)
      return Response.json({ error: 'college_id is required', code: 'MISSING_COLLEGE' }, { status: 400 })

    let query = adminSupabase
      .from('users')
      .select('id, name, email, role, is_active, created_at')
      .eq('college_id', college_id)
      .eq('is_active', true)
      .neq('role', 'super_admin')
      .order('name')

    if (role !== 'all') query = query.eq('role', role)

    const { data, error } = await query
    if (error) throw error

    return Response.json({ users: data ?? [] })
  } catch (err) {
    logger.error('[GET /api/super-admin/lecturers]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
