import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/drafts/[id]
export async function GET(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('role, college_id')
      .eq('id', user.id)
      .single()

    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 403 })

    const { data, error } = await adminSupabase
      .from('content_generations')
      .select(`
        id,
        content_type,
        prompt_params,
        ai_model,
        credits_used,
        generation_ms,
        raw_output,
        status,
        created_at,
        user_id,
        subject_id,
        subjects ( name, code, semester ),
        users ( name )
      `)
      .eq('id', params.id)
      .eq('college_id', profile.college_id)
      .single()

    if (error || !data) return Response.json({ error: 'Draft not found' }, { status: 404 })

    // Lecturers can only view their own; college_admin can view all in college
    if (profile.role === 'lecturer' && data.user_id !== user.id)
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    return Response.json({ data })
  } catch (err) {
    logger.error('[GET /api/drafts/[id]]', err)
    return Response.json({ error: 'Failed to fetch draft', code: err.message }, { status: 500 })
  }
}

// DELETE /api/drafts/[id] — hard delete (verified owner or college_admin)
export async function DELETE(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('role, college_id')
      .eq('id', user.id)
      .single()

    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 403 })

    // First fetch to verify ownership
    const { data: draft } = await adminSupabase
      .from('content_generations')
      .select('id, user_id, college_id')
      .eq('id', params.id)
      .eq('college_id', profile.college_id)
      .single()

    if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 })

    if (profile.role === 'lecturer' && draft.user_id !== user.id)
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await adminSupabase
      .from('content_generations')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return Response.json({ success: true })
  } catch (err) {
    logger.error('[DELETE /api/drafts/[id]]', err)
    return Response.json({ error: 'Failed to delete draft', code: err.message }, { status: 500 })
  }
}
