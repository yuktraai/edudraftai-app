import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/credits/personal/balance
// Returns personal credit balance for the current lecturer
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'lecturer')
      return Response.json({ error: 'Forbidden — lecturer only' }, { status: 403 })

    const { data: rows, error } = await adminSupabase
      .from('personal_credit_ledger')
      .select('amount')
      .eq('user_id', user.id)

    if (error) throw error

    const personal_balance = (rows ?? []).reduce((s, r) => s + r.amount, 0)
    return Response.json({ personal_balance })
  } catch (err) {
    logger.error('[GET /api/credits/personal/balance]', err)
    return Response.json({ error: 'Failed to fetch personal balance', personal_balance: 0 }, { status: 500 })
  }
}
