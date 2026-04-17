import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const toggleSchema = z.object({
  item_type: z.enum(['department', 'subject']),
  item_id:   z.string().uuid(),
})

// GET — return all favorites for the current user
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await adminSupabase
      .from('lecturer_favorites')
      .select('item_type, item_id')
      .eq('user_id', user.id)

    if (error) throw error

    const departments = data.filter(f => f.item_type === 'department').map(f => f.item_id)
    const subjects    = data.filter(f => f.item_type === 'subject').map(f => f.item_id)

    return Response.json({ data: { departments, subjects } })
  } catch (err) {
    logger.error('[favorites GET]', err)
    return Response.json({ error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

// POST — toggle a favorite (upsert or delete)
export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('college_id')
      .eq('id', user.id)
      .single()

    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 })

    const body = await request.json()
    const parsed = toggleSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { item_type, item_id } = parsed.data

    // Check if already favorited
    const { data: existing } = await adminSupabase
      .from('lecturer_favorites')
      .select('id')
      .eq('user_id',   user.id)
      .eq('item_type', item_type)
      .eq('item_id',   item_id)
      .single()

    if (existing) {
      // Remove favorite
      await adminSupabase
        .from('lecturer_favorites')
        .delete()
        .eq('id', existing.id)
      return Response.json({ data: { favorited: false } })
    } else {
      // Add favorite
      await adminSupabase
        .from('lecturer_favorites')
        .insert({ user_id: user.id, college_id: profile.college_id, item_type, item_id })
      return Response.json({ data: { favorited: true } })
    }
  } catch (err) {
    logger.error('[favorites POST]', err)
    return Response.json({ error: 'Failed to toggle favorite' }, { status: 500 })
  }
}
