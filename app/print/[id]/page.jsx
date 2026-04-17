import { redirect, notFound } from 'next/navigation'
import { createClient }  from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { PrintDocument } from '@/components/generation/PrintDocument'

// Standalone page — intentionally outside (app) route group so no sidebar/header renders
export const metadata = { title: 'EduDraftAI' }
export const dynamic  = 'force-dynamic'

export default async function PrintPage({ params, searchParams }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminSupabase
    .from('users').select('role, college_id, name').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: generation } = await adminSupabase
    .from('content_generations')
    .select('*')
    .eq('id', params.id)
    .neq('status', 'deleted')
    .single()

  if (!generation) notFound()

  // Access check: owner OR college_admin of same college OR super_admin
  const isOwner      = generation.user_id === user.id
  const isAdmin      = profile.role === 'college_admin' && generation.college_id === profile.college_id
  const isSuperAdmin = profile.role === 'super_admin'
  if (!isOwner && !isAdmin && !isSuperAdmin) notFound()

  // Fetch college + subject (with department) + lecturer name in parallel
  const [collegeRes, subjectRes, lecturerRes] = await Promise.all([
    adminSupabase
      .from('colleges')
      .select('name, address, logo_url, district, state')
      .eq('id', generation.college_id)
      .single(),

    generation.subject_id
      ? adminSupabase
          .from('subjects')
          .select('name, semester, departments(name)')
          .eq('id', generation.subject_id)
          .single()
      : Promise.resolve({ data: null }),

    adminSupabase
      .from('users')
      .select('name')
      .eq('id', generation.user_id)
      .single(),
  ])

  const college  = collegeRes.data  ?? {}
  const subject  = subjectRes.data  ?? null
  const lecturer = lecturerRes.data ?? null

  // Build enriched subject info from subject row OR prompt_params fallback
  const subjectInfo = {
    name:            subject?.name            ?? generation.prompt_params?.subject_name ?? '—',
    semester:        subject?.semester        ?? generation.prompt_params?.semester     ?? null,
    department_name: subject?.departments?.name ?? null,
  }

  const autoprint = searchParams?.autoprint === '1'

  return (
    <PrintDocument
      generation={generation}
      college={college}
      subjectInfo={subjectInfo}
      lecturer={lecturer}
      autoprint={autoprint}
    />
  )
}
