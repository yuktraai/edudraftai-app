import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/syllabus/[subject_id]/coverage
// Returns topic coverage data for the authenticated user on the given subject.
// Each chunk is enriched with coverage_status: 'recent' | 'stale' | 'uncovered'
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

    const { subject_id } = params

    // Validate subject belongs to user's college
    const { data: subject } = await adminSupabase
      .from('subjects')
      .select('id, name, college_id')
      .eq('id', subject_id)
      .eq('college_id', profile.college_id)
      .single()

    if (!subject) return Response.json({ error: 'Subject not found' }, { status: 404 })

    // Fetch all chunks for this subject
    const { data: chunks, error: chunksErr } = await adminSupabase
      .from('syllabus_chunks')
      .select('id, unit_number, topic, subtopics')
      .eq('subject_id', subject_id)
      .eq('college_id', profile.college_id)
      .order('unit_number')

    if (chunksErr) {
      logger.error('[GET coverage] chunks fetch', chunksErr.message)
      return Response.json({ error: 'Failed to fetch syllabus chunks' }, { status: 500 })
    }

    if (!chunks || chunks.length === 0) {
      return Response.json({ coverage: [], subjectName: subject.name })
    }

    // Fetch completed generations for this user + subject, grouped by chunk
    const { data: generations } = await adminSupabase
      .from('content_generations')
      .select('syllabus_chunk_id, created_at')
      .eq('user_id', user.id)
      .eq('subject_id', subject_id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    // Build a map: chunk_id → most recent generation date
    const genMap = {}
    for (const g of (generations ?? [])) {
      const cid = g.syllabus_chunk_id
      if (cid && !genMap[cid]) {
        genMap[cid] = g.created_at
      }
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const coverage = chunks.map((chunk) => {
      const lastGenAt = genMap[chunk.id] ?? null
      let status = 'uncovered'
      if (lastGenAt) {
        status = lastGenAt >= thirtyDaysAgo ? 'recent' : 'stale'
      }
      return {
        chunk_id:        chunk.id,
        unit_number:     chunk.unit_number,
        topic_name:      chunk.topic,
        subtopics:       chunk.subtopics ?? [],
        last_generated_at: lastGenAt,
        coverage_status: status,
      }
    })

    return Response.json({ coverage, subjectName: subject.name })
  } catch (err) {
    logger.error('[GET /api/syllabus/[subject_id]/coverage]', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
