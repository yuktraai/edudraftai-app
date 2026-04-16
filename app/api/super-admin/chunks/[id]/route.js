import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const updateSchema = z.object({
  topic:     z.string().min(1).max(500).optional(),
  subtopics: z.array(z.string()).optional(),
})

async function getSuperAdminUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'super_admin') return null
  return { user, profile }
}

export async function PATCH(request, { params }) {
  try {
    const auth = await getSuperAdminUser()
    if (!auth) return Response.json({ error: 'Forbidden — super_admin only' }, { status: 403 })

    const { id } = params
    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('syllabus_chunks')
      .update(parsed.data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return Response.json({ data })
  } catch (err) {
    logger.error('[PATCH /api/super-admin/chunks/[id]]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await getSuperAdminUser()
    if (!auth) return Response.json({ error: 'Forbidden — super_admin only' }, { status: 403 })

    const { id } = params
    const { error } = await adminSupabase
      .from('syllabus_chunks')
      .delete()
      .eq('id', id)

    if (error) throw error
    return Response.json({ success: true })
  } catch (err) {
    logger.error('[DELETE /api/super-admin/chunks/[id]]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
