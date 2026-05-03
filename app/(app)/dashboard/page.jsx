import { redirect }          from 'next/navigation'
import Link                  from 'next/link'
import { createClient }      from '@/lib/supabase/server'
import { adminSupabase }     from '@/lib/supabase/admin'
import { WelcomeHeader }     from '@/components/dashboard/WelcomeHeader'
import { StatCard }          from '@/components/dashboard/StatCard'
import { CreditBar }         from '@/components/dashboard/CreditBar'
import { ActivityChart }     from '@/components/dashboard/ActivityChart'
import { ContentBreakdown }  from '@/components/dashboard/ContentBreakdown'
import { GenerateGrid }      from '@/components/dashboard/GenerateGrid'
import { RecentDraftCard }   from '@/components/dashboard/RecentDraftCard'

export const metadata = { title: 'Dashboard — EduDraftAI' }

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role, college_id')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'super_admin')   redirect('/super-admin/colleges')
  if (profile?.role === 'college_admin') redirect('/admin/dashboard')

  // All data in parallel — no waterfalls
  const now       = new Date()
  const weekAgo   = new Date(now); weekAgo.setDate(now.getDate() - 7)
  const lastWeek  = new Date(now); lastWeek.setDate(now.getDate() - 14)

  const [genRes, balanceRes, personalRes, userRes, recentRes] = await Promise.all([
    adminSupabase
      .from('content_generations')
      .select('id, content_type, credits_used, created_at, raw_output, prompt_params, subjects(name, semester)')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false }),

    adminSupabase.rpc('get_credit_balance', { p_user_id: user.id }),

    adminSupabase
      .from('personal_credit_ledger')
      .select('amount')
      .eq('user_id', user.id),

    adminSupabase
      .from('users')
      .select('demo_credits_used')
      .eq('id', user.id)
      .single(),

    adminSupabase
      .from('content_generations')
      .select('id, content_type, prompt_params, created_at, raw_output, subjects(name, semester)')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const allGens         = genRes.data ?? []
  const poolBalance     = balanceRes.data ?? 0
  const personalBalance = (personalRes.data ?? []).reduce((s, r) => s + r.amount, 0)
  const recentDrafts    = recentRes.data ?? []

  // Demo credits
  let demoCreditsRemaining = 0
  const demoUsed = userRes.data?.demo_credits_used ?? 0
  if (demoUsed < 3 && poolBalance === 0 && personalBalance === 0) {
    const { data: adminCredits } = await adminSupabase
      .from('credit_ledger').select('id')
      .eq('user_id', user.id)
      .in('reason', ['admin_grant', 'monthly_allocation', 'refund'])
      .limit(1)
    if ((adminCredits?.length ?? 0) === 0) demoCreditsRemaining = 3 - demoUsed
  }

  const creditBalance    = poolBalance + personalBalance
  const effectiveBalance = creditBalance + demoCreditsRemaining

  // Stats
  const totalGenerated   = allGens.length
  const totalCreditsUsed = allGens.reduce((s, g) => s + (g.credits_used ?? 1), 0)

  const thisWeekCount = allGens.filter(g => new Date(g.created_at) >= weekAgo).length
  const lastWeekCount = allGens.filter(g => {
    const d = new Date(g.created_at)
    return d >= lastWeek && d < weekAgo
  }).length
  const weekTrend = thisWeekCount - lastWeekCount

  // Content type breakdown
  const byType = { lesson_notes: 0, mcq_bank: 0, question_bank: 0, test_plan: 0 }
  allGens.forEach(g => { if (byType[g.content_type] !== undefined) byType[g.content_type]++ })

  // Trend vs last week per content type (for stat card label)
  const topTypeEntry = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]
  const topType      = topTypeEntry?.[0]

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-7">

      {/* ── Welcome ── */}
      <WelcomeHeader
        name={profile?.name}
        creditsLeft={effectiveBalance}
        weekCount={thisWeekCount}
      />

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Generated"
          value={totalGenerated}
          sub="All time"
          trend={weekTrend}
          trendLabel="vs last week"
          icon={
            <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />

        <StatCard
          label="Credits Used"
          value={totalCreditsUsed}
          sub="All time"
          icon={
            <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          }
        />

        <CreditBar
          used={totalCreditsUsed}
          balance={effectiveBalance}
          demoRemaining={demoCreditsRemaining}
        />

        <StatCard
          label="This Week"
          value={thisWeekCount}
          sub={`${lastWeekCount} last week`}
          trend={weekTrend}
          trendLabel="change"
          icon={
            <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />
      </div>

      {/* ── Activity Chart (client component) ── */}
      <ActivityChart />

      {/* ── Content Breakdown ── */}
      <ContentBreakdown byType={byType} total={totalGenerated} />

      {/* ── Generate New (primary CTA — above recent drafts) ── */}
      <GenerateGrid />

      {/* ── Recent Drafts ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-bold text-navy">Recent Drafts</h2>
          {recentDrafts.length > 0 && (
            <Link href="/drafts" className="text-teal text-xs font-medium hover:underline">
              View all →
            </Link>
          )}
        </div>

        {recentDrafts.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-navy mb-1">Your drafts will appear here</p>
            <p className="text-muted text-xs mb-4">Generate your first piece of content to get started.</p>
            <Link
              href="/generate/lesson_notes"
              className="inline-flex items-center gap-2 bg-teal text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-2 transition-colors"
            >
              Generate your first lesson note
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentDrafts.map(draft => (
              <RecentDraftCard key={draft.id} draft={draft} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
