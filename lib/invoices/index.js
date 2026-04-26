import { generateInvoiceNumber } from './numbering'
import { generateInvoiceHTML, computeInvoiceAmounts } from './generate'
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

    const html = generateInvoiceHTML({
      invoiceNumber,
      date,
      buyer:       { name: buyerName, email: buyerEmail, college: collegeName },
      credits,
      amountPaise,
      invoiceType,
    })

    // Save to storage (non-fatal)
    const storagePath = await saveInvoiceToStorage({ collegeId, userId, invoiceNumber, html })

    // Insert invoice record
    await adminSupabase.from('invoices').insert({
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

    // Send email (non-fatal)
    await sendInvoiceEmail({
      to:           buyerEmail,
      name:         buyerName,
      invoiceNumber,
      invoiceHtml:  html,
      credits,
      totalAmount:  total,
    })

    return { invoiceNumber, storagePath }
  } catch (err) {
    logger.error('[createAndSendInvoice] failed', err.message)
    return null
  }
}
