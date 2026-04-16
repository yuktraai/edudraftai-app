import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Accepts one OR many departments — always coerced to array internally
const createSchema = z.object({
  name:           z.string().min(2).max(200),
  code:           z.string().min(1).max(20),
  semester:       z.number().int().min(1).max(6),
  // Support both single department_id (legacy) and multi-select department_ids
  department_ids: z.array(z.string().uuid()).min(1).optional(),
  department_id:  z.string().uuid().optional(),
}).refine(
  (d) => d.department_ids?.length > 0 || d.department_id,
  { message: 'At least one department is required' }
)

async function getAdminProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users')
    .select('id, role, college_id')
    .eq('id', user.id)
    .single()
  if (!['college_admin', 'super_admin'].includes(profile?.role)) return null
  return { user, profile }
}

export async function GET() {
  try {
    const auth = await getAdminProfile()
    if (!auth) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await adminSupabase
      .from('subjects')
      .select(`
        id, name, code, semester, is_active, created_at,
        departments ( id, name, code ),
        syllabus_chunks ( id ),
        syllabus_files ( id, parse_status, updated_at )
      `)
      .eq('college_id', auth.profile.college_id)
      .order('semester')
      .order('name')

    if (error) throw error

    // Group by department
    const grouped = {}
    for (const subject of data ?? []) {
      const deptId = subject.departments?.id ?? 'unknown'
      const deptName = subject.departments?.name ?? 'Unknown Department'
      if (!grouped[deptId]) grouped[deptId] = { id: deptId, name: deptName, subjects: [] }
      grouped[deptId].subjects.push({
        ...subject,
        chunk_count: subject.syllabus_chunks?.length ?? 0,
        latest_file: subject.syllabus_files?.[0] ?? null,
      })
    }

    return Response.json({ data: Object.values(grouped) })
  } catch (err) {
    logger.error('[GET /api/admin/subjects]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const auth = await getAdminProfile()
    if (!auth) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    // Normalise to array — support both department_ids[] and legacy department_id
    const deptIds = parsed.data.department_ids?.length
      ? parsed.data.department_ids
      : [parsed.data.department_id]

    // Verify every selected department belongs to this college
    const { data: validDepts, error: deptErr } = await adminSupabase
      .from('departments')
      .select('id')
      .eq('college_id', auth.profile.college_id)
      .in('id', deptIds)

    if (deptErr) throw deptErr

    const validIds = (validDepts ?? []).map((d) => d.id)
    const invalidIds = deptIds.filter((id) => !validIds.includes(id))
    if (invalidIds.length > 0)
      return Response.json(
        { error: 'One or more departments not found in your college', code: 'DEPT_NOT_FOUND' },
        { status: 404 }
      )

    // Build one row per department
    const rows = deptIds.map((dept_id) => ({
      name:          parsed.data.name,
      code:          parsed.data.code.toUpperCase(),
      semester:      parsed.data.semester,
      college_id:    auth.profile.college_id,
      department_id: dept_id,
    }))

    const { data, error } = await adminSupabase
      .from('subjects')
      .insert(rows)
      .select()

    if (error) {
      if (error.code === '23505')
        return Response.json(
          { error: 'A subject with that code already exists in one of the selected departments', code: 'DUPLICATE_CODE' },
          { status: 409 }
        )
      throw error
    }

    return Response.json({ data }, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/admin/subjects]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
