import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const REFERRAL_REWARD_CREDITS = 5 // credits awarded to referrer when referee completes first generation

/**
 * Generate a referral code for a user if they don't have one.
 * Returns the code (existing or newly created).
 */
export async function ensureReferralCode(userId) {
  const { data: user } = await adminSupabase
    .from('users')
    .select('referral_code')
    .eq('id', userId)
    .single()

  if (user?.referral_code) return user.referral_code

  // Generate a unique 8-char uppercase hex code
  const code = Math.random().toString(36).substring(2, 10).toUpperCase()
  await adminSupabase
    .from('users')
    .update({ referral_code: code })
    .eq('id', userId)

  return code
}

/**
 * Resolve a referral code to the referrer's user ID.
 * Returns null if not found.
 */
export async function resolveReferralCode(code) {
  if (!code) return null
  const { data } = await adminSupabase
    .from('users')
    .select('id')
    .eq('referral_code', code.toUpperCase())
    .single()
  return data?.id ?? null
}

/**
 * Record a referral when a new user is invited/registered.
 * Creates a pending referral_rewards row.
 */
export async function recordReferral(referrerId, referredId) {
  try {
    // Prevent self-referral
    if (referrerId === referredId) return

    // Check if already recorded
    const { data: existing } = await adminSupabase
      .from('referral_rewards')
      .select('id')
      .eq('referred_id', referredId)
      .single()
    if (existing) return

    // Link referred_by on users table
    await adminSupabase
      .from('users')
      .update({ referred_by: referrerId })
      .eq('id', referredId)

    // Create pending reward row
    await adminSupabase.from('referral_rewards').insert({
      referrer_id: referrerId,
      referred_id: referredId,
      status: 'pending',
    })
  } catch (err) {
    logger.error('[recordReferral]', err)
  }
}

/**
 * Check if a pending referral should now be rewarded (after first successful generation).
 * Credits are added to the referrer's personal credit ledger.
 */
export async function maybeRewardReferral(referredId) {
  try {
    // Find pending reward for this user
    const { data: reward } = await adminSupabase
      .from('referral_rewards')
      .select('id, referrer_id')
      .eq('referred_id', referredId)
      .eq('status', 'pending')
      .single()

    if (!reward) return

    // Mark as rewarded first (optimistic, prevent double-reward)
    const { error: updateErr } = await adminSupabase
      .from('referral_rewards')
      .update({ status: 'rewarded', rewarded_at: new Date().toISOString() })
      .eq('id', reward.id)
      .eq('status', 'pending')

    if (updateErr) return // another process already handled it

    // Add credits to referrer's personal credit ledger
    await adminSupabase.from('personal_credit_ledger').insert({
      user_id: reward.referrer_id,
      amount:  REFERRAL_REWARD_CREDITS,
      reason:  'referral_reward',
      notes:   `Referral reward for user ${referredId}`,
    })

    logger.info(`[referral] Rewarded ${REFERRAL_REWARD_CREDITS} credits to ${reward.referrer_id}`)
  } catch (err) {
    logger.error('[maybeRewardReferral]', err)
  }
}

/**
 * Get referral stats for a user.
 */
export async function getReferralStats(userId) {
  const [{ data: user }, { data: rewards }] = await Promise.all([
    adminSupabase.from('users').select('referral_code').eq('id', userId).single(),
    adminSupabase
      .from('referral_rewards')
      .select('status, rewarded_at, referred_id, users!referred_id(name)')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false }),
  ])

  const totalReferred = (rewards ?? []).length
  const totalRewarded = (rewards ?? []).filter(r => r.status === 'rewarded').length
  const creditsEarned = totalRewarded * REFERRAL_REWARD_CREDITS

  return {
    referralCode: user?.referral_code ?? null,
    totalReferred,
    totalRewarded,
    creditsEarned,
    referralRewardCredits: REFERRAL_REWARD_CREDITS,
    referrals: (rewards ?? []).map(r => ({
      name:        r.users?.name ?? 'User',
      status:      r.status,
      rewardedAt:  r.rewarded_at,
    })),
  }
}
