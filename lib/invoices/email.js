import { Resend } from 'resend'
import { logger } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvoiceEmail({ to, name, invoiceNumber, invoiceHtml, credits, totalAmount }) {
  try {
    await resend.emails.send({
      from:    `EduDraftAI <${process.env.RESEND_FROM_EMAIL}>`,
      to,
      subject: `Invoice ${invoiceNumber} — EduDraftAI Credit Purchase`,
      html: `
        <!DOCTYPE html><html><body style="margin:0;padding:40px 16px;background:#F4F7F6;font-family:Arial,sans-serif">
        <table width="600" style="margin:0 auto;background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden">
          <tr><td style="background:#0D1F3C;padding:24px 32px">
            <span style="font-size:20px;font-weight:800;color:#fff">EduDraftAI</span>
            <span style="font-size:12px;color:#94a3b8;margin-left:8px">by Yuktra AI</span>
          </td></tr>
          <tr><td style="padding:24px 32px">
            <h2 style="margin:0 0 8px;color:#0D1F3C">Hi ${name},</h2>
            <p style="margin:0 0 20px;color:#718096">Thank you for your purchase! Here is your GST invoice for ${credits} EduDraftAI credits.</p>
            <p style="margin:0 0 4px;color:#1A202C"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
            <p style="margin:0 0 4px;color:#1A202C"><strong>Amount Paid:</strong> ₹${totalAmount.toLocaleString('en-IN')}</p>
            <p style="margin:0 0 4px;color:#1A202C"><strong>Credits Added:</strong> ${credits}</p>
          </td></tr>
          <tr><td style="padding:0 32px 24px">
            <div style="background:#F4F7F6;border:1px solid #E2E8F0;border-radius:12px;padding:24px">
              ${invoiceHtml}
            </div>
          </td></tr>
          <tr><td style="padding:16px 32px;border-top:1px solid #E2E8F0;background:#f8fafc">
            <p style="margin:0;font-size:12px;color:#a0aec0;text-align:center">edudraftai.com · info@yuktraai.com</p>
          </td></tr>
        </table>
        </body></html>
      `,
    })
  } catch (err) {
    logger.error('[sendInvoiceEmail] failed', err.message)
  }
}
