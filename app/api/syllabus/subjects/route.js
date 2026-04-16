import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export async function GET(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, college_id')
      .eq('id', user.id)
      .single()

    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const department_id = searchParams.get('department_id')
    const semester = searchParams.get('semester')

    if (!department_id) return Response.json({ error: 'department_id is required' }, { status: 400 })

    let query = adminSupabase
      .from('subjects')
      .select('id, name, code, semester')
      .eq('college_id', profile.college_id)
      .eq('department_id', department_id)
      .eq('is_active', true)
      .order('semester')
      .order('name')

    if (semester) query = query.eq('semester', parseInt(semester, 10))

    const { data, error } = await query
    if (error) throw error
    return Response.json({ data })
  } catch (err) {
    logger.error('[GET /api/syllabus/subjects]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
