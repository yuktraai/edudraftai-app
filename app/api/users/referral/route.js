import { createClient } from '@/lib/supabase/server'
import { ensureReferralCode, getReferralStats } from '@/lib/referral'
import { logger } from '@/lib/logger'

// GET /api/users/referral — fetch current user's referral code + stats
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    // Ensure user has a referral code
    const code = await ensureReferralCode(user.id)
    const stats = await getReferralStats(user.id)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://edudraftai.com'
    const referralLink = `${appUrl}/login?ref=${code}`

    return Response.json({ ...stats, referralLink })
  } catch (err) {
    logger.error('[GET /api/users/referral]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
