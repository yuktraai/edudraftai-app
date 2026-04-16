import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export async function GET(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, college_id')
      .eq('id', user.id)
      .single()

    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const subject_id = searchParams.get('subject_id')
    if (!subject_id) return Response.json({ error: 'subject_id is required' }, { status: 400 })

    // Verify subject belongs to user's college (defence in depth)
    const { data: subject } = await adminSupabase
      .from('subjects')
      .select('id')
      .eq('id', subject_id)
      .eq('college_id', profile.college_id)
      .single()

    if (!subject) return Response.json({ error: 'Subject not found' }, { status: 404 })

    const { data, error } = await adminSupabase
      .from('syllabus_chunks')
      .select('id, unit_number, topic, subtopics')
      .eq('subject_id', subject_id)
      .eq('college_id', profile.college_id)
      .order('unit_number')
      .order('topic')

    if (error) throw error
    return Response.json({ data })
  } catch (err) {
    logger.error('[GET /api/syllabus/chunks]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
