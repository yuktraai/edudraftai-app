import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { AppShell } from '@/components/layout/AppShell'

export default async function AppLayout({ children }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role, college_id, is_active, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  if (!profile.is_active) {
    await supabase.auth.signOut()
    redirect('/login?error=deactivated')
  }

  // Fetch credit balance server-side for lecturer + college_admin
  let creditBalance = null
  let hasZeroBalanceLecturers = false

  if (profile.role === 'lecturer' || profile.role === 'college_admin') {
    const { data: bal } = await adminSupabase
      .rpc('get_credit_balance', { p_user_id: user.id })
    creditBalance = bal ?? 0
  }

  // For college_admin: check if any lecturer in their college has 0 credits
  if (profile.role === 'college_admin' && profile.college_id) {
    const { data: lecturers } = await adminSupabase
      .from('users')
      .select('id')
      .eq('college_id', profile.college_id)
      .eq('role', 'lecturer')
      .eq('is_active', true)

    if (lecturers?.length) {
      // Fetch aggregate credit balances from ledger
      const { data: ledger } = await adminSupabase
        .from('credit_ledger')
        .select('user_id, amount')
        .in('user_id', lecturers.map(l => l.id))

      const balanceMap = {}
      for (const row of ledger ?? []) {
        balanceMap[row.user_id] = (balanceMap[row.user_id] ?? 0) + row.amount
      }

      // Any lecturer whose sum is 0 or not in map (never received credits)
      hasZeroBalanceLecturers = lecturers.some(l => (balanceMap[l.id] ?? 0) <= 0)
    }
  }

  return (
    <AppShell
      role={profile.role}
      name={profile.name}
      creditBalance={creditBalance}
      hasZeroBalanceLecturers={hasZeroBalanceLecturers}
      userId={user.id}
      onboardingCompleted={profile.onboarding_completed ?? false}
    >
      {children}
    </AppShell>
  )
}
