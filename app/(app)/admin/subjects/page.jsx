import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'
import { CollegeAdminSubjectsClient } from './CollegeAdminSubjectsClient'

export const metadata = { title: 'Subjects — EduDraftAI' }

function ParseStatusBadge({ status }) {
  const map = {
    completed:  { variant: 'success', label: 'Parsed' },
    processing: { variant: 'info',    label: 'Processing' },
    pending:    { variant: 'muted',   label: 'Pending' },
    failed:     { variant: 'error',   label: 'Failed' },
  }
  const { variant, label } = map[status] ?? { variant: 'muted', label: 'No file' }
  return <Badge variant={variant}>{label}</Badge>
}

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

  // Run three separate queries instead of nested joins — more reliable with PostgREST
  const [
    { data: subjects },
    { data: departments },
    { data: syllabus_files },
    { data: chunks },
  ] = await Promise.all([
    adminSupabase
      .from('subjects')
      .select('id, name, code, semester, is_active, created_at, department_id')
      .eq('college_id', collegeId)
      .order('semester')
      .order('name'),

    adminSupabase
      .from('departments')
      .select('id, name, code')
      .eq('college_id', collegeId)
      .eq('is_active', true)
      .order('name'),

    adminSupabase
      .from('syllabus_files')
      .select('id, subject_id, parse_status, created_at, file_name')
      .eq('college_id', collegeId)
      .order('updated_at', { ascending: false }),

    adminSupabase
      .from('syllabus_chunks')
      .select('id, subject_id')
      .eq('college_id', collegeId),
  ])

  // Build lookup maps
  const deptMap = Object.fromEntries((departments ?? []).map(d => [d.id, d]))

  const latestFileBySubject = {}
  for (const f of syllabus_files ?? []) {
    if (!latestFileBySubject[f.subject_id]) latestFileBySubject[f.subject_id] = f
  }

  const chunkCountBySubject = {}
  for (const c of chunks ?? []) {
    chunkCountBySubject[c.subject_id] = (chunkCountBySubject[c.subject_id] ?? 0) + 1
  }

  // Group by department → semester
  const grouped = {}
  for (const subject of subjects ?? []) {
    const dept = deptMap[subject.department_id]
    const deptId = dept?.id ?? 'unknown'
    const deptName = dept?.name ?? 'Unknown Department'
    if (!grouped[deptId]) grouped[deptId] = { id: deptId, name: deptName, semesters: {} }
    const sem = subject.semester
    if (!grouped[deptId].semesters[sem]) grouped[deptId].semesters[sem] = []
    grouped[deptId].semesters[sem].push({
      ...subject,
      dept_name:   deptName,
      chunk_count: chunkCountBySubject[subject.id] ?? 0,
      latest_file: latestFileBySubject[subject.id] ?? null,
    })
  }

  const deptList = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Subjects</h1>
          <p className="text-muted text-sm mt-1">
            {subjects?.length ?? 0} subject{subjects?.length !== 1 ? 's' : ''} across all departments
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

      {deptList.length > 0 ? (
        <div className="space-y-8">
          {deptList.map((dept) => (
            <div key={dept.id}>
              <h2 className="font-heading text-base font-bold text-navy mb-3">{dept.name}</h2>
              {Object.entries(dept.semesters)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([sem, semSubjects]) => (
                  <div key={sem} className="mb-4">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">
                      Semester {sem}
                    </p>
                    <div className="bg-surface border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-bg">
                            <th className="text-left px-5 py-3 font-medium text-muted">Subject</th>
                            <th className="text-left px-5 py-3 font-medium text-muted">Code</th>
                            <th className="text-left px-5 py-3 font-medium text-muted">Topics</th>
                            <th className="text-left px-5 py-3 font-medium text-muted">Syllabus</th>
                            <th className="text-left px-5 py-3 font-medium text-muted">Status</th>
                            <th className="text-left px-5 py-3 font-medium text-muted">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {semSubjects.map((s) => (
                            <tr key={s.id} className="hover:bg-bg transition-colors">
                              <td className="px-5 py-3 font-medium text-text">{s.name}</td>
                              <td className="px-5 py-3 font-mono text-xs text-muted">{s.code}</td>
                              <td className="px-5 py-3 text-muted">
                                {s.chunk_count} topic{s.chunk_count !== 1 ? 's' : ''}
                              </td>
                              <td className="px-5 py-3">
                                {s.latest_file
                                  ? <ParseStatusBadge status={s.latest_file.parse_status} />
                                  : <Badge variant="muted">Not uploaded</Badge>
                                }
                              </td>
                              <td className="px-5 py-3">
                                <Badge variant={s.is_active ? 'success' : 'error'}>
                                  {s.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td className="px-5 py-3">
                                <CollegeAdminSubjectsClient
                                  mode="row-actions"
                                  subject={s}
                                  departments={departments ?? []}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No subjects yet.</p>
          <p className="text-muted text-xs mt-1">Click &ldquo;+ Add Subject&rdquo; to create one.</p>
        </div>
      )}
    </div>
  )
}
