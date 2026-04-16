import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/credits/ledger?user_id=xxx
// Returns credit_ledger rows for a specific user (college_admin scoped to own college)
export async function GET(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role, college_id').eq('id', user.id).single()

    if (!['college_admin', 'super_admin'].includes(profile?.role))
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('user_id')
    if (!targetUserId) return Response.json({ error: 'user_id required' }, { status: 400 })

    // Verify target user belongs to same college
    const { data: targetUser } = await adminSupabase
      .from('users').select('id').eq('id', targetUserId).eq('college_id', profile.college_id).single()
    if (!targetUser) return Response.json({ error: 'User not found' }, { status: 404 })

    const { data, error } = await adminSupabase
      .from('credit_ledger')
      .select('id, amount, reason, notes, created_at, users!credit_ledger_created_by_fkey(name)')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return Response.json({ data: data ?? [] })
  } catch (err) {
    logger.error('[GET /api/credits/ledger]', err)
    return Response.json({ error: 'Failed to fetch ledger', code: err.message }, { status: 500 })
  }
}
