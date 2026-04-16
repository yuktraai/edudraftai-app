import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// Super-admin only: look up a single subject by id (bypasses RLS)
export async function GET(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'super_admin')
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('subjects')
      .select('id, name, code, semester, college_id')
      .eq('id', id)
      .single()

    if (error) throw error
    return Response.json({ data })
  } catch (err) {
    logger.error('[GET /api/super-admin/subject-by-id]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
