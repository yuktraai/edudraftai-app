import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Only super_admin can PATCH or DELETE
async function assertSuperAdmin(user) {
  const { data } = await adminSupabase
    .from('users').select('role').eq('id', user.id).single()
  return data?.role === 'super_admin'
}

const updateSchema = z.object({
  name:        z.string().min(2).max(100).optional(),
  credits:     z.number().int().positive().optional(),
  price_paise: z.number().int().positive().optional(),
  is_popular:  z.boolean().optional(),
  is_active:   z.boolean().optional(),
  sort_order:  z.number().int().optional(),
})

// PATCH /api/credits/personal/packages/[id]
export async function PATCH(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })
    if (!(await assertSuperAdmin(user))) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body   = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('personal_credit_packages')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) throw error
    return Response.json({ package: data })
  } catch (err) {
    logger.error('[PATCH /api/credits/personal/packages/[id]]', err)
    return Response.json({ error: 'Failed to update package' }, { status: 500 })
  }
}

// DELETE /api/credits/personal/packages/[id] — soft delete (sets is_active = false)
export async function DELETE(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })
    if (!(await assertSuperAdmin(user))) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await adminSupabase
      .from('personal_credit_packages')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) throw error
    return Response.json({ success: true })
  } catch (err) {
    logger.error('[DELETE /api/credits/personal/packages/[id]]', err)
    return Response.json({ error: 'Failed to deactivate package' }, { status: 500 })
  }
}
