import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/credits/pool
// Returns college pool balance + per-user balances for college_admin
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('role, college_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['college_admin', 'super_admin'].includes(profile.role))
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    // Pool balance
    const { data: poolBalance, error: poolError } = await adminSupabase
      .rpc('get_college_pool_balance', { p_college_id: profile.college_id })

    if (poolError) throw poolError

    // All users in college (excluding super_admin)
    const { data: users, error: usersError } = await adminSupabase
      .from('users')
      .select('id, name, email, role, is_active')
      .eq('college_id', profile.college_id)
      .neq('role', 'super_admin')
      .eq('is_active', true)
      .order('name')

    if (usersError) throw usersError

    // Get balance for each user via RPC (run in parallel)
    const balances = await Promise.all(
      (users ?? []).map(async (u) => {
        const { data: bal } = await adminSupabase
          .rpc('get_credit_balance', { p_user_id: u.id })
        return { ...u, balance: bal ?? 0 }
      })
    )

    return Response.json({ pool_balance: poolBalance ?? 0, users: balances })
  } catch (err) {
    logger.error('[GET /api/credits/pool]', err)
    return Response.json({ error: 'Failed to fetch credit data', code: err.message }, { status: 500 })
  }
}
