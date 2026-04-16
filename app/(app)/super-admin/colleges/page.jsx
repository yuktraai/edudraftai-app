import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { StatusBadge } from '@/components/ui/Badge'
import { CollegesClient } from './CollegesClient'

export const metadata = { title: 'Colleges — EduDraftAI' }

export default async function SuperAdminCollegesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: colleges } = await adminSupabase
    .from('colleges')
    .select('id, name, code, district, is_active, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Colleges</h1>
          <p className="text-muted text-sm mt-1">
            {colleges?.length ?? 0} college{colleges?.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <CollegesClient mode="button-only" />
      </div>

      {colleges && colleges.length > 0 ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-5 py-3 font-medium text-muted">Name</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Code</th>
                <th className="text-left px-5 py-3 font-medium text-muted">District</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {colleges.map((c) => (
                <tr key={c.id} className="hover:bg-bg transition-colors">
                  <td className="px-5 py-3 font-medium text-text">{c.name}</td>
                  <td className="px-5 py-3 text-muted font-mono text-xs">{c.code}</td>
                  <td className="px-5 py-3 text-muted">{c.district ?? '—'}</td>
                  <td className="px-5 py-3"><StatusBadge active={c.is_active} /></td>
                  <td className="px-5 py-3">
                    <a
                      href={`/super-admin/colleges/${c.id}`}
                      className="text-teal hover:underline text-xs font-medium"
                    >
                      Manage →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No colleges yet.</p>
          <p className="text-muted text-xs mt-1">Click &ldquo;+ New College&rdquo; to add the first one.</p>
        </div>
      )}
    </div>
  )
}
