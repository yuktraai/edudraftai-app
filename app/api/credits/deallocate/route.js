/**
 * POST /api/credits/deallocate
 *
 * College admin reclaims credits from a lecturer back to the college pool.
 * Body: { target_user_id, amount? }
 *   - amount: optional. If omitted, reclaims the full balance.
 *
 * Mechanism: inserts a negative credit_ledger row for the user.
 * The pool balance is implicitly restored (pool = purchased - sum of user ledger).
 */

import { createClient }  from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger }        from '@/lib/logger'

export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role, college_id').eq('id', user.id).single()

    if (!['college_admin', 'super_admin'].includes(profile?.role))
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { target_user_id, amount } = body

    if (!target_user_id)
      return Response.json({ error: 'target_user_id is required' }, { status: 400 })

    // Verify target belongs to same college
    const { data: targetUser } = await adminSupabase
      .from('users')
      .select('id, name, college_id')
      .eq('id', target_user_id)
      .eq('college_id', profile.college_id)
      .single()

    if (!targetUser)
      return Response.json({ error: 'User not found in your college' }, { status: 404 })

    // Get current balance
    const { data: balance } = await adminSupabase
      .rpc('get_credit_balance', { p_user_id: target_user_id })

    const currentBalance = balance ?? 0
    if (currentBalance <= 0)
      return Response.json({ error: 'User has no credits to reclaim' }, { status: 400 })

    // If amount not specified, reclaim all
    const reclaim = (amount && amount > 0 && amount <= currentBalance)
      ? amount
      : currentBalance

    // Deduct from user's ledger — use 'admin_grant' with negative amount (within allowed reasons)
    const { error: ledgerErr } = await adminSupabase
      .from('credit_ledger')
      .insert({
        user_id:     target_user_id,
        college_id:  profile.college_id,
        amount:      -reclaim,
        reason:      'admin_grant',
        granted_by:  user.id,
      })

    if (ledgerErr) throw ledgerErr

    // Restore credits to college pool (reason 'refund' = returned from user)
    const { error: poolErr } = await adminSupabase
      .from('college_credit_pool')
      .insert({
        college_id:  profile.college_id,
        amount:      reclaim,
        reason:      'refund',
        created_by:  user.id,
      })

    if (poolErr) {
      // Non-fatal — user ledger already updated, log and continue
      logger.error('[POST /api/credits/deallocate] Pool restore failed', poolErr.message)
    }

    logger.info('[POST /api/credits/deallocate] Reclaimed', {
      from: target_user_id, reclaim, by: user.id,
    })

    return Response.json({ success: true, credits_reclaimed: reclaim })
  } catch (err) {
    logger.error('[POST /api/credits/deallocate]', err)
    return Response.json({ error: 'Failed to reclaim credits', code: err.message }, { status: 500 })
  }
}
