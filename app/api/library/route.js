import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/library?content_type=&subject_id=&page=1
// Returns published drafts from the user's college (any department)
export async function GET(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('college_id')
      .eq('id', user.id)
      .single()

    if (!profile?.college_id) return Response.json({ drafts: [], total: 0 })

    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('content_type')
    const subjectId   = searchParams.get('subject_id')
    const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const pageSize    = 20

    let query = adminSupabase
      .from('content_generations')
      .select(`
        id, content_type, prompt_params, published_at, clone_count, created_at,
        users!user_id(id, name),
        subjects!subject_id(id, name, code, semester, departments(name))
      `, { count: 'exact' })
      .eq('college_id', profile.college_id)
      .eq('is_published', true)
      .eq('status', 'completed')
      .order('published_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (contentType) query = query.eq('content_type', contentType)
    if (subjectId)   query = query.eq('subject_id', subjectId)

    const { data: drafts, count, error } = await query
    if (error) throw error

    return Response.json({ drafts: drafts ?? [], total: count ?? 0, page, pageSize })
  } catch (err) {
    logger.error('[GET /api/library]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
