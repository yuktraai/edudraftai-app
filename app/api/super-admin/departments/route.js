import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const schema = z.object({
  name:       z.string().min(2).max(200),
  code:       z.string().min(1).max(20).toUpperCase(),
  college_id: z.string().uuid(),
})

async function verifySuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await adminSupabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return null
  return user
}

// GET /api/super-admin/departments?college_id=X — list departments for any college
export async function GET(request) {
  try {
    const user = await verifySuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const college_id = searchParams.get('college_id')

    if (!college_id)
      return Response.json({ error: 'college_id is required' }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('departments')
      .select('id, name, code, is_active, created_at')
      .eq('college_id', college_id)
      .order('name')

    if (error) throw error
    return Response.json({ departments: data ?? [] })
  } catch (err) {
    logger.error('[GET /api/super-admin/departments]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}

// POST /api/super-admin/departments — create department in any college
export async function POST(request) {
  try {
    const user = await verifySuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('departments')
      .insert(parsed.data)
      .select()
      .single()

    if (error) {
      if (error.code === '23505')
        return Response.json({ error: 'A department with that code already exists in this college', code: 'DUPLICATE_CODE' }, { status: 409 })
      throw error
    }

    return Response.json({ data }, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/super-admin/departments]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
