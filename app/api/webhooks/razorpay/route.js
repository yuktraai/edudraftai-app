import crypto from 'crypto'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { createAndSendInvoice } from '@/lib/invoices'

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

      // ── Check college pool purchase first ──────────────────────────────────
      const { data: purchase } = await adminSupabase
        .from('credit_purchases')
        .select('id, college_id, purchased_by, credits_to_award, amount_paise, status')
        .eq('razorpay_order_id', orderId)
        .single()

      // ── Then check personal purchase ────────────────────────────────────────
      const { data: personalPurchase } = !purchase ? await adminSupabase
        .from('personal_credit_purchases')
        .select('id, user_id, college_id, credits_to_award, amount_paise, status')
        .eq('razorpay_order_id', orderId)
        .single() : { data: null }

      // ── Handle personal purchase (safety net) ───────────────────────────────
      if (personalPurchase) {
        if (personalPurchase.status === 'paid') {
          return Response.json({ ok: true, skipped: 'personal_already_processed' })
        }
        // Apply personal credits as safety net
        const { error: ledgerErr } = await adminSupabase
          .from('personal_credit_ledger')
          .insert({
            user_id:      personalPurchase.user_id,
            college_id:   personalPurchase.college_id,
            amount:       personalPurchase.credits_to_award,
            reason:       'self_purchase',
            reference_id: personalPurchase.id,
          })
        if (!ledgerErr) {
          await adminSupabase
            .from('personal_credit_purchases')
            .update({ status: 'paid', razorpay_payment_id: paymentId })
            .eq('id', personalPurchase.id)
          // Generate invoice
          try {
            const { data: buyer } = await adminSupabase
              .from('users').select('name, email, colleges(name)').eq('id', personalPurchase.user_id).single()
            await createAndSendInvoice({
              userId:      personalPurchase.user_id,
              collegeId:   personalPurchase.college_id,
              paymentId,
              credits:     personalPurchase.credits_to_award,
              amountPaise: personalPurchase.amount_paise,
              buyerName:   buyer?.name ?? 'Lecturer',
              buyerEmail:  buyer?.email ?? '',
              collegeName: buyer?.colleges?.name ?? '',
              invoiceType: 'personal_purchase',
            })
          } catch (invoiceErr) {
            logger.error('[webhook] personal invoice failed', invoiceErr.message)
          }
        } else {
          logger.error('[webhook] personal ledger insert failed', ledgerErr.message)
        }
        return Response.json({ ok: true })
      }

      // ── Handle college pool purchase ────────────────────────────────────────
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

      // Check pool purchase
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

      // Check personal purchase
      const { data: personalPurchase } = await adminSupabase
        .from('personal_credit_purchases')
        .select('id')
        .eq('razorpay_order_id', orderId)
        .eq('status', 'created')
        .single()

      if (personalPurchase) {
        await adminSupabase
          .from('personal_credit_purchases')
          .update({ status: 'failed' })
          .eq('id', personalPurchase.id)
      }
    }

    return Response.json({ ok: true })
  } catch (err) {
    logger.error('[POST /api/webhooks/razorpay]', err)
    // Always return 200 — Razorpay must not retry due to our internal errors
    return Response.json({ ok: false, reason: err.message }, { status: 200 })
  }
}
