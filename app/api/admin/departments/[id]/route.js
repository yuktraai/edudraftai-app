import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const schema = z.object({
  name: z.string().min(2).max(200).optional(),
  code: z.string().min(1).max(20).toUpperCase().optional(),
})

async function verifyOwnership(deptId, collegeId) {
  const { data } = await adminSupabase
    .from('departments').select('college_id').eq('id', deptId).single()
  return data?.college_id === collegeId
}

async function getAdminProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('role, college_id').eq('id', user.id).single()
  if (!['college_admin', 'super_admin'].includes(profile?.role)) return null
  return { user, profile }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await getAdminProfile()
    if (!auth) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const owns = await verifyOwnership(params.id, auth.profile.college_id)
    if (!owns) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { error } = await adminSupabase
      .from('departments').update(parsed.data).eq('id', params.id)

    if (error) {
      if (error.code === '23505')
        return Response.json({ error: 'Code already in use', code: 'DUPLICATE_CODE' }, { status: 409 })
      throw error
    }

    return Response.json({ data: { ok: true } })
  } catch (error) {
    logger.error('[PATCH /api/admin/departments/[id]]', error)
    return Response.json({ error: 'Internal server error', code: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await getAdminProfile()
    if (!auth) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const owns = await verifyOwnership(params.id, auth.profile.college_id)
    if (!owns) return Response.json({ error: 'Forbidden' }, { status: 403 })

    // Soft delete
    const { error } = await adminSupabase
      .from('departments').update({ is_active: false }).eq('id', params.id)

    if (error) throw error
    return Response.json({ data: { ok: true } })
  } catch (error) {
    logger.error('[DELETE /api/admin/departments/[id]]', error)
    return Response.json({ error: 'Internal server error', code: error.message }, { status: 500 })
  }
}
