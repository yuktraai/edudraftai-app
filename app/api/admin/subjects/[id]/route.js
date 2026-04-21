import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const updateSchema = z.object({
  name:          z.string().min(2).max(200).optional(),
  code:          z.string().min(1).max(20).optional(),
  semester:      z.number().int().min(1).max(6).optional(),
  department_id: z.string().uuid().optional(),
  is_active:     z.boolean().optional(),
  has_math:      z.boolean().optional(),
  subject_type:  z.enum(['theory', 'practical']).optional(),
})

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

export async function PATCH(request, { params }) {
  try {
    const auth = await getAdminProfile()
    if (!auth) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = params

    // Verify subject belongs to this admin's college
    const { data: existing, error: fetchErr } = await adminSupabase
      .from('subjects')
      .select('id, college_id')
      .eq('id', id)
      .eq('college_id', auth.profile.college_id)
      .single()

    if (fetchErr || !existing)
      return Response.json({ error: 'Subject not found', code: 'NOT_FOUND' }, { status: 404 })

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const updates = { ...parsed.data }
    if (updates.code) updates.code = updates.code.toUpperCase()

    const { data, error } = await adminSupabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .eq('college_id', auth.profile.college_id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505')
        return Response.json({ error: 'A subject with that code already exists', code: 'DUPLICATE_CODE' }, { status: 409 })
      throw error
    }

    return Response.json({ data })
  } catch (err) {
    logger.error('[PATCH /api/admin/subjects/[id]]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
