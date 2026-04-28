import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// GET /api/changelog — fetch entries + unread count for current user
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ entries: [], unreadCount: 0 })

    const { data: entries } = await adminSupabase
      .from('changelog_entries')
      .select('id, title, description, published_at')
      .eq('is_active', true)
      .order('published_at', { ascending: false })

    const { data: reads } = await adminSupabase
      .from('changelog_reads')
      .select('entry_id')
      .eq('user_id', user.id)

    const readSet     = new Set((reads ?? []).map(r => r.entry_id))
    const unreadCount = (entries ?? []).filter(e => !readSet.has(e.id)).length

    return Response.json({ entries: entries ?? [], unreadCount })
  } catch (err) {
    logger.error('[GET /api/changelog]', err)
    return Response.json({ entries: [], unreadCount: 0 })
  }
}

// POST /api/changelog — super_admin creates a new entry
const createSchema = z.object({
  title:       z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  is_active:   z.boolean().optional().default(true),
})

export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin')
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body    = await request.json()
    const parsed  = createSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data: entry, error } = await adminSupabase
      .from('changelog_entries')
      .insert({ title: parsed.data.title, description: parsed.data.description, is_active: parsed.data.is_active })
      .select('id, title, description, published_at, is_active')
      .single()

    if (error) throw error
    return Response.json({ entry }, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/changelog]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
