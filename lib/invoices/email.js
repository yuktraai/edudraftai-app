import { Resend } from 'resend'
import { logger } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvoiceEmail({
  to,
  name,
  invoiceNumber,
  credits,
  totalAmount,
  pdfBuffer,
  signedUrl,
}) {
  try {
    const downloadSection = signedUrl
      ? `
        <tr><td style="padding:0 32px 24px;text-align:center;">
          <a href="${signedUrl}"
             style="display:inline-block;background:#00B4A6;color:#ffffff;font-size:14px;font-weight:700;
                    text-decoration:none;padding:12px 32px;border-radius:8px;">
            Download Invoice (PDF)
          </a>
          <p style="margin:10px 0 0;font-size:12px;color:#a0aec0;">
            Link valid for 1 year &nbsp;·&nbsp; Invoice also attached to this email
          </p>
        </td></tr>`
      : ''

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:40px 16px;background:#F4F7F6;font-family:Arial,sans-serif">
      <table width="600" style="margin:0 auto;background:#fff;border-radius:16px;border:1px solid #E2E8F0;overflow:hidden;max-width:600px;width:100%">
        <tr><td style="background:#0D1F3C;padding:24px 32px">
          <span style="font-size:20px;font-weight:800;color:#fff">EduDraft<span style="color:#00B4A6">AI</span></span>
          <span style="font-size:12px;color:#94a3b8;margin-left:8px">by Yuktra AI</span>
        </td></tr>
        <tr><td style="padding:28px 32px 20px">
          <h2 style="margin:0 0 8px;color:#0D1F3C;font-size:20px">Hi ${name},</h2>
          <p style="margin:0 0 20px;color:#718096;font-size:14px;line-height:1.6">
            Thank you for your purchase! Your GST invoice for
            <strong style="color:#0D1F3C">${credits} EduDraftAI credits</strong> is ready.
          </p>
          <table style="background:#F4F7F6;border-radius:10px;padding:16px 20px;margin-bottom:20px;width:100%;box-sizing:border-box">
            <tr>
              <td style="font-size:13px;color:#718096;padding:3px 0">Invoice Number</td>
              <td style="font-size:13px;font-weight:700;color:#0D1F3C;text-align:right">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#718096;padding:3px 0">Amount Paid</td>
              <td style="font-size:13px;font-weight:700;color:#0D1F3C;text-align:right">Rs.${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#718096;padding:3px 0">Credits Added</td>
              <td style="font-size:13px;font-weight:700;color:#00B4A6;text-align:right">${credits} credits</td>
            </tr>
          </table>
          <p style="margin:0;font-size:13px;color:#718096;line-height:1.6">
            The invoice PDF is <strong>attached to this email</strong>.
            ${signedUrl ? 'You can also download it using the button below.' : ''}
          </p>
        </td></tr>
        ${downloadSection}
        <tr><td style="padding:16px 32px;border-top:1px solid #E2E8F0;background:#f8fafc">
          <p style="margin:0;font-size:12px;color:#a0aec0;text-align:center">
            edudraftai.com &nbsp;·&nbsp; info@yuktraai.com
          </p>
        </td></tr>
      </table>
    </body></html>`

    // Build attachments array — include PDF if buffer available
    const attachments = pdfBuffer
      ? [{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer.toString('base64') }]
      : []

    await resend.emails.send({
      from:        `EduDraftAI <${process.env.RESEND_FROM_EMAIL}>`,
      to,
      subject:     `Invoice ${invoiceNumber} — EduDraftAI Credit Purchase`,
      html,
      attachments,
    })
  } catch (err) {
    logger.error('[sendInvoiceEmail] failed', err.message)
  }
}
