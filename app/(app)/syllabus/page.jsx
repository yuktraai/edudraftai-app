import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/Badge'

export const metadata = { title: 'Syllabus — EduDraftAI' }

export default async function SyllabusPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, college_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Always scope to user's own college_id
  const { data: subjects } = await adminSupabase
    .from('subjects')
    .select(`
      id, name, code, semester,
      departments ( id, name ),
      syllabus_chunks ( id )
    `)
    .eq('college_id', profile.college_id)
    .eq('is_active', true)
    .order('semester')
    .order('name')

  // Group by department → semester
  const grouped = {}
  for (const subject of subjects ?? []) {
    const deptId = subject.departments?.id ?? 'unknown'
    const deptName = subject.departments?.name ?? 'Unknown Department'
    if (!grouped[deptId]) grouped[deptId] = { id: deptId, name: deptName, semesters: {} }
    const sem = subject.semester
    if (!grouped[deptId].semesters[sem]) grouped[deptId].semesters[sem] = []
    grouped[deptId].semesters[sem].push({
      ...subject,
      chunk_count: subject.syllabus_chunks?.length ?? 0,
    })
  }

  const deptList = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-navy">Syllabus</h1>
        <p className="text-muted text-sm mt-1">
          Browse approved syllabus topics for your college. Read-only view.
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
                    <div className="grid gap-3 sm:grid-cols-2">
                      {semSubjects.map((s) => (
                        <Link
                          key={s.id}
                          href={`/syllabus/${s.id}`}
                          className="block bg-surface border border-border rounded-xl p-4 hover:border-teal hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-text text-sm truncate">{s.name}</p>
                              <p className="text-xs font-mono text-muted mt-0.5">{s.code}</p>
                            </div>
                            <Badge variant={s.chunk_count > 0 ? 'success' : 'muted'}>
                              {s.chunk_count} topic{s.chunk_count !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {s.chunk_count === 0 && (
                            <p className="text-xs text-muted mt-2">Syllabus not yet uploaded</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No subjects found for your college.</p>
          <p className="text-muted text-xs mt-1">Contact your college admin or Yuktra AI team.</p>
        </div>
      )}
    </div>
  )
}
