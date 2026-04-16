import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'

export const metadata = { title: 'Subject Syllabus — EduDraftAI' }

export default async function SyllabusSubjectPage({ params }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, college_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { subject_id } = params

  // Verify subject belongs to user's college (college_id scoping)
  const { data: subject } = await adminSupabase
    .from('subjects')
    .select('id, name, code, semester, departments ( name )')
    .eq('id', subject_id)
    .eq('college_id', profile.college_id)
    .single()

  if (!subject) notFound()

  // Fetch chunks scoped to college_id
  const { data: chunks } = await adminSupabase
    .from('syllabus_chunks')
    .select('id, unit_number, topic, subtopics, raw_text')
    .eq('subject_id', subject_id)
    .eq('college_id', profile.college_id)
    .order('unit_number')

  // Group by unit_number
  const grouped = {}
  for (const chunk of chunks ?? []) {
    const unit = chunk.unit_number ?? 0
    if (!grouped[unit]) grouped[unit] = []
    grouped[unit].push(chunk)
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Back */}
      <Link href="/syllabus" className="text-sm text-muted hover:text-text transition-colors mb-4 flex items-center gap-1 w-fit">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Syllabus
      </Link>

      {/* Header */}
      <div className="mb-6 mt-4">
        <h1 className="font-heading text-2xl font-bold text-navy">{subject.name}</h1>
        <p className="text-muted text-sm mt-1">
          {subject.departments?.name} &middot; Semester {subject.semester} &middot;
          <span className="font-mono ml-1">{subject.code}</span>
        </p>
      </div>

      {/* Chunks */}
      {chunks && chunks.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(grouped)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([unit, unitChunks]) => (
              <div key={unit}>
                <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
                  Unit {unit === '0' ? '—' : unit}
                </p>
                <div className="space-y-3">
                  {unitChunks.map((chunk) => {
                    const rawPreview = chunk.raw_text
                      ? chunk.raw_text.slice(0, 200) + (chunk.raw_text.length > 200 ? '…' : '')
                      : null
                    return (
                      <div key={chunk.id} className="bg-surface border border-border rounded-xl p-5">
                        <p className="font-medium text-text text-sm">{chunk.topic}</p>
                        {chunk.subtopics && chunk.subtopics.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {chunk.subtopics.map((st, i) => (
                              <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                                <span className="text-teal mt-0.5">•</span>
                                {st}
                              </li>
                            ))}
                          </ul>
                        )}
                        {rawPreview && (
                          <p className="mt-2 text-xs text-muted font-mono leading-relaxed border-t border-border pt-2">
                            {rawPreview}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No syllabus topics available for this subject.</p>
          <p className="text-muted text-xs mt-1">
            The Yuktra AI team will upload and parse the syllabus PDF soon.
          </p>
        </div>
      )}
    </div>
  )
}
