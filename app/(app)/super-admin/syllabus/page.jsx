import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

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

export default async function SuperAdminSyllabusPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminSupabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  // Run separate queries — nested joins with syllabus_files/chunks are unreliable
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

    adminSupabase
      .from('departments')
      .select('id, name'),

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

  // Group by college
  const grouped = {}
  for (const s of subjects ?? []) {
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

  const collegeList   = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name))
  const totalSubjects = subjects?.length ?? 0

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Syllabus Manager</h1>
          <p className="text-muted text-sm mt-1">
            {totalSubjects} subject{totalSubjects !== 1 ? 's' : ''} across {collegeList.length} college{collegeList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/super-admin/syllabus/upload">
          <Button>Upload Syllabus PDF</Button>
        </Link>
      </div>

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
                          <div className="flex items-center gap-2">
                            <Link href={`/super-admin/syllabus/${s.id}`}>
                              <button className="text-teal text-xs font-medium hover:underline">View</button>
                            </Link>
                            <span className="text-border">|</span>
                            <Link href={`/super-admin/syllabus/upload?subject_id=${s.id}`}>
                              <button className="text-teal text-xs font-medium hover:underline">Upload</button>
                            </Link>
                          </div>
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
