import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/folders — list folders for the current user with draft counts
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('college_id')
      .eq('id', user.id)
      .single()
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 403 })

    // Fetch folders for this user
    const { data: folders, error } = await adminSupabase
      .from('draft_folders')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .eq('college_id', profile.college_id)
      .order('name', { ascending: true })

    if (error) throw error

    // Fetch draft counts per folder
    const { data: counts } = await adminSupabase
      .from('content_generations')
      .select('folder_id')
      .eq('user_id', user.id)
      .eq('college_id', profile.college_id)
      .eq('status', 'completed')
      .not('folder_id', 'is', null)

    const countMap = {}
    for (const row of counts ?? []) {
      countMap[row.folder_id] = (countMap[row.folder_id] ?? 0) + 1
    }

    // Count unfoldered drafts
    const { count: unfolderedCount } = await adminSupabase
      .from('content_generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('college_id', profile.college_id)
      .eq('status', 'completed')
      .is('folder_id', null)

    return Response.json({
      folders: (folders ?? []).map(f => ({
        ...f,
        draft_count: countMap[f.id] ?? 0,
      })),
      unfoldered_count: unfolderedCount ?? 0,
    })
  } catch (err) {
    logger.error('[GET /api/folders]', err)
    return Response.json({ error: 'Failed to fetch folders', code: err.message }, { status: 500 })
  }
}

// POST /api/folders — create a new folder
export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('college_id')
      .eq('id', user.id)
      .single()
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 403 })

    const body = await request.json()
    const name = (body.name ?? '').trim()
    if (!name) return Response.json({ error: 'Folder name is required' }, { status: 400 })
    if (name.length > 80) return Response.json({ error: 'Folder name too long (max 80 chars)' }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('draft_folders')
      .insert({ user_id: user.id, college_id: profile.college_id, name })
      .select('id, name, created_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return Response.json({ error: `A folder named "${name}" already exists` }, { status: 409 })
      }
      throw error
    }

    return Response.json({ folder: { ...data, draft_count: 0 } }, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/folders]', err)
    return Response.json({ error: 'Failed to create folder', code: err.message }, { status: 500 })
  }
}
