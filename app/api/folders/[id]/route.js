import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

async function resolveUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }
  const { data: profile } = await adminSupabase
    .from('users')
    .select('college_id')
    .eq('id', user.id)
    .single()
  return { user, profile }
}

// PATCH /api/folders/[id] — rename folder
export async function PATCH(request, { params }) {
  try {
    const { user, profile } = await resolveUser()
    if (!user || !profile) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const body = await request.json()
    const name = (body.name ?? '').trim()
    if (!name) return Response.json({ error: 'Folder name is required' }, { status: 400 })
    if (name.length > 80) return Response.json({ error: 'Folder name too long (max 80 chars)' }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('draft_folders')
      .update({ name })
      .eq('id', params.id)
      .eq('user_id', user.id) // ownership check
      .select('id, name, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return Response.json({ error: `A folder named "${name}" already exists` }, { status: 409 })
      }
      throw error
    }
    if (!data) return Response.json({ error: 'Folder not found' }, { status: 404 })

    return Response.json({ folder: data })
  } catch (err) {
    logger.error('[PATCH /api/folders/[id]]', err)
    return Response.json({ error: 'Failed to rename folder', code: err.message }, { status: 500 })
  }
}

// DELETE /api/folders/[id] — delete folder; drafts move to root (folder_id = null via ON DELETE SET NULL)
export async function DELETE(request, { params }) {
  try {
    const { user } = await resolveUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { error } = await adminSupabase
      .from('draft_folders')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id) // ownership check

    if (error) throw error

    return Response.json({ ok: true })
  } catch (err) {
    logger.error('[DELETE /api/folders/[id]]', err)
    return Response.json({ error: 'Failed to delete folder', code: err.message }, { status: 500 })
  }
}
