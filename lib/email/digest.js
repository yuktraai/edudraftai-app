import { Resend } from 'resend'
import { logger } from '@/lib/logger'

const resend   = new Resend(process.env.RESEND_API_KEY)
const FROM     = `EduDraftAI <${process.env.RESEND_FROM_EMAIL}>`
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://edudraftai.com'

function weekLabel() {
  const d = new Date()
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

/**
 * Send the weekly digest email to a college admin.
 * @param {{ to, name, collegeName, stats }} opts
 * stats: { totalGenerations, activeLecturers, totalLecturers, creditsUsed,
 *          creditsRemaining, topDept, topDeptCount, zeroBalanceLecturers[] }
 */
export async function sendDigestEmail({ to, name, collegeName, stats }) {
  try {
    const {
      totalGenerations = 0,
      activeLecturers  = 0,
      totalLecturers   = 0,
      creditsUsed      = 0,
      creditsRemaining = 0,
      topDept          = null,
      topDeptCount     = 0,
      zeroBalanceLecturers = [],
    } = stats

    const zeroAlert = zeroBalanceLecturers.length > 0
      ? `<tr>
          <td colspan="2" style="padding:0 0 16px;">
            <div style="background:#FFF5F5;border:1px solid #FED7D7;border-radius:8px;padding:14px 16px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#C53030;">⚠️ Lecturers at zero credits</p>
              <p style="margin:0;font-size:13px;color:#742A2A;">${zeroBalanceLecturers.join(', ')}</p>
            </div>
          </td>
        </tr>`
      : ''

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:'Inter',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F6;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:#0D1F3C;border-radius:12px 12px 0 0;padding:24px 32px;">
          <span style="font-size:18px;font-weight:800;color:#00B4A6;">EduDraftAI</span>
          <span style="font-size:11px;color:#718096;margin-left:8px;">by Yuktra AI</span>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:#fff;padding:32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
          <h2 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#1A202C;">Weekly Activity Report</h2>
          <p style="margin:0 0 20px;font-size:13px;color:#718096;">${collegeName} &mdash; Week of ${weekLabel()}</p>

          <p style="margin:0 0 20px;font-size:14px;color:#4A5568;line-height:1.6;">Hi ${name}, here's how your college performed on EduDraftAI this week.</p>

          <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr>
              <td style="padding:10px 14px;background:#F4F7F6;border:1px solid #E2E8F0;font-size:12px;color:#718096;font-weight:600;width:55%;">Total Generations</td>
              <td style="padding:10px 14px;border:1px solid #E2E8F0;font-size:15px;font-weight:700;color:#0D1F3C;">${totalGenerations}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;background:#F4F7F6;border:1px solid #E2E8F0;font-size:12px;color:#718096;font-weight:600;">Active Lecturers</td>
              <td style="padding:10px 14px;border:1px solid #E2E8F0;font-size:15px;font-weight:700;color:#0D1F3C;">${activeLecturers} / ${totalLecturers}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;background:#F4F7F6;border:1px solid #E2E8F0;font-size:12px;color:#718096;font-weight:600;">Credits Used This Week</td>
              <td style="padding:10px 14px;border:1px solid #E2E8F0;font-size:15px;font-weight:700;color:#0D1F3C;">${creditsUsed}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;background:#F4F7F6;border:1px solid #E2E8F0;font-size:12px;color:#718096;font-weight:600;">Credits Remaining</td>
              <td style="padding:10px 14px;border:1px solid #E2E8F0;font-size:15px;font-weight:700;color:${creditsRemaining <= 20 ? '#E53E3E' : '#00B4A6'};">${creditsRemaining}</td>
            </tr>
            ${topDept ? `<tr>
              <td style="padding:10px 14px;background:#F4F7F6;border:1px solid #E2E8F0;font-size:12px;color:#718096;font-weight:600;">Top Department</td>
              <td style="padding:10px 14px;border:1px solid #E2E8F0;font-size:13px;color:#0D1F3C;">${topDept} <span style="color:#718096;">(${topDeptCount} generations)</span></td>
            </tr>` : ''}
            ${zeroAlert}
          </table>

          <p style="margin:0;font-size:13px;color:#718096;">No action needed &mdash; just keeping you informed.</p>
        </td>
      </tr>

      <!-- CTAs -->
      <tr>
        <td style="background:#fff;padding:0 32px 32px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;">
                <a href="${APP_URL}/admin/credits/buy" style="display:inline-block;background:#00B4A6;color:#fff;font-size:13px;font-weight:700;text-decoration:none;padding:10px 20px;border-radius:8px;">
                  Top Up Credits →
                </a>
              </td>
              <td>
                <a href="${APP_URL}/admin/dashboard" style="display:inline-block;background:#F4F7F6;color:#0D1F3C;font-size:13px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:8px;border:1px solid #E2E8F0;">
                  View Analytics →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#F4F7F6;border-radius:0 0 12px 12px;padding:16px 32px;border:1px solid #E2E8F0;border-top:none;text-align:center;">
          <p style="margin:0;font-size:12px;color:#718096;">
            EduDraftAI &mdash; <a href="https://edudraftai.com" style="color:#00B4A6;text-decoration:none;">edudraftai.com</a>
          </p>
          <p style="margin:4px 0 0;font-size:11px;color:#A0AEC0;">
            You receive this weekly because you are a college admin on EduDraftAI.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body></html>`

    await resend.emails.send({
      from:    FROM,
      to,
      subject: `EduDraftAI Weekly Report — ${collegeName} — Week of ${weekLabel()}`,
      html,
    })
  } catch (err) {
    logger.error('[digest] sendDigestEmail failed', err.message)
  }
}
