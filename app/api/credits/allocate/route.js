import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { createNotification } from '@/lib/notifications/create'

// POST /api/credits/allocate
// Body: { target_user_id, amount }
// College admin allocates credits from the college pool to a lecturer
export async function POST(request) {
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

    const body = await request.json()
    const { target_user_id, amount } = body

    if (!target_user_id || !amount || typeof amount !== 'number' || amount <= 0)
      return Response.json({ error: 'target_user_id and a positive amount are required' }, { status: 400 })

    // Ensure target user belongs to same college
    const { data: targetUser } = await adminSupabase
      .from('users')
      .select('id, name, college_id')
      .eq('id', target_user_id)
      .eq('college_id', profile.college_id)
      .single()

    if (!targetUser)
      return Response.json({ error: 'Target user not found in your college' }, { status: 404 })

    // Grant from pool (atomic RPC — checks pool balance)
    const { data, error } = await adminSupabase
      .rpc('grant_from_pool', {
        p_college_id:     profile.college_id,
        p_target_user_id: target_user_id,
        p_amount:         amount,
        p_granted_by:     user.id,
      })

    if (error) {
      if (error.message?.includes('insufficient_pool_credits'))
        return Response.json({ error: 'Not enough credits in your college pool' }, { status: 402 })
      throw error
    }

    // Notify lecturer of credit allocation
    try {
      const { data: targetProfile } = await adminSupabase
        .from('users').select('name, preferences').eq('id', target_user_id).single()
      await createNotification({
        userId:    target_user_id,
        collegeId: profile.college_id,
        type:      'credit_allocated',
        title:     `${amount} credits added`,
        message:   `${amount} credit${amount !== 1 ? 's' : ''} have been added to your account by your college admin.`,
        actionUrl: '/dashboard',
      })
    } catch (notifErr) {
      logger.error('[credits/allocate] Notification failed', notifErr.message)
    }

    return Response.json({ success: true, ledger_id: data })
  } catch (err) {
    logger.error('[POST /api/credits/allocate]', err)
    return Response.json({ error: 'Failed to allocate credits', code: err.message }, { status: 500 })
  }
}
