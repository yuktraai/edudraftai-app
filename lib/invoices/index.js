import { generateInvoiceNumber } from './numbering'
import { generateInvoiceHTML, computeInvoiceAmounts } from './generate'
import { generateInvoicePDF } from './pdf'
import { sendInvoiceEmail } from './email'
import { saveInvoiceToStorage } from './storage'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export async function createAndSendInvoice({
  userId,
  collegeId,
  paymentId,
  credits,
  amountPaise,
  buyerName,
  buyerEmail,
  collegeName,
  invoiceType = 'pool_purchase',
}) {
  try {
    const invoiceNumber = await generateInvoiceNumber()
    const { total, base, gst } = computeInvoiceAmounts(amountPaise)
    const date = new Date().toLocaleDateString('en-IN', {
      day:   '2-digit',
      month: 'long',
      year:  'numeric',
    })

    const buyer = { name: buyerName, email: buyerEmail, college: collegeName }

    // ── Generate PDF ──────────────────────────────────────────────────────────
    let pdfBuffer = null
    try {
      pdfBuffer = await generateInvoicePDF({
        invoiceNumber,
        date,
        buyer,
        credits,
        amountPaise,
        invoiceType,
      })
    } catch (pdfErr) {
      logger.error('[createAndSendInvoice] PDF generation failed', pdfErr.message)
    }

    // ── Save PDF to storage + get signed URL ──────────────────────────────────
    let storagePath = null
    let signedUrl   = null
    if (pdfBuffer) {
      const result = await saveInvoiceToStorage({ collegeId, userId, invoiceNumber, pdfBuffer })
      storagePath = result.path
      signedUrl   = result.signedUrl
    }

    // ── Insert invoice record (non-fatal) ─────────────────────────────────────
    try {
      const { error: insertErr } = await adminSupabase.from('invoices').insert({
        invoice_number: invoiceNumber,
        user_id:        userId,
        college_id:     collegeId,
        payment_id:     paymentId,
        credits,
        base_amount:    base,
        gst_amount:     gst,
        total_amount:   total,
        invoice_type:   invoiceType,
      })
      if (insertErr) logger.error('[createAndSendInvoice] invoice insert error', insertErr.message)
    } catch (insertEx) {
      logger.error('[createAndSendInvoice] invoice insert exception', insertEx.message)
    }

    // ── Send email with PDF attached (non-fatal) ───────────────────────────────
    await sendInvoiceEmail({
      to:            buyerEmail,
      name:          buyerName,
      invoiceNumber,
      credits,
      totalAmount:   total,
      pdfBuffer,
      signedUrl,
    })

    return { invoiceNumber, storagePath, signedUrl }
  } catch (err) {
    logger.error('[createAndSendInvoice] failed', err.message)
    return null
  }
}
