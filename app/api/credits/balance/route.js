import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: balance, error } = await adminSupabase
      .rpc('get_credit_balance', { p_user_id: user.id })

    if (error) throw error
    return Response.json({ balance: balance ?? 0 })
  } catch (err) {
    logger.error('[GET /api/credits/balance]', err)
    return Response.json({ error: 'Failed to fetch balance', balance: 0 }, { status: 500 })
  }
}
