import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// Super-admin only: fetch subjects for ANY college by college_id query param
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
    const college_id = searchParams.get('college_id')

    if (!college_id)
      return Response.json({ error: 'college_id is required' }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('subjects')
      .select('id, name, code, semester, department_id, departments(name)')
      .eq('college_id', college_id)
      .eq('is_active', true)
      .order('semester')
      .order('name')

    if (error) throw error

    // Deduplicate by name+code+semester — same subject added to multiple
    // departments should appear once in the dropdown. Collect all subject_ids
    // so a single upload can fan out to all department rows.
    const uniqueMap = {}
    for (const s of data ?? []) {
      const key = `${s.name}||${s.code}||${s.semester}`
      if (!uniqueMap[key]) {
        uniqueMap[key] = {
          id:          s.id,           // primary id (for display key only)
          name:        s.name,
          code:        s.code,
          semester:    s.semester,
          subject_ids: [s.id],         // all dept rows for this subject
          dept_names:  [s.departments?.name].filter(Boolean),
        }
      } else {
        uniqueMap[key].subject_ids.push(s.id)
        if (s.departments?.name) uniqueMap[key].dept_names.push(s.departments.name)
      }
    }

    return Response.json({ data: Object.values(uniqueMap) })
  } catch (err) {
    logger.error('[GET /api/super-admin/subjects]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
