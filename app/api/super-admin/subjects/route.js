import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const createSchema = z.object({
  college_id:    z.string().uuid(),
  department_id: z.string().uuid(),
  name:          z.string().min(2).max(200),
  code:          z.string().max(20).optional().default(''),
  semester:      z.number().int().min(1).max(6),
})

async function getSuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await adminSupabase
    .from('users').select('role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? user : null
}

// GET — list subjects, supports ?college_id and ?department_id filters
export async function GET(request) {
  try {
    const user = await getSuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const college_id    = searchParams.get('college_id')
    const department_id = searchParams.get('department_id')

    let query = adminSupabase
      .from('subjects')
      .select('id, name, code, semester, is_active, college_id, department_id, colleges(name), departments(name)')
      .order('semester')
      .order('name')

    if (college_id)    query = query.eq('college_id', college_id)
    if (department_id) query = query.eq('department_id', department_id)

    const { data, error } = await query
    if (error) throw error

    return Response.json({ subjects: data ?? [] })
  } catch (err) {
    logger.error('[GET /api/super-admin/subjects]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}

// POST — create new subject
export async function POST(request) {
  try {
    const user = await getSuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    let body
    try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const parsed = createSchema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data: subject, error } = await adminSupabase
      .from('subjects')
      .insert({
        college_id:    parsed.data.college_id,
        department_id: parsed.data.department_id,
        name:          parsed.data.name,
        code:          parsed.data.code ? parsed.data.code.toUpperCase() : '',
        semester:      parsed.data.semester,
        is_active:     true,
      })
      .select('id, name, code, semester, is_active, college_id, department_id, colleges(name), departments(name)')
      .single()

    if (error) {
      if (error.code === '23505')
        return Response.json({ error: 'A subject with that code already exists in this department', code: 'DUPLICATE_CODE' }, { status: 409 })
      throw error
    }

    return Response.json({ subject }, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/super-admin/subjects]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
