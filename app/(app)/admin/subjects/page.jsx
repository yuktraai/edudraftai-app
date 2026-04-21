import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { CollegeAdminSubjectsClient } from './CollegeAdminSubjectsClient'
import { SubjectsTable } from './SubjectsTable'

export const metadata = { title: 'Subjects — EduDraftAI' }

export default async function AdminSubjectsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use adminSupabase for profile fetch — avoids RLS column-access issues
  const { data: profile } = await adminSupabase
    .from('users')
    .select('role, college_id')
    .eq('id', user.id)
    .single()

  if (!['college_admin', 'super_admin'].includes(profile?.role)) redirect('/dashboard')

  const collegeId = profile.college_id

  // Fetch subjects + departments first
  const [
    { data: subjects },
    { data: departments },
  ] = await Promise.all([
    adminSupabase
      .from('subjects')
      .select('id, name, code, semester, subject_type, is_active, created_at, department_id')
      .eq('college_id', collegeId)
      .order('semester')
      .order('name'),

    adminSupabase
      .from('departments')
      .select('id, name, code')
      .eq('college_id', collegeId)
      .eq('is_active', true)
      .order('name'),
  ])

  const subjectIds = (subjects ?? []).map(s => s.id)

  // Fetch syllabus files + chunks scoped by subject IDs (avoids college_id mismatch)
  const [
    { data: syllabus_files },
    { data: chunks },
  ] = await Promise.all([
    subjectIds.length > 0
      ? adminSupabase
          .from('syllabus_files')
          .select('id, subject_id, parse_status, created_at, file_name')
          .in('subject_id', subjectIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),

    subjectIds.length > 0
      ? adminSupabase
          .from('syllabus_chunks')
          .select('id, subject_id')
          .in('subject_id', subjectIds)
      : Promise.resolve({ data: [] }),
  ])

  // Build enriched flat subject list
  const deptMap = Object.fromEntries((departments ?? []).map(d => [d.id, d]))

  const latestFileBySubject = {}
  for (const f of syllabus_files ?? []) {
    if (!latestFileBySubject[f.subject_id]) latestFileBySubject[f.subject_id] = f
  }

  const chunkCountBySubject = {}
  for (const c of chunks ?? []) {
    chunkCountBySubject[c.subject_id] = (chunkCountBySubject[c.subject_id] ?? 0) + 1
  }

  const flatSubjects = (subjects ?? []).map(subject => {
    const dept = deptMap[subject.department_id]
    return {
      ...subject,
      dept_name:   dept?.name ?? 'Unknown Department',
      dept_code:   dept?.code ?? '',
      chunk_count: chunkCountBySubject[subject.id] ?? 0,
      latest_file: latestFileBySubject[subject.id] ?? null,
    }
  })

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Subjects</h1>
          <p className="text-muted text-sm mt-1">
            {flatSubjects.length} subject{flatSubjects.length !== 1 ? 's' : ''} across all departments
          </p>
        </div>
        <CollegeAdminSubjectsClient mode="add-button" departments={departments ?? []} />
      </div>

      {/* Notice */}
      <div className="mb-6 bg-teal-light border border-teal rounded-lg px-4 py-3 flex items-start gap-3">
        <svg className="w-4 h-4 text-teal mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-navy">
          <span className="font-semibold">Syllabus content</span> is uploaded and parsed by the{' '}
          <span className="font-semibold">Yuktra AI team</span>. Contact{' '}
          <a href="mailto:info@yuktraai.com" className="text-teal hover:underline">info@yuktraai.com</a>{' '}
          to add or update syllabus PDFs for any subject.
        </p>
      </div>

      {/* Subjects grouped by type */}
      {(() => {
        const theorySubjects    = flatSubjects.filter(s => (s.subject_type ?? 'theory') === 'theory')
        const practicalSubjects = flatSubjects.filter(s => s.subject_type === 'practical')
        const hasPractical      = practicalSubjects.length > 0

        return (
          <>
            {/* Theory section — always shown */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-heading text-base font-bold text-navy">Theory Subjects</h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  Theory
                </span>
              </div>
              <SubjectsTable subjects={theorySubjects} departments={departments ?? []} />
            </div>

            {/* Practical section — only shown if any practical subjects exist */}
            {hasPractical && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="font-heading text-base font-bold text-navy">Practical Subjects</h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    Practical
                  </span>
                </div>
                <SubjectsTable subjects={practicalSubjects} departments={departments ?? []} />
              </div>
            )}
          </>
        )
      })()}
    </div>
  )
}
