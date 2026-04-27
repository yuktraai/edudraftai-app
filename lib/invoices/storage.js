import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

/**
 * Save invoice PDF to Supabase Storage and return a signed URL valid for 1 year.
 * Falls back gracefully — never throws.
 */
export async function saveInvoiceToStorage({ collegeId, userId, invoiceNumber, pdfBuffer }) {
  try {
    const path = `${collegeId}/${userId}/${invoiceNumber}.pdf`

    const { error: uploadErr } = await adminSupabase.storage
      .from('invoices')
      .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (uploadErr) {
      logger.error('[saveInvoice] upload failed', uploadErr.message)
      return { path: null, signedUrl: null }
    }

    // Generate a signed URL valid for 1 year (31536000 seconds)
    const { data: signed, error: signErr } = await adminSupabase.storage
      .from('invoices')
      .createSignedUrl(path, 31536000)

    if (signErr) {
      logger.error('[saveInvoice] signed URL failed', signErr.message)
      return { path, signedUrl: null }
    }

    return { path, signedUrl: signed.signedUrl }
  } catch (err) {
    logger.error('[saveInvoice] exception', err.message)
    return { path: null, signedUrl: null }
  }
}
