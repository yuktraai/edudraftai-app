import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { RoleBadge, StatusBadge } from '@/components/ui/Badge'
import { UsersClient } from './UsersClient'

export const metadata = { title: 'Lecturers — EduDraftAI' }

export default async function AdminUsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('role, college_id').eq('id', user.id).single()
  if (!['college_admin', 'super_admin'].includes(profile?.role)) redirect('/dashboard')

  const { data: users } = await adminSupabase
    .from('users')
    .select('id, name, email, role, is_active, created_at, demo_credits_used')
    .eq('college_id', profile.college_id)
    .neq('role', 'super_admin')
    .order('created_at', { ascending: false })

  // Fetch credit balances for all users in this college
  const userIds = (users ?? []).map(u => u.id)
  let balanceMap = {}
  if (userIds.length) {
    const { data: ledger } = await adminSupabase
      .from('credit_ledger')
      .select('user_id, amount')
      .in('user_id', userIds)

    for (const row of ledger ?? []) {
      balanceMap[row.user_id] = (balanceMap[row.user_id] ?? 0) + row.amount
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Lecturers</h1>
          <p className="text-muted text-sm mt-1">
            {users?.length ?? 0} member{users?.length !== 1 ? 's' : ''} in your college
          </p>
        </div>
        <a
          href="/admin/users/invite"
          className="bg-teal hover:bg-teal-2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + Invite Lecturer
        </a>
      </div>

      {users && users.length > 0 ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-5 py-3 font-medium text-muted">Name</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Email</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Role</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Credits</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wide">Demo</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => {
                const balance    = balanceMap[u.id] ?? 0
                const isZero     = u.is_active && balance <= 0
                const rowClass   = isZero ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-bg'

                return (
                  <tr key={u.id} className={`transition-colors ${rowClass}`}>
                    <td className="px-5 py-3 font-medium text-text">
                      <div className="flex items-center gap-2">
                        {isZero && (
                          <span
                            className="inline-block w-2 h-2 rounded-full bg-error shrink-0"
                            title="Out of credits"
                          />
                        )}
                        {u.name}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted">{u.email}</td>
                    <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-semibold ${
                        balance <= 0  ? 'text-error'   :
                        balance <= 5  ? 'text-warning'  :
                        'text-success'
                      }`}>
                        {balance}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs text-muted">{u.demo_credits_used ?? 0}/3</span>
                    </td>
                    <td className="px-5 py-3"><StatusBadge active={u.is_active} /></td>
                    <td className="px-5 py-3">
                      <UsersClient userId={u.id} userName={u.name} isActive={u.is_active} role={u.role} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No lecturers yet.</p>
          <a href="/admin/users/invite" className="text-teal text-sm hover:underline mt-2 inline-block">
            Invite your first lecturer →
          </a>
        </div>
      )}
    </div>
  )
}
