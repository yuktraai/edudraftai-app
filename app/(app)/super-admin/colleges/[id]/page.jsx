import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { StatusBadge, RoleBadge } from '@/components/ui/Badge'
import { CollegeDetailClient } from './CollegeDetailClient'

export const metadata = { title: 'College Detail — EduDraftAI' }

export default async function CollegeDetailPage({ params }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: college } = await adminSupabase
    .from('colleges').select('*').eq('id', params.id).single()
  if (!college) notFound()

  const [
    { count: lecturerCount },
    { data: members },
    { data: eligibleUsers },
  ] = await Promise.all([
    adminSupabase.from('users')
      .select('*', { count: 'exact', head: true })
      .eq('college_id', params.id).eq('is_active', true),
    adminSupabase.from('users')
      .select('id, name, email, role, is_active')
      .eq('college_id', params.id)
      .order('role'),
    adminSupabase.from('users')
      .select('id, name, email, role')
      .or(`college_id.eq.${params.id},college_id.is.null`)
      .eq('is_active', true)
      .neq('role', 'super_admin')
      .neq('role', 'college_admin'),
  ])

  return (
    <div className="p-8 max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <a href="/super-admin/colleges" className="text-teal text-sm hover:underline">
            ← All Colleges
          </a>
          <h1 className="font-heading text-2xl font-bold text-navy mt-2">{college.name}</h1>
          <p className="text-muted text-sm font-mono mt-0.5">{college.code}</p>
        </div>
        <StatusBadge active={college.is_active} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Members', value: lecturerCount ?? 0 },
          { label: 'District',       value: college.district ?? '—' },
          { label: 'State',          value: college.state ?? 'Odisha' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
            <p className="text-xl font-bold text-navy mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Assign college admin */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-heading text-base font-bold text-navy mb-1">Assign College Admin</h2>
        <p className="text-muted text-sm mb-4">
          Select a lecturer to promote to college admin for this college.
        </p>
        <CollegeDetailClient
          collegeId={params.id}
          eligibleUsers={eligibleUsers ?? []}
        />
      </div>

      {/* Members table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-heading text-base font-bold text-navy">Members</h2>
        </div>
        {members && members.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-5 py-3 font-medium text-muted">Name</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Email</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Role</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-bg transition-colors">
                  <td className="px-5 py-3 font-medium text-text">{m.name}</td>
                  <td className="px-5 py-3 text-muted">{m.email}</td>
                  <td className="px-5 py-3"><RoleBadge role={m.role} /></td>
                  <td className="px-5 py-3"><StatusBadge active={m.is_active} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-muted text-sm py-8">No members yet.</p>
        )}
      </div>
    </div>
  )
}
