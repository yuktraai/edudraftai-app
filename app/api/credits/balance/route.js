import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/credits/balance
// Returns pool balance + personal balance + demo credits remaining.
// The generate page uses this to decide whether the Generate button is enabled.
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    // Pool credit balance
    const { data: poolBalance, error } = await adminSupabase
      .rpc('get_credit_balance', { p_user_id: user.id })
    if (error) throw error

    // Personal credit balance
    const { data: personalRows } = await adminSupabase
      .from('personal_credit_ledger')
      .select('amount')
      .eq('user_id', user.id)
    const personalBalance = (personalRows ?? []).reduce((s, r) => s + r.amount, 0)

    // Demo credits remaining
    const { data: userRecord } = await adminSupabase
      .from('users')
      .select('demo_credits_used')
      .eq('id', user.id)
      .single()
    const demoCreditsUsed = userRecord?.demo_credits_used ?? 0

    // User is demo-eligible if they've used < 3 AND have no admin-granted credits
    let demoCreditsRemaining = 0
    if (demoCreditsUsed < 3) {
      const { data: adminCredits } = await adminSupabase
        .from('credit_ledger')
        .select('id')
        .eq('user_id', user.id)
        .in('reason', ['admin_grant', 'monthly_allocation', 'refund'])
        .limit(1)
      const hasAdminCredits = (adminCredits?.length ?? 0) > 0
      if (!hasAdminCredits) {
        demoCreditsRemaining = 3 - demoCreditsUsed
      }
    }

    const balance = (poolBalance ?? 0) + personalBalance

    return Response.json({
      balance,
      personalBalance,
      demoCreditsRemaining,
      // effectiveBalance = what the user can actually generate with right now
      effectiveBalance: balance + demoCreditsRemaining,
    })
  } catch (err) {
    logger.error('[GET /api/credits/balance]', err)
    return Response.json({ error: 'Failed to fetch balance', balance: 0, effectiveBalance: 0, demoCreditsRemaining: 0 }, { status: 500 })
  }
}
