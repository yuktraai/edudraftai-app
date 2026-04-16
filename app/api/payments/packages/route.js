import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/payments/packages — returns active credit packages
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role').eq('id', user.id).single()

    if (profile?.role !== 'college_admin')
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await adminSupabase
      .from('credit_packages')
      .select('id, name, credits, price_paise, sort_order')
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error
    return Response.json({ data: data ?? [] })
  } catch (err) {
    logger.error('[GET /api/payments/packages]', err)
    return Response.json({ error: 'Failed to fetch packages', code: err.message }, { status: 500 })
  }
}
