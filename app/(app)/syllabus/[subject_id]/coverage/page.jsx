import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { CoverageMap } from '@/components/syllabus/CoverageMap'

export const metadata = { title: 'Topic Coverage Map — EduDraftAI' }

export default async function CoverageMapPage({ params }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminSupabase
    .from('users')
    .select('role, college_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { subject_id } = params

  // Validate subject belongs to user's college
  const { data: subject } = await adminSupabase
    .from('subjects')
    .select('id, name, code, semester')
    .eq('id', subject_id)
    .eq('college_id', profile.college_id)
    .single()

  if (!subject) notFound()

  // Fetch all chunks for this subject
  const { data: chunks } = await adminSupabase
    .from('syllabus_chunks')
    .select('id, unit_number, topic, subtopics')
    .eq('subject_id', subject_id)
    .eq('college_id', profile.college_id)
    .order('unit_number')

  // Fetch completed generations for this user + subject
  const { data: generations } = await adminSupabase
    .from('content_generations')
    .select('syllabus_chunk_id, created_at')
    .eq('user_id', user.id)
    .eq('subject_id', subject_id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  // Build chunk_id → last generation date map
  const genMap = {}
  for (const g of (generations ?? [])) {
    if (g.syllabus_chunk_id && !genMap[g.syllabus_chunk_id]) {
      genMap[g.syllabus_chunk_id] = g.created_at
    }
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const coverage = (chunks ?? []).map((chunk) => {
    const lastGenAt = genMap[chunk.id] ?? null
    let status = 'uncovered'
    if (lastGenAt) {
      status = lastGenAt >= thirtyDaysAgo ? 'recent' : 'stale'
    }
    return {
      chunk_id:          chunk.id,
      unit_number:       chunk.unit_number,
      topic_name:        chunk.topic,
      subtopics:         chunk.subtopics ?? [],
      last_generated_at: lastGenAt,
      coverage_status:   status,
    }
  })

  const total     = coverage.length
  const recent    = coverage.filter(c => c.coverage_status === 'recent').length
  const stale     = coverage.filter(c => c.coverage_status === 'stale').length
  const uncovered = coverage.filter(c => c.coverage_status === 'uncovered').length
  const covered   = recent + stale
  const pct       = total > 0 ? Math.round((covered / total) * 100) : 0

  return (
    <div className="p-4 md:p-8 max-w-5xl space-y-6">
      {/* Back link */}
      <div className="flex items-center gap-3">
        <Link
          href={`/syllabus/${subject_id}`}
          className="text-muted hover:text-text transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold text-navy">Coverage Map</h1>
          <p className="text-sm text-muted">{subject.name}{subject.code ? ` · ${subject.code}` : ''} · Semester {subject.semester}</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-navy">{pct}%</span>
            <span className="text-sm text-muted">covered</span>
          </div>
          <div className="h-6 w-px bg-border hidden md:block" />
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal inline-block" />
              <span className="text-text font-medium">{recent}</span>
              <span className="text-muted">recent</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span className="text-text font-medium">{stale}</span>
              <span className="text-muted">stale (&gt;30 days)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-error inline-block" />
              <span className="text-text font-medium">{uncovered}</span>
              <span className="text-muted">uncovered</span>
            </span>
            <span className="flex items-center gap-1.5 ml-2">
              <span className="text-muted">{covered} of {total} topics covered</span>
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-border rounded-full h-2">
          <div
            className="h-2 rounded-full bg-teal transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Coverage map */}
      <CoverageMap chunks={coverage} subjectId={subject_id} />
    </div>
  )
}
