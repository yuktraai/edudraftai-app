import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// POST /api/payments/verify
// Body: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
// Verifies HMAC, applies credits atomically, logs event
export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role, college_id').eq('id', user.id).single()

    if (profile?.role !== 'college_admin')
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json()

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature)
      return Response.json({ error: 'Missing payment fields' }, { status: 400 })

    // ── 1. Verify HMAC signature — NEVER skip this ────────────────────────────
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      // Log tamper attempt
      await adminSupabase.rpc('write_system_log', {
        p_college_id: profile.college_id,
        p_user_id:    user.id,
        p_event_type: 'api_error',
        p_severity:   'error',
        p_message:    'Razorpay signature verification failed — possible tampered request',
        p_metadata:   { order_id: razorpay_order_id },
      }).catch(() => {})

      return Response.json({ error: 'Payment verification failed', code: 'INVALID_SIGNATURE' }, { status: 400 })
    }

    // ── 2. Fetch purchase (idempotency: must be 'created', not already 'paid') ─
    const { data: purchase } = await adminSupabase
      .from('credit_purchases')
      .select('id, college_id, purchased_by, credits_to_award, amount_paise')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('status', 'created')
      .single()

    if (!purchase) {
      // Already processed — look up the paid record to return credits_added
      const { data: paidPurchase } = await adminSupabase
        .from('credit_purchases')
        .select('credits_to_award')
        .eq('razorpay_order_id', razorpay_order_id)
        .single()

      return Response.json({
        success:           true,
        already_processed: true,
        credits_added:     paidPurchase?.credits_to_award ?? 0,
      })
    }

    // Confirm it belongs to this admin's college
    if (purchase.college_id !== profile.college_id)
      return Response.json({ error: 'Order does not belong to your college' }, { status: 403 })

    // ── 3. Apply credits atomically via RPC ───────────────────────────────────
    const { error: rpcErr } = await adminSupabase.rpc('apply_purchase_credits', {
      p_purchase_id: purchase.id,
      p_payment_id:  razorpay_payment_id,
      p_signature:   razorpay_signature,
    })

    if (rpcErr) {
      logger.error('[verify] apply_purchase_credits failed', rpcErr)
      await adminSupabase.rpc('write_system_log', {
        p_college_id: purchase.college_id,
        p_user_id:    user.id,
        p_event_type: 'credit_error',
        p_severity:   'error',
        p_message:    `Failed to apply credits after payment: ${rpcErr.message}`,
        p_metadata:   { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
      }).catch(() => {})
      return Response.json({ error: 'Credits could not be applied. Contact support.' }, { status: 500 })
    }

    // ── 4. Write success system log ───────────────────────────────────────────
    await adminSupabase.rpc('write_system_log', {
      p_college_id: purchase.college_id,
      p_user_id:    user.id,
      p_event_type: 'admin_action',
      p_severity:   'info',
      p_message:    `Credit purchase confirmed: ${purchase.credits_to_award} credits added to pool`,
      p_metadata: {
        order_id:     razorpay_order_id,
        payment_id:   razorpay_payment_id,
        credits:      purchase.credits_to_award,
        amount_paise: purchase.amount_paise,
      },
    }).catch(() => {})

    return Response.json({ success: true, credits_added: purchase.credits_to_award })
  } catch (err) {
    logger.error('[POST /api/payments/verify]', err)
    return Response.json({ error: 'Payment verification error', code: err.message }, { status: 500 })
  }
}
