import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/drafts?page=1&content_type=lesson_notes&subject_id=xxx
export async function GET(request) {
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

    const { searchParams } = new URL(request.url)
    const page         = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const content_type = searchParams.get('content_type') ?? ''
    const subject_id   = searchParams.get('subject_id') ?? ''
    const PAGE_SIZE    = 20
    const from         = (page - 1) * PAGE_SIZE
    const to           = from + PAGE_SIZE - 1

    // Build query — college_admin sees all in their college; lecturer sees only own
    let query = adminSupabase
      .from('content_generations')
      .select(`
        id,
        content_type,
        prompt_params,
        ai_model,
        credits_used,
        generation_ms,
        status,
        raw_output,
        created_at,
        subject_id,
        subjects ( name, code )
      `, { count: 'exact' })
      .eq('college_id', profile.college_id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .range(from, to)

    // Lecturers only see their own drafts
    if (profile.role === 'lecturer') {
      query = query.eq('user_id', user.id)
    }

    if (content_type) query = query.eq('content_type', content_type)
    if (subject_id)   query = query.eq('subject_id', subject_id)

    const { data, error, count } = await query
    if (error) throw error

    // Fetch unique subjects this user has drafted (for filter dropdown)
    let subjectsQuery = adminSupabase
      .from('content_generations')
      .select('subject_id, subjects ( id, name, departments ( name ) )')
      .eq('college_id', profile.college_id)
      .eq('status', 'completed')

    if (profile.role === 'lecturer') {
      subjectsQuery = subjectsQuery.eq('user_id', user.id)
    }

    const { data: rawSubjects } = await subjectsQuery

    // Deduplicate subjects by subject_id; build display label with dept if name is ambiguous
    const seen = new Set()
    const uniqueSubjects = (rawSubjects ?? [])
      .filter(r => r.subjects && !seen.has(r.subject_id) && seen.add(r.subject_id))
      .map(r => ({
        id:      r.subject_id,
        name:    r.subjects.name,
        dept:    r.subjects.departments?.name ?? null,
      }))

    // Count how many subjects share the same name — add dept suffix for ambiguous names
    const nameCounts = {}
    for (const s of uniqueSubjects) nameCounts[s.name] = (nameCounts[s.name] ?? 0) + 1

    const subjects = uniqueSubjects
      .map(s => ({
        id:    s.id,
        label: nameCounts[s.name] > 1 && s.dept ? `${s.name} · ${s.dept}` : s.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    return Response.json({
      data:      data ?? [],
      total:     count ?? 0,
      page,
      page_size: PAGE_SIZE,
      subjects,
    })
  } catch (err) {
    logger.error('[GET /api/drafts]', err)
    return Response.json({ error: 'Failed to fetch drafts', code: err.message }, { status: 500 })
  }
}
