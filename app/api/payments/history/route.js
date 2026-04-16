import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/payments/history
// Returns credit_purchases for the current admin's college
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role, college_id').eq('id', user.id).single()

    if (!['college_admin', 'super_admin'].includes(profile?.role))
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await adminSupabase
      .from('credit_purchases')
      .select(`
        id, credits_to_award, amount_paise, currency, status,
        razorpay_order_id, razorpay_payment_id, applied_at, created_at,
        credit_packages ( name, credits )
      `)
      .eq('college_id', profile.college_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return Response.json({ data: data ?? [] })
  } catch (err) {
    logger.error('[GET /api/payments/history]', err)
    return Response.json({ error: 'Failed to fetch history', code: err.message }, { status: 500 })
  }
}
