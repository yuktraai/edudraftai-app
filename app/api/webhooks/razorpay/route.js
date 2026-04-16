import crypto from 'crypto'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// POST /api/webhooks/razorpay
// Handles: payment.captured (safety net), payment.failed
// Always returns 200 — Razorpay retries on non-200
export async function POST(request) {
  let rawBody = ''
  try {
    rawBody = await request.text()

    // ── Verify webhook signature ──────────────────────────────────────────────
    const signature = request.headers.get('x-razorpay-signature') ?? ''
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET ?? '')
      .update(rawBody)
      .digest('hex')

    if (expected !== signature) {
      logger.error('[webhook] Invalid Razorpay signature')
      // Return 200 to stop retries — but log and ignore
      return Response.json({ ok: false, reason: 'invalid_signature' }, { status: 200 })
    }

    const event = JSON.parse(rawBody)
    const eventType = event.event

    // ── payment.captured — safety net if verify endpoint missed ──────────────
    if (eventType === 'payment.captured') {
      const payment  = event.payload.payment.entity
      const orderId  = payment.order_id
      const paymentId = payment.id

      // Idempotency: only process if still in 'created' state
      const { data: purchase } = await adminSupabase
        .from('credit_purchases')
        .select('id, college_id, purchased_by, credits_to_award, amount_paise, status')
        .eq('razorpay_order_id', orderId)
        .single()

      if (!purchase) {
        logger.error('[webhook] Purchase not found for order', orderId)
        return Response.json({ ok: true }) // still 200
      }

      if (purchase.status !== 'created') {
        // Already paid via verify endpoint — skip
        return Response.json({ ok: true, skipped: 'already_processed' })
      }

      // Apply credits
      const { error: rpcErr } = await adminSupabase.rpc('apply_purchase_credits', {
        p_purchase_id: purchase.id,
        p_payment_id:  paymentId,
        p_signature:   'webhook_captured', // no client signature in webhook path
      })

      if (rpcErr) {
        logger.error('[webhook] apply_purchase_credits failed', rpcErr)
        await adminSupabase.rpc('write_system_log', {
          p_college_id: purchase.college_id,
          p_user_id:    purchase.purchased_by,
          p_event_type: 'credit_error',
          p_severity:   'error',
          p_message:    `Webhook: failed to apply credits for order ${orderId}: ${rpcErr.message}`,
          p_metadata:   { order_id: orderId, payment_id: paymentId },
        }).catch(() => {})
      } else {
        await adminSupabase.rpc('write_system_log', {
          p_college_id: purchase.college_id,
          p_user_id:    purchase.purchased_by,
          p_event_type: 'admin_action',
          p_severity:   'info',
          p_message:    `Webhook: ${purchase.credits_to_award} credits applied via payment.captured`,
          p_metadata:   { order_id: orderId, payment_id: paymentId, credits: purchase.credits_to_award },
        }).catch(() => {})
      }
    }

    // ── payment.failed ────────────────────────────────────────────────────────
    if (eventType === 'payment.failed') {
      const payment = event.payload.payment.entity
      const orderId = payment.order_id

      const { data: purchase } = await adminSupabase
        .from('credit_purchases')
        .select('id, college_id, purchased_by')
        .eq('razorpay_order_id', orderId)
        .eq('status', 'created')
        .single()

      if (purchase) {
        await adminSupabase
          .from('credit_purchases')
          .update({ status: 'failed' })
          .eq('id', purchase.id)

        await adminSupabase.rpc('write_system_log', {
          p_college_id: purchase.college_id,
          p_user_id:    purchase.purchased_by,
          p_event_type: 'credit_error',
          p_severity:   'warning',
          p_message:    `Payment failed for order ${orderId}`,
          p_metadata:   { order_id: orderId, error_code: payment.error_code, error_description: payment.error_description },
        }).catch(() => {})
      }
    }

    return Response.json({ ok: true })
  } catch (err) {
    logger.error('[POST /api/webhooks/razorpay]', err)
    // Always return 200 — Razorpay must not retry due to our internal errors
    return Response.json({ ok: false, reason: err.message }, { status: 200 })
  }
}
