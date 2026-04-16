import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

async function requireSuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401 }
  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return { error: 'Forbidden', status: 403 }
  return { user, profile }
}

export async function GET(request, { params }) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

    const { data: college, error } = await adminSupabase
      .from('colleges')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !college)
      return Response.json({ error: 'College not found' }, { status: 404 })

    // Stats
    const [{ count: lecturerCount }, { count: generationCount }] = await Promise.all([
      adminSupabase.from('users')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', params.id).eq('is_active', true),
      adminSupabase.from('content_generations')
        .select('*', { count: 'exact', head: true })
        .eq('college_id', params.id),
    ])

    // Users eligible to be college_admin (lecturers in this college OR unassigned)
    const { data: eligibleUsers } = await adminSupabase
      .from('users')
      .select('id, name, email, role, college_id')
      .or(`college_id.eq.${params.id},college_id.is.null`)
      .eq('is_active', true)
      .neq('role', 'super_admin')

    return Response.json({
      data: {
        college,
        stats: { lecturerCount, generationCount },
        eligibleUsers: eligibleUsers ?? [],
      }
    })
  } catch (error) {
    logger.error('[GET /api/colleges/[id]]', error)
    return Response.json({ error: 'Internal server error', code: error.message }, { status: 500 })
  }
}

const patchSchema = z.object({
  name:           z.string().min(3).max(200).optional(),
  district:       z.string().max(100).optional(),
  address:        z.string().max(300).optional(),
  is_active:      z.boolean().optional(),
  college_admin_id: z.string().uuid().optional(),  // assign a college_admin
})

export async function PATCH(request, { params }) {
  try {
    const auth = await requireSuperAdmin()
    if (auth.error) return Response.json({ error: auth.error }, { status: auth.status })

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { college_admin_id, ...collegeFields } = parsed.data

    // Update college fields if any
    if (Object.keys(collegeFields).length > 0) {
      const { error } = await adminSupabase
        .from('colleges').update(collegeFields).eq('id', params.id)
      if (error) throw error
    }

    // Assign college_admin
    if (college_admin_id) {
      const { error } = await adminSupabase
        .from('users')
        .update({ role: 'college_admin', college_id: params.id })
        .eq('id', college_admin_id)
      if (error) throw error
    }

    return Response.json({ data: { ok: true } })
  } catch (error) {
    logger.error('[PATCH /api/colleges/[id]]', error)
    return Response.json({ error: 'Internal server error', code: error.message }, { status: 500 })
  }
}
