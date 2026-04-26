import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const patchSchema = z.object({
  title:             z.string().min(2).optional(),
  tagline:           z.string().optional(),
  description:       z.string().optional(),
  slug:              z.string().regex(/^[a-z0-9-]+$/).optional(),
  date:              z.string().optional(),
  time_ist:          z.string().optional(),
  time_est:          z.string().optional(),
  time_pst:          z.string().optional(),
  duration_mins:     z.number().int().optional(),
  max_registrations: z.number().int().optional(),
  meet_link:         z.string().url().nullable().optional(),
  status:            z.enum(['upcoming','live','completed','cancelled']).optional(),
  feedback_open:     z.boolean().optional(),
  agenda:            z.array(z.string()).optional(),
})

async function authCheck() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await adminSupabase.from('users').select('role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? user : null
}

export async function PATCH(request, { params }) {
  try {
    const user = await authCheck()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    let body
    try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data: webinar, error } = await adminSupabase
      .from('webinars')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return Response.json({ webinar })
  } catch (err) {
    logger.error('[PATCH /api/super-admin/webinars/[id]]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authCheck()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await adminSupabase.from('webinars').delete().eq('id', params.id)
    if (error) throw error
    return Response.json({ success: true })
  } catch (err) {
    logger.error('[DELETE /api/super-admin/webinars/[id]]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
