import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SyllabusRowActions } from './SyllabusRowActions'
import { SyllabusFilters } from './SyllabusFilters'

export const metadata = { title: 'Syllabus Manager — EduDraftAI' }

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

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default async function SuperAdminSyllabusPage({ searchParams }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminSupabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  // Extract active filters from searchParams early — needed to scope the departments query
  const activeCollegeId      = searchParams?.college_id      ?? ''
  const activeDeptId         = searchParams?.dept_id         ?? ''
  const activeSemester       = searchParams?.semester        ?? ''
  const activeSyllabusStatus = searchParams?.syllabus_status ?? '' // 'uploaded' | 'missing' | ''
  const activeSubjectIds     = (searchParams?.subject_ids ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  // Run separate queries — nested joins with syllabus_files/chunks are unreliable
  // Departments are scoped to the selected college so the dropdown stays accurate
  const deptQuery = adminSupabase
    .from('departments')
    .select('id, name, college_id')
    .eq('is_active', true)
    .order('name')
  if (activeCollegeId) deptQuery.eq('college_id', activeCollegeId)

  const [
    { data: subjects },
    { data: colleges },
    { data: departments },
    { data: syllabusFiles },
    { data: chunks },
  ] = await Promise.all([
    adminSupabase
      .from('subjects')
      .select('id, name, code, semester, is_active, college_id, department_id')
      .order('semester')
      .order('name'),

    adminSupabase
      .from('colleges')
      .select('id, name')
      .eq('is_active', true),

    deptQuery,

    // latest file per subject — ordered by created_at desc
    adminSupabase
      .from('syllabus_files')
      .select('id, subject_id, parse_status, created_at, file_name')
      .order('created_at', { ascending: false }),

    adminSupabase
      .from('syllabus_chunks')
      .select('id, subject_id'),
  ])

  // Build lookup maps
  const collegeMap = Object.fromEntries((colleges ?? []).map(c => [c.id, c]))
  const deptMap    = Object.fromEntries((departments ?? []).map(d => [d.id, d]))

  const latestFileBySubject = {}
  for (const f of syllabusFiles ?? []) {
    if (!latestFileBySubject[f.subject_id]) latestFileBySubject[f.subject_id] = f
  }

  const chunkCountBySubject = {}
  for (const c of chunks ?? []) {
    chunkCountBySubject[c.subject_id] = (chunkCountBySubject[c.subject_id] ?? 0) + 1
  }

  const totalSubjects = subjects?.length ?? 0

  // Apply filters
  const filteredSubjects = (subjects ?? []).filter((s) => {
    if (activeCollegeId && s.college_id !== activeCollegeId) return false
    if (activeDeptId    && s.department_id !== activeDeptId) return false
    if (activeSemester  && String(s.semester) !== String(activeSemester)) return false
    if (activeSubjectIds.length > 0 && !activeSubjectIds.includes(s.id)) return false
    if (activeSyllabusStatus) {
      const file = latestFileBySubject[s.id]
      const hasCompleted = file?.parse_status === 'completed'
      if (activeSyllabusStatus === 'uploaded' && !hasCompleted) return false
      if (activeSyllabusStatus === 'missing'  &&  hasCompleted) return false
    }
    return true
  })
  const filteredTotal = filteredSubjects.length

  // allDepts comes directly from the departments table (scoped to college if selected)
  // — avoids cross-college leakage and shows depts even if they have no subjects yet
  const allColleges = (colleges ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))
  const allDepts    = (departments ?? []).slice() // already ordered by name from query

  // Group filtered subjects by college
  const grouped = {}
  for (const s of filteredSubjects) {
    const college = collegeMap[s.college_id]
    const collegeId   = college?.id   ?? 'unknown'
    const collegeName = college?.name ?? 'Unknown College'
    if (!grouped[collegeId]) grouped[collegeId] = { id: collegeId, name: collegeName, subjects: [] }

    grouped[collegeId].subjects.push({
      ...s,
      dept_name:   deptMap[s.department_id]?.name ?? '—',
      chunk_count: chunkCountBySubject[s.id] ?? 0,
      latest_file: latestFileBySubject[s.id] ?? null,
    })
  }

  const collegeList = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Syllabus Manager</h1>
          <p className="text-muted text-sm mt-1">
            {totalSubjects} subject{totalSubjects !== 1 ? 's' : ''} across {(colleges ?? []).length} college{(colleges ?? []).length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/super-admin/syllabus/copy">
            <Button variant="secondary">Copy Syllabus</Button>
          </Link>
          <Link href="/super-admin/syllabus/upload">
            <Button>Upload Syllabus PDF</Button>
          </Link>
        </div>
      </div>

      <SyllabusFilters
        colleges={allColleges}
        departments={allDepts}
        subjects={subjects ?? []}
        activeCollegeId={activeCollegeId}
        activeDeptId={activeDeptId}
        activeSemester={activeSemester}
        activeSyllabusStatus={activeSyllabusStatus}
        activeSubjectIds={activeSubjectIds}
        total={totalSubjects}
        filtered={filteredTotal}
      />

      {collegeList.length > 0 ? (
        <div className="space-y-8">
          {collegeList.map((college) => (
            <div key={college.id}>
              <h2 className="font-heading text-base font-bold text-navy mb-3 flex items-center gap-2">
                {college.name}
                <Badge variant="muted">
                  {college.subjects.length} subject{college.subjects.length !== 1 ? 's' : ''}
                </Badge>
              </h2>
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg">
                      <th className="text-left px-5 py-3 font-medium text-muted">Subject</th>
                      <th className="text-left px-5 py-3 font-medium text-muted">Code</th>
                      <th className="text-left px-5 py-3 font-medium text-muted">Dept</th>
                      <th className="text-left px-5 py-3 font-medium text-muted">Sem</th>
                      <th className="text-left px-5 py-3 font-medium text-muted">Topics</th>
                      <th className="text-left px-5 py-3 font-medium text-muted">Parse Status</th>
                      <th className="text-left px-5 py-3 font-medium text-muted">Uploaded</th>
                      <th className="text-left px-5 py-3 font-medium text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {college.subjects.map((s) => (
                      <tr key={s.id} className="hover:bg-bg transition-colors">
                        <td className="px-5 py-3 font-medium text-text">{s.name}</td>
                        <td className="px-5 py-3 font-mono text-xs text-muted">{s.code}</td>
                        <td className="px-5 py-3 text-muted text-xs">{s.dept_name}</td>
                        <td className="px-5 py-3 text-muted">{s.semester}</td>
                        <td className="px-5 py-3 text-muted">{s.chunk_count}</td>
                        <td className="px-5 py-3">
                          {s.latest_file
                            ? <ParseStatusBadge status={s.latest_file.parse_status} />
                            : <Badge variant="muted">Not uploaded</Badge>
                          }
                        </td>
                        <td className="px-5 py-3 text-muted text-xs">
                          {formatDate(s.latest_file?.created_at)}
                        </td>
                        <td className="px-5 py-3">
                          <SyllabusRowActions subjectId={s.id} subjectName={s.name} hasFile={!!s.latest_file} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No subjects found.</p>
          <p className="text-muted text-xs mt-1">
            Create colleges and add subjects via the admin portal first.
          </p>
        </div>
      )}
    </div>
  )
}
