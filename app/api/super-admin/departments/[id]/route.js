import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const schema = z.object({
  name:      z.string().min(2).max(200).optional(),
  code:      z.string().min(1).max(20).toUpperCase().optional(),
  is_active: z.boolean().optional(),
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

// PATCH /api/super-admin/departments/[id]
export async function PATCH(request, { params }) {
  try {
    const user = await verifySuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { error } = await adminSupabase
      .from('departments')
      .update(parsed.data)
      .eq('id', params.id)

    if (error) {
      if (error.code === '23505')
        return Response.json({ error: 'Code already in use in this college', code: 'DUPLICATE_CODE' }, { status: 409 })
      throw error
    }

    return Response.json({ data: { ok: true } })
  } catch (err) {
    logger.error('[PATCH /api/super-admin/departments/[id]]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}

// DELETE /api/super-admin/departments/[id] — soft delete
export async function DELETE(request, { params }) {
  try {
    const user = await verifySuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await adminSupabase
      .from('departments')
      .update({ is_active: false })
      .eq('id', params.id)

    if (error) throw error
    return Response.json({ data: { ok: true } })
  } catch (err) {
    logger.error('[DELETE /api/super-admin/departments/[id]]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
