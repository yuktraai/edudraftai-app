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
    .select('name, role, college_id, is_active')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  if (!profile.is_active) {
    await supabase.auth.signOut()
    redirect('/login?error=deactivated')
  }

  // Fetch credit balance server-side for lecturer + college_admin
  let creditBalance = null
  if (profile.role === 'lecturer' || profile.role === 'college_admin') {
    const { data: bal } = await adminSupabase
      .rpc('get_credit_balance', { p_user_id: user.id })
    creditBalance = bal ?? 0
  }

  return (
    <AppShell role={profile.role} name={profile.name} creditBalance={creditBalance}>
      {children}
    </AppShell>
  )
}
