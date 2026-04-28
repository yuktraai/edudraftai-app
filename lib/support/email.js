import { Resend } from 'resend'
import { logger } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = `EduDraftAI Support <${process.env.RESEND_FROM_EMAIL}>`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://edudraftai.com'

const CATEGORY_LABELS = {
  bug:             'Bug Report',
  content_quality: 'Content Quality',
  billing:         'Billing',
  feature_request: 'Feature Request',
  access:          'Access / Login',
  other:           'Other',
}

const PRIORITY_LABELS = {
  low:      'Low',
  medium:   'Medium',
  high:     'High',
  critical: 'Critical',
}

const PRIORITY_COLORS = {
  low:      '#718096',
  medium:   '#DD6B20',
  high:     '#E53E3E',
  critical: '#742A2A',
}

function baseHtml(bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <tr>
          <td style="background:#0D1F3C;border-radius:12px 12px 0 0;padding:24px 32px;">
            <span style="font-size:18px;font-weight:800;color:#00B4A6;">EduDraftAI</span>
            <span style="font-size:11px;color:#718096;margin-left:8px;">by Yuktra AI</span>
          </td>
        </tr>
        <tr>
          <td style="background:#fff;padding:32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
            ${bodyContent}
          </td>
        </tr>
        <tr>
          <td style="background:#F4F7F6;border-radius:0 0 12px 12px;padding:16px 32px;border:1px solid #E2E8F0;border-top:none;text-align:center;">
            <p style="margin:0;font-size:12px;color:#718096;">
              EduDraftAI &mdash; <a href="https://edudraftai.com" style="color:#00B4A6;text-decoration:none;">edudraftai.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

/**
 * Email to info@yuktraai.com when a new ticket is created.
 */
export async function sendTicketCreatedEmail({ ticketNumber, subject, description, category, priority, userName, userEmail, userRole, collegeName, createdAt }) {
  try {
    const priorityColor = PRIORITY_COLORS[priority] ?? '#718096'
    const body = `
      <h2 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#1A202C;">New Support Ticket</h2>
      <p style="margin:0 0 20px;font-size:13px;color:#718096;">${ticketNumber}</p>

      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:8px 12px;background:#F4F7F6;border:1px solid #E2E8F0;font-size:12px;color:#718096;font-weight:600;width:130px;">Raised by</td>
          <td style="padding:8px 12px;border:1px solid #E2E8F0;font-size:13px;color:#1A202C;">${userName} (${userEmail}) &mdash; ${userRole} at ${collegeName}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#F4F7F6;border:1px solid #E2E8F0;font-size:12px;color:#718096;font-weight:600;">Category</td>
          <td style="padding:8px 12px;border:1px solid #E2E8F0;font-size:13px;color:#1A202C;">${CATEGORY_LABELS[category] ?? category}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#F4F7F6;border:1px solid #E2E8F0;font-size:12px;color:#718096;font-weight:600;">Priority</td>
          <td style="padding:8px 12px;border:1px solid #E2E8F0;font-size:13px;font-weight:700;color:${priorityColor};">${PRIORITY_LABELS[priority] ?? priority}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#F4F7F6;border:1px solid #E2E8F0;font-size:12px;color:#718096;font-weight:600;">Subject</td>
          <td style="padding:8px 12px;border:1px solid #E2E8F0;font-size:13px;color:#1A202C;font-weight:600;">${subject}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#F4F7F6;border:1px solid #E2E8F0;font-size:12px;color:#718096;font-weight:600;">Submitted</td>
          <td style="padding:8px 12px;border:1px solid #E2E8F0;font-size:13px;color:#718096;">${new Date(createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
        </tr>
      </table>

      <p style="margin:0 0 8px;font-size:12px;color:#718096;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Description</p>
      <div style="background:#F4F7F6;border:1px solid #E2E8F0;border-radius:8px;padding:16px;font-size:14px;color:#1A202C;line-height:1.6;white-space:pre-wrap;">${description}</div>

      <div style="margin-top:24px;">
        <a href="${APP_URL}/super-admin/tickets" style="display:inline-block;background:#0D1F3C;color:#fff;font-size:13px;font-weight:700;text-decoration:none;padding:10px 24px;border-radius:8px;">
          Open Ticket Dashboard →
        </a>
      </div>
    `
    await resend.emails.send({
      from:    FROM,
      to:      'info@yuktraai.com',
      subject: `[${ticketNumber}] [${PRIORITY_LABELS[priority]}] New Ticket — ${subject}`,
      html:    baseHtml(body),
    })
  } catch (err) {
    logger.error('[support email] sendTicketCreatedEmail failed', err.message)
  }
}

/**
 * Email to the ticket owner when super admin updates their ticket.
 */
export async function sendTicketUpdatedEmail({ to, userName, ticketNumber, ticketSubject, message, newStatus, ticketId }) {
  try {
    const statusLabels = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' }
    const body = `
      <h2 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#1A202C;">Your support ticket has been updated</h2>
      <p style="margin:0 0 20px;font-size:13px;color:#718096;">${ticketNumber} &mdash; ${ticketSubject}</p>

      <p style="margin:0 0 16px;font-size:15px;color:#4A5568;">Hi ${userName},</p>
      <p style="margin:0 0 16px;font-size:15px;color:#4A5568;line-height:1.6;">
        The Yuktra AI support team has responded to your ticket.
      </p>

      ${newStatus ? `<p style="margin:0 0 12px;font-size:13px;color:#718096;">Status updated to: <strong style="color:#0D1F3C;">${statusLabels[newStatus] ?? newStatus}</strong></p>` : ''}

      <div style="background:#F4F7F6;border-left:3px solid #00B4A6;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;font-size:14px;color:#1A202C;line-height:1.6;white-space:pre-wrap;">${message}</div>

      <a href="${APP_URL}/help/tickets/${ticketId}" style="display:inline-block;background:#00B4A6;color:#fff;font-size:13px;font-weight:700;text-decoration:none;padding:10px 24px;border-radius:8px;">
        View Ticket →
      </a>
    `
    await resend.emails.send({
      from:    FROM,
      to,
      subject: `[${ticketNumber}] Your ticket has been updated`,
      html:    baseHtml(body),
    })
  } catch (err) {
    logger.error('[support email] sendTicketUpdatedEmail failed', err.message)
  }
}
