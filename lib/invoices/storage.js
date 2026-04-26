import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// NOTE: Before using this module, create a Supabase Storage bucket named "invoices":
//   1. Go to Supabase Dashboard → Storage → New bucket
//   2. Name: invoices
//   3. Public: false (private bucket — accessed only via service role)
//   4. Add RLS policy: allow service role full access

export async function saveInvoiceToStorage({ collegeId, userId, invoiceNumber, html }) {
  try {
    const path   = `${collegeId}/${userId}/${invoiceNumber}.html`
    const buffer = Buffer.from(html, 'utf-8')
    const { error } = await adminSupabase.storage
      .from('invoices')
      .upload(path, buffer, { contentType: 'text/html', upsert: true })
    if (error) logger.error('[saveInvoice] storage upload failed', error.message)
    return path
  } catch (err) {
    logger.error('[saveInvoice] exception', err.message)
    return null
  }
}
