import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient }  from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'

export const metadata = { title: 'Dashboard — EduDraftAI' }

const TYPE_META = {
  lesson_notes:  { label: 'Lesson Notes',  icon: '📝', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  mcq_bank:      { label: 'MCQ Bank',      icon: '✅', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  question_bank: { label: 'Question Bank', icon: '📋', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  test_plan:     { label: 'Internal Test', icon: '🗓', color: 'text-teal',       bg: 'bg-teal-light', border: 'border-teal' },
}

function relativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'Just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)   return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

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

  // Fetch all stats in parallel
  const [genRes, balanceRes, personalRes, userRes, recentRes] = await Promise.all([
    // All completed generations for this lecturer
    adminSupabase
      .from('content_generations')
      .select('content_type, credits_used, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false }),

    // Pool credit balance
    adminSupabase.rpc('get_credit_balance', { p_user_id: user.id }),

    // Personal credit balance
    adminSupabase
      .from('personal_credit_ledger')
      .select('amount')
      .eq('user_id', user.id),

    // For demo credits calculation
    adminSupabase
      .from('users')
      .select('demo_credits_used')
      .eq('id', user.id)
      .single(),

    // Recent 6 drafts with subject name
    adminSupabase
      .from('content_generations')
      .select('id, content_type, prompt_params, created_at, subjects(name, semester)')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const allGens        = genRes.data ?? []
  const poolBalance    = balanceRes.data ?? 0
  const personalBalance = (personalRes.data ?? []).reduce((s, r) => s + r.amount, 0)
  const recentDrafts   = recentRes.data ?? []

  // Demo credits remaining (same logic as AppShell / generate page)
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

  // Effective balance = everything the user can actually generate with
  const creditBalance    = poolBalance + personalBalance
  const effectiveBalance = creditBalance + demoCreditsRemaining

  // Compute stats
  const totalGenerated  = allGens.length
  const totalCreditsUsed = allGens.reduce((s, g) => s + (g.credits_used ?? 1), 0)

  // Content type breakdown
  const byType = { lesson_notes: 0, mcq_bank: 0, question_bank: 0, test_plan: 0 }
  allGens.forEach(g => { if (byType[g.content_type] !== undefined) byType[g.content_type]++ })
  const topTypeEntry = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]
  const topType      = topTypeEntry?.[0] ?? null
  const topTypeMeta  = topType ? TYPE_META[topType] : null

  // This month
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const thisMonth  = allGens.filter(g => new Date(g.created_at) >= monthStart).length

  const QUICK_ACTIONS = [
    { title: 'Lesson Notes',    desc: 'Structured notes tied to your syllabus topic.', href: '/generate/lesson_notes',  icon: '📝' },
    { title: 'MCQ Bank',        desc: 'Multiple-choice questions with answer key.',     href: '/generate/mcq_bank',      icon: '✅' },
    { title: 'Question Bank',   desc: '2-mark, 5-mark & 10-mark in SCTEVT format.',    href: '/generate/question_bank', icon: '📋' },
    { title: 'Internal Test',   desc: 'Full test paper with mark distribution.',        href: '/generate/test_plan',     icon: '🗓' },
  ]

  return (
    <div className="p-8 max-w-5xl space-y-8">

      {/* ── Welcome ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">
            Welcome back, {profile?.name?.split(' ')[0] ?? 'Lecturer'} 👋
          </h1>
          <p className="text-muted text-sm mt-1">
            Here's a summary of your activity on EduDraftAI.
          </p>
        </div>
        <Link
          href="/generate"
          className="flex items-center gap-2 bg-teal hover:bg-teal-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Generate Content
        </Link>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Generated */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Total Generated</p>
            <div className="w-8 h-8 rounded-lg bg-navy/5 flex items-center justify-center text-base">📄</div>
          </div>
          <p className="text-3xl font-bold text-navy">{totalGenerated}</p>
          <p className="text-xs text-muted mt-1">{thisMonth} this month</p>
        </div>

        {/* Credits Used */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Credits Used</p>
            <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center text-base">💳</div>
          </div>
          <p className="text-3xl font-bold text-navy">{totalCreditsUsed}</p>
          <p className="text-xs text-muted mt-1">All time</p>
        </div>

        {/* Credits Remaining */}
        <div className={`border rounded-xl p-5 ${
          effectiveBalance <= 0  ? 'bg-red-50 border-red-200'  :
          effectiveBalance <= 5  ? 'bg-amber-50 border-amber-200' :
          'bg-teal-light border-teal/30'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Credits Left</p>
            <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center text-base">⚡</div>
          </div>
          <p className={`text-3xl font-bold ${
            effectiveBalance <= 0  ? 'text-error'   :
            effectiveBalance <= 5  ? 'text-warning'  :
            'text-teal'
          }`}>{effectiveBalance}</p>
          <p className="text-xs text-muted mt-1">
            {effectiveBalance <= 0 ? 'Contact admin to top up' :
             demoCreditsRemaining > 0 && creditBalance === 0 ? `${demoCreditsRemaining} demo · ${personalBalance} personal` :
             personalBalance > 0 && poolBalance === 0 ? `${personalBalance} personal` :
             effectiveBalance <= 5 ? 'Running low' : 'Available to use'}
          </p>
        </div>

        {/* Top Content Type */}
        <div className={`border rounded-xl p-5 ${topTypeMeta ? `${topTypeMeta.bg} ${topTypeMeta.border}` : 'bg-surface border-border'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Most Used</p>
            <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center text-base">
              {topTypeMeta?.icon ?? '📊'}
            </div>
          </div>
          {topTypeMeta ? (
            <>
              <p className={`text-lg font-bold leading-tight ${topTypeMeta.color}`}>{topTypeMeta.label}</p>
              <p className="text-xs text-muted mt-1">{byType[topType]} generations</p>
            </>
          ) : (
            <p className="text-sm text-muted">No data yet</p>
          )}
        </div>
      </div>

      {/* ── Content Type Breakdown ── */}
      {totalGenerated > 0 && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text mb-4">Content Breakdown</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(TYPE_META).map(([type, meta]) => {
              const count = byType[type] ?? 0
              const pct   = totalGenerated > 0 ? Math.round((count / totalGenerated) * 100) : 0
              return (
                <div key={type} className={`rounded-xl border ${meta.border} ${meta.bg} p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{meta.icon}</span>
                    <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
                  </div>
                  <p className={`text-2xl font-bold ${meta.color}`}>{count}</p>
                  <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${meta.color.replace('text-', 'bg-')}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted mt-1">{pct}% of total</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <div className="text-3xl mb-3">✨</div>
            <p className="text-sm font-medium text-text">No drafts yet</p>
            <p className="text-muted text-xs mt-1">Generate your first piece of content using the buttons below.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentDrafts.map(draft => {
              const meta    = TYPE_META[draft.content_type] ?? { label: draft.content_type, icon: '📄', color: 'text-muted', bg: 'bg-bg', border: 'border-border' }
              const topic   = draft.prompt_params?.topic ?? '—'
              const subject = draft.subjects?.name ?? ''
              const sem     = draft.subjects?.semester
              return (
                <Link
                  key={draft.id}
                  href={`/drafts/${draft.id}`}
                  className="group block bg-surface border border-border hover:border-teal rounded-xl p-4 transition-all hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color} ${meta.border}`}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className="text-[10px] text-muted shrink-0">{relativeTime(draft.created_at)}</span>
                  </div>
                  <p className="text-sm font-semibold text-navy group-hover:text-teal transition-colors line-clamp-2 leading-snug">
                    {topic}
                  </p>
                  {subject && (
                    <p className="text-xs text-muted mt-1 truncate">
                      {subject}{sem ? ` · Sem ${sem}` : ''}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="font-heading text-lg font-bold text-navy mb-3">Generate New</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ title, desc, href, icon }) => (
            <Link
              key={href}
              href={href}
              className="group block bg-surface border border-border rounded-xl p-4 hover:border-teal hover:shadow-sm transition-all"
            >
              <div className="text-2xl mb-2">{icon}</div>
              <h3 className="font-semibold text-navy group-hover:text-teal transition-colors text-sm">{title}</h3>
              <p className="text-muted text-xs mt-1 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
