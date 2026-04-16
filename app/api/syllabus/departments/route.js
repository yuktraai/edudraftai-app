import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export async function GET() {
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

    const { data, error } = await adminSupabase
      .from('departments')
      .select('id, name, code')
      .eq('college_id', profile.college_id)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return Response.json({ data })
  } catch (err) {
    logger.error('[GET /api/syllabus/departments]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
