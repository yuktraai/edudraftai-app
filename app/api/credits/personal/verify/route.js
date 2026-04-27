import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { createAndSendInvoice } from '@/lib/invoices'

// POST /api/credits/personal/verify
// Body: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
// Role: lecturer only
// Verifies HMAC signature and credits personal wallet
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

    if (profile?.role !== 'lecturer')
      return Response.json({ error: 'Forbidden — lecturer only' }, { status: 403 })

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json()

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature)
      return Response.json({ error: 'Missing payment fields' }, { status: 400 })

    // ── 1. Verify HMAC signature — NEVER skip this ────────────────────────────
    const sigBody = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sigBody)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      logger.error('[personal/verify] Signature mismatch', { order_id: razorpay_order_id })
      return Response.json({ error: 'Payment verification failed', code: 'INVALID_SIGNATURE' }, { status: 400 })
    }

    // ── 2. Idempotency — check if already paid ────────────────────────────────
    const { data: paidPurchase } = await adminSupabase
      .from('personal_credit_purchases')
      .select('id, credits_to_award, amount_paise, status')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)
      .single()

    if (paidPurchase?.status === 'paid') {
      // Webhook may have processed this — generate invoice if not yet done
      const { count: invoiceExists } = await adminSupabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('payment_id', razorpay_payment_id)

      if (!invoiceExists) {
        try {
          const { data: buyerProfile } = await adminSupabase
            .from('users').select('name, email, college_id, colleges(name)').eq('id', user.id).single()
          await createAndSendInvoice({
            userId:      user.id,
            collegeId:   buyerProfile?.college_id,
            paymentId:   razorpay_payment_id,
            credits:     paidPurchase.credits_to_award,
            amountPaise: paidPurchase.amount_paise,
            buyerName:   buyerProfile?.name ?? 'Lecturer',
            buyerEmail:  buyerProfile?.email ?? user.email,
            collegeName: buyerProfile?.colleges?.name ?? '',
            invoiceType: 'personal_purchase',
          })
        } catch (invoiceErr) {
          logger.error('[personal/verify] already_processed invoice failed', invoiceErr.message)
        }
      }

      return Response.json({
        success:           true,
        already_processed: true,
        credits_added:     paidPurchase.credits_to_award,
      })
    }

    // ── 3. Fetch the 'created' purchase ───────────────────────────────────────
    if (!paidPurchase || paidPurchase.status !== 'created')
      return Response.json({ error: 'Order not found or invalid state' }, { status: 404 })

    const purchase = paidPurchase

    // ── 4. Insert personal credit ledger entry ────────────────────────────────
    const { error: ledgerErr } = await adminSupabase
      .from('personal_credit_ledger')
      .insert({
        user_id:      user.id,
        college_id:   profile.college_id,
        amount:       purchase.credits_to_award,
        reason:       'self_purchase',
        reference_id: purchase.id,
      })

    if (ledgerErr) {
      logger.error('[personal/verify] ledger insert failed', ledgerErr)
      return Response.json({ error: 'Credits could not be applied. Contact support.' }, { status: 500 })
    }

    // ── 5. Mark purchase as paid ──────────────────────────────────────────────
    await adminSupabase
      .from('personal_credit_purchases')
      .update({ status: 'paid', razorpay_payment_id })
      .eq('id', purchase.id)

    // ── 6. Generate and send GST invoice (non-fatal) ──────────────────────────
    try {
      const { data: buyerProfile } = await adminSupabase
        .from('users').select('name, email, college_id, colleges(name)').eq('id', user.id).single()

      await createAndSendInvoice({
        userId:      user.id,
        collegeId:   buyerProfile?.college_id,
        paymentId:   razorpay_payment_id,
        credits:     purchase.credits_to_award,
        amountPaise: purchase.amount_paise,
        buyerName:   buyerProfile?.name ?? 'Lecturer',
        buyerEmail:  buyerProfile?.email ?? user.email,
        collegeName: buyerProfile?.colleges?.name ?? '',
        invoiceType: 'personal_purchase',
      })
    } catch (invoiceErr) {
      logger.error('[personal/verify] invoice generation failed', invoiceErr.message)
    }

    return Response.json({ success: true, credits_added: purchase.credits_to_award })
  } catch (err) {
    logger.error('[POST /api/credits/personal/verify]', err)
    return Response.json({ error: 'Payment verification error', code: err.message }, { status: 500 })
  }
}
