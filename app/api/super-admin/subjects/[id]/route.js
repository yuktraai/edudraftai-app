import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const patchSchema = z.object({
  name:          z.string().min(2).max(200).optional(),
  code:          z.string().max(20).optional(),
  semester:      z.number().int().min(1).max(6).optional(),
  department_id: z.string().uuid().optional(),
  college_id:    z.string().uuid().optional(),
  is_active:     z.boolean().optional(),
  has_math:      z.boolean().optional(),
})

async function getSuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await adminSupabase
    .from('users').select('role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? user : null
}

// PATCH — update subject fields
export async function PATCH(request, { params }) {
  try {
    const user = await getSuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    let body
    try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const updates = { ...parsed.data }
    if (updates.code) updates.code = updates.code.toUpperCase()

    const { data: subject, error } = await adminSupabase
      .from('subjects')
      .update(updates)
      .eq('id', params.id)
      .select('id, name, code, semester, is_active, college_id, department_id, colleges(name), departments(name)')
      .single()

    if (error) {
      if (error.code === '23505')
        return Response.json({ error: 'A subject with that code already exists', code: 'DUPLICATE_CODE' }, { status: 409 })
      throw error
    }

    return Response.json({ subject })
  } catch (err) {
    logger.error('[PATCH /api/super-admin/subjects/[id]]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}

// DELETE — soft delete (set is_active = false)
export async function DELETE(request, { params }) {
  try {
    const user = await getSuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await adminSupabase
      .from('subjects')
      .update({ is_active: false })
      .eq('id', params.id)

    if (error) throw error
    return Response.json({ success: true })
  } catch (err) {
    logger.error('[DELETE /api/super-admin/subjects/[id]]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
