import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { PrintDocument } from '@/components/generation/PrintDocument'

// Standalone page — no sidebar layout
export const metadata = { title: 'Print — EduDraftAI' }

// Opt out of the (app) layout
export const dynamic = 'force-dynamic'

export default async function PrintPage({ params, searchParams }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminSupabase
    .from('users')
    .select('role, college_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch generation — must belong to user (lecturer) or college (admin)
  const genQuery = adminSupabase
    .from('content_generations')
    .select('*')
    .eq('id', params.id)
    .neq('status', 'deleted')
    .single()

  const { data: generation } = await genQuery

  if (!generation) notFound()

  // Access check
  const isOwner  = generation.user_id === user.id
  const isAdmin  = profile.role === 'college_admin' && generation.college_id === profile.college_id
  const isSuperAdmin = profile.role === 'super_admin'

  if (!isOwner && !isAdmin && !isSuperAdmin) notFound()

  // Fetch college for branding
  const { data: college } = await adminSupabase
    .from('colleges')
    .select('name, address, logo_url, district')
    .eq('id', generation.college_id)
    .single()

  const autoprint = searchParams?.autoprint === '1'

  return (
    <PrintDocument
      generation={generation}
      college={college ?? {}}
      autoprint={autoprint}
    />
  )
}
