import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { DepartmentsClient } from './DepartmentsClient'

export const metadata = { title: 'Departments — EduDraftAI' }

export default async function DepartmentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role, college_id').eq('id', user.id).single()
  if (!['college_admin', 'super_admin'].includes(profile?.role)) redirect('/dashboard')

  const { data: departments } = await adminSupabase
    .from('departments')
    .select('id, name, code, is_active, created_at')
    .eq('college_id', profile.college_id)
    .eq('is_active', true)
    .order('name')

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Departments</h1>
          <p className="text-muted text-sm mt-1">
            {departments?.length ?? 0} department{departments?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <DepartmentsClient mode="add-button" departments={departments ?? []} />
      </div>

      {departments && departments.length > 0 ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-5 py-3 font-medium text-muted">Name</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Code</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {departments.map((d) => (
                <tr key={d.id} className="hover:bg-bg transition-colors">
                  <td className="px-5 py-3 font-medium text-text">{d.name}</td>
                  <td className="px-5 py-3 text-muted font-mono text-xs">{d.code}</td>
                  <td className="px-5 py-3">
                    <DepartmentsClient mode="row-actions" department={d} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No departments yet.</p>
          <p className="text-muted text-xs mt-1">Click &ldquo;+ Add Department&rdquo; to create one.</p>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        Departments group subjects and lecturers. Subjects are managed within each department.
      </p>
    </div>
  )
}
