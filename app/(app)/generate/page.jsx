import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { ContentTypeCard } from '@/components/generation/ContentTypeCard'

export const metadata = { title: 'Generate Content — EduDraftAI' }

const CONTENT_TYPES = ['lesson_notes', 'mcq_bank', 'question_bank', 'test_plan', 'exam_paper']

export default async function GeneratePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await adminSupabase
    .from('users')
    .select('role, college_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')
  // super_admin has no college_id so cannot generate content
  if (profile.role === 'super_admin') redirect('/super-admin/colleges')

  // Pool credit balance
  const { data: poolBalance } = await adminSupabase
    .rpc('get_credit_balance', { p_user_id: user.id })

  // Personal credit balance
  const { data: personalRows } = await adminSupabase
    .from('personal_credit_ledger')
    .select('amount')
    .eq('user_id', user.id)
  const personalBalance = (personalRows ?? []).reduce((s, r) => s + r.amount, 0)

  // Demo credits remaining
  let demoCreditsRemaining = 0
  const { data: userRecord } = await adminSupabase
    .from('users').select('demo_credits_used').eq('id', user.id).single()
  const demoUsed = userRecord?.demo_credits_used ?? 0
  if (demoUsed < 3) {
    const { data: adminCredits } = await adminSupabase
      .from('credit_ledger').select('id')
      .eq('user_id', user.id)
      .in('reason', ['admin_grant', 'monthly_allocation', 'refund'])
      .limit(1)
    if ((adminCredits?.length ?? 0) === 0) demoCreditsRemaining = 3 - demoUsed
  }

  const balance = (poolBalance ?? 0) + personalBalance
  const effectiveBalance = balance + demoCreditsRemaining
  const isDemo = demoCreditsRemaining > 0 && balance === 0

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Generate Content</h1>
          <p className="text-muted text-sm mt-1">
            Choose a content type to get started. Each generation uses 1 credit.
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${
          effectiveBalance > 0
            ? 'bg-teal-light border-teal text-teal'
            : 'bg-red-50 border-red-200 text-error'
        }`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {isDemo
            ? `${demoCreditsRemaining} demo credit${demoCreditsRemaining !== 1 ? 's' : ''} remaining`
            : `${effectiveBalance} credit${effectiveBalance !== 1 ? 's' : ''} remaining`
          }
        </div>
      </div>

      {effectiveBalance === 0 && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <svg className="w-5 h-5 text-error shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-error">Out of credits</p>
            <p className="text-xs text-red-600 mt-0.5">
              You have no credits remaining. Contact your college admin to request more.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {CONTENT_TYPES.map((type) => (
          <ContentTypeCard key={type} type={type} />
        ))}
      </div>
    </div>
  )
}
