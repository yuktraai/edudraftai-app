import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const schema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(20).toUpperCase(),
})

async function getAdminProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('role, college_id').eq('id', user.id).single()
  if (!['college_admin', 'super_admin'].includes(profile?.role)) return null
  return { user, profile }
}

export async function GET() {
  try {
    const auth = await getAdminProfile()
    if (!auth) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await adminSupabase
      .from('departments')
      .select('id, name, code, is_active, created_at')
      .eq('college_id', auth.profile.college_id)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return Response.json({ data })
  } catch (error) {
    logger.error('[GET /api/admin/departments]', error)
    return Response.json({ error: 'Internal server error', code: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const auth = await getAdminProfile()
    if (!auth) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('departments')
      .insert({ ...parsed.data, college_id: auth.profile.college_id })
      .select().single()

    if (error) {
      if (error.code === '23505')
        return Response.json({ error: 'A department with that code already exists', code: 'DUPLICATE_CODE' }, { status: 409 })
      throw error
    }

    return Response.json({ data }, { status: 201 })
  } catch (error) {
    logger.error('[POST /api/admin/departments]', error)
    return Response.json({ error: 'Internal server error', code: error.message }, { status: 500 })
  }
}
