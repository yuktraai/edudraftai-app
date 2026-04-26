import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const createSchema = z.object({
  title:             z.string().min(2),
  tagline:           z.string().optional(),
  description:       z.string().optional(),
  slug:              z.string().min(2).regex(/^[a-z0-9-]+$/),
  date:              z.string(),
  time_ist:          z.string(),
  time_est:          z.string(),
  time_pst:          z.string().optional(),
  duration_mins:     z.number().int().default(45),
  max_registrations: z.number().int().default(200),
  agenda:            z.array(z.string()).optional().default([]),
})

async function getSuperAdmin(request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await adminSupabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return null
  return user
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })
    const { data: profile } = await adminSupabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { data: webinars } = await adminSupabase
      .from('webinars').select('*').order('date', { ascending: false })

    const { data: allRegs } = await adminSupabase
      .from('webinar_registrations').select('webinar_id')

    const countMap = {}
    for (const r of (allRegs ?? [])) {
      countMap[r.webinar_id] = (countMap[r.webinar_id] ?? 0) + 1
    }

    const result = (webinars ?? []).map(w => ({ ...w, registration_count: countMap[w.id] ?? 0 }))
    return Response.json({ webinars: result })
  } catch (err) {
    logger.error('[GET /api/super-admin/webinars]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })
    const { data: profile } = await adminSupabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

    let body
    try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data: webinar, error } = await adminSupabase
      .from('webinars').insert(parsed.data).select().single()

    if (error) {
      if (error.code === '23505') return Response.json({ error: 'A webinar with that slug already exists' }, { status: 409 })
      throw error
    }

    return Response.json({ webinar }, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/super-admin/webinars]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
