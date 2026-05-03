import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { SyllabusClient } from './SyllabusClient'

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

  // Fetch subjects + favorites in parallel
  const [subjectsRes, favoritesRes] = await Promise.all([
    adminSupabase
      .from('subjects')
      .select(`id, name, code, semester, departments ( id, name ), syllabus_chunks ( id )`)
      .eq('college_id', profile.college_id)
      .eq('is_active', true)
      .order('semester')
      .order('name'),
    adminSupabase
      .from('lecturer_favorites')
      .select('item_type, item_id')
      .eq('user_id', user.id),
  ])

  const subjects   = subjectsRes.data ?? []
  const favorites  = favoritesRes.data ?? []
  const favDepts   = new Set(favorites.filter(f => f.item_type === 'department').map(f => f.item_id))
  const favSubjects = new Set(favorites.filter(f => f.item_type === 'subject').map(f => f.item_id))

  // Group by department → semester
  const grouped = {}
  for (const subject of subjects) {
    const deptId   = subject.departments?.id   ?? 'unknown'
    const deptName = subject.departments?.name ?? 'Unknown Department'
    if (!grouped[deptId]) {
      grouped[deptId] = {
        id: deptId,
        name: deptName,
        favorited: favDepts.has(deptId),
        semesters: {},
      }
    }
    const sem = subject.semester
    if (!grouped[deptId].semesters[sem]) grouped[deptId].semesters[sem] = []
    grouped[deptId].semesters[sem].push({
      ...subject,
      chunk_count: subject.syllabus_chunks?.length ?? 0,
      favorited:   favSubjects.has(subject.id),
    })
  }

  const deptList = Object.values(grouped).sort((a, b) => {
    // Favorited departments first
    if (a.favorited && !b.favorited) return -1
    if (!a.favorited && b.favorited) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-navy">Syllabus</h1>
        <p className="text-muted text-sm mt-1">
          Browse approved syllabus topics for your college. Star subjects you teach.
        </p>
      </div>

      <SyllabusClient
        deptList={deptList}
        hasFavorites={favSubjects.size > 0 || favDepts.size > 0}
      />
    </div>
  )
}
