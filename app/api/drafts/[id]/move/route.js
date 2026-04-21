import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// PATCH /api/drafts/[id]/move — move draft to a folder (or remove from folder)
// Body: { folder_id: uuid | null }
export async function PATCH(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const body = await request.json()
    const folder_id = body.folder_id ?? null // null = remove from folder

    // Verify folder ownership if a folder_id is provided
    if (folder_id) {
      const { data: folder } = await adminSupabase
        .from('draft_folders')
        .select('id')
        .eq('id', folder_id)
        .eq('user_id', user.id)
        .single()
      if (!folder) return Response.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Update the draft — only the owner can move their own draft
    const { data, error } = await adminSupabase
      .from('content_generations')
      .update({ folder_id })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select('id, folder_id')
      .single()

    if (error) throw error
    if (!data) return Response.json({ error: 'Draft not found' }, { status: 404 })

    return Response.json({ ok: true, folder_id: data.folder_id })
  } catch (err) {
    logger.error('[PATCH /api/drafts/[id]/move]', err)
    return Response.json({ error: 'Failed to move draft', code: err.message }, { status: 500 })
  }
}
