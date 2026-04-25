import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const schema = z.object({
  is_active: z.boolean().optional(),
  role:      z.enum(['lecturer', 'college_admin']).optional(),
})

export async function PATCH(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminProfile } = await supabase
      .from('users').select('role, college_id').eq('id', user.id).single()

    if (!['college_admin', 'super_admin'].includes(adminProfile?.role))
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    // Verify target user belongs to same college — defence in depth
    const { data: targetUser } = await adminSupabase
      .from('users').select('college_id, role').eq('id', params.id).single()

    if (!targetUser)
      return Response.json({ error: 'User not found' }, { status: 404 })

    if (
      adminProfile.role !== 'super_admin' &&
      targetUser.college_id !== adminProfile.college_id
    ) return Response.json({ error: 'Forbidden' }, { status: 403 })

    // Cannot deactivate another super_admin
    if (targetUser.role === 'super_admin')
      return Response.json({ error: 'Cannot modify a super admin' }, { status: 403 })

    const { error } = await adminSupabase
      .from('users').update(parsed.data).eq('id', params.id)

    if (error) throw error

    // ── Auto-reclaim credits when deactivating a user ─────────────────────────
    // If we're setting is_active = false, reclaim any remaining credits to the pool
    if (parsed.data.is_active === false) {
      try {
        const { data: balance } = await adminSupabase
          .rpc('get_credit_balance', { p_user_id: params.id })

        const remaining = balance ?? 0

        if (remaining > 0) {
          const collegeId = targetUser.college_id

          // Deduct from user ledger
          const { error: ledgerErr } = await adminSupabase
            .from('credit_ledger')
            .insert({
              user_id:    params.id,
              college_id: collegeId,
              amount:     -remaining,
              reason:     'admin_grant',
              created_by: user.id,
            })

          if (ledgerErr) {
            logger.error('[PATCH /api/admin/users/[id]] Credit reclaim ledger error', ledgerErr.message)
          } else {
            // Restore to college pool
            await adminSupabase
              .from('college_credit_pool')
              .insert({
                college_id: collegeId,
                amount:     remaining,
                reason:     'refund',
                created_by: user.id,
              })

            logger.info('[PATCH /api/admin/users/[id]] Auto-reclaimed credits on deactivation', {
              user_id: params.id, amount: remaining,
            })
          }
        }
      } catch (reclaimErr) {
        // Non-fatal — user is deactivated, credits reclaim is best-effort
        logger.error('[PATCH /api/admin/users/[id]] Credit reclaim failed', reclaimErr.message)
      }
    }

    return Response.json({ data: { ok: true } })
  } catch (error) {
    logger.error('[PATCH /api/admin/users/[id]]', error)
    return Response.json({ error: 'Internal server error', code: error.message }, { status: 500 })
  }
}
