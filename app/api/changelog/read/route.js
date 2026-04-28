import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// POST /api/changelog/read { entryIds: [] } — mark entries as read
export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { entryIds } = await request.json()
    if (!Array.isArray(entryIds) || entryIds.length === 0)
      return Response.json({ success: true })

    const rows = entryIds.map(entry_id => ({ user_id: user.id, entry_id }))
    const { error } = await adminSupabase
      .from('changelog_reads')
      .upsert(rows, { onConflict: 'user_id,entry_id', ignoreDuplicates: true })

    if (error) throw error
    return Response.json({ success: true })
  } catch (err) {
    logger.error('[POST /api/changelog/read]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
