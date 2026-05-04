import { Resend } from 'resend'
import { logger } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = `EduDraftAI <${process.env.RESEND_FROM_EMAIL}>`

function baseHtml({ preheader, bodyContent, ctaText, ctaUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EduDraftAI</title>
</head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:'Inter',Arial,sans-serif;">
  <!-- Preheader (hidden preview text) -->
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0D1F3C;border-radius:12px 12px 0 0;padding:28px 36px;">
              <span style="font-size:20px;font-weight:800;color:#00B4A6;letter-spacing:-0.5px;">EduDraftAI</span>
              <span style="font-size:12px;color:#718096;margin-left:8px;">by Yuktra AI</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#FFFFFF;padding:36px 36px 24px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;">
              ${bodyContent}
            </td>
          </tr>

          <!-- CTA (optional) -->
          ${ctaText && ctaUrl ? `
          <tr>
            <td style="background:#FFFFFF;padding:0 36px 36px;border-left:1px solid #E2E8F0;border-right:1px solid #E2E8F0;text-align:center;">
              <a href="${ctaUrl}" style="display:inline-block;background:#00B4A6;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:8px;">
                ${ctaText}
              </a>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="background:#F4F7F6;border-radius:0 0 12px 12px;padding:20px 36px;text-align:center;border:1px solid #E2E8F0;border-top:none;">
              <p style="margin:0;font-size:12px;color:#718096;">
                EduDraftAI &mdash; SCTE & VT Odisha Diploma Colleges &bull; <a href="https://edudraftai.com" style="color:#00B4A6;text-decoration:none;">edudraftai.com</a>
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#A0AEC0;">
                You are receiving this because you have an account on EduDraftAI.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Send a "Credits added" email when admin allocates credits.
 * @param {{ to: string, name: string, amount: number }} opts
 */
export async function sendCreditAllocatedEmail({ to, name, amount }) {
  try {
    const bodyContent = `
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1A202C;">Credits added to your account</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#4A5568;line-height:1.6;">
        Hi ${name},
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:#4A5568;line-height:1.6;">
        Your college admin has added <strong style="color:#00B4A6;">${amount} credit${amount !== 1 ? 's' : ''}</strong> to your EduDraftAI account. You can now generate lesson notes, MCQ banks, question banks, and more.
      </p>
    `
    await resend.emails.send({
      from:    FROM,
      to,
      subject: 'Credits added to your account',
      html:    baseHtml({
        preheader: `${amount} credit${amount !== 1 ? 's' : ''} have been added to your EduDraftAI account.`,
        bodyContent,
        ctaText:   'Start Generating',
        ctaUrl:    `${process.env.NEXT_PUBLIC_APP_URL}/generate`,
      }),
    })
  } catch (err) {
    logger.error('[email] sendCreditAllocatedEmail failed', err.message)
  }
}

/**
 * Send a "Low credit balance" warning email.
 * @param {{ to: string, name: string, balance: number }} opts
 */
export async function sendCreditLowEmail({ to, name, balance }) {
  try {
    const bodyContent = `
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1A202C;">You're running low on credits</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#4A5568;line-height:1.6;">
        Hi ${name},
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:#4A5568;line-height:1.6;">
        You only have <strong style="color:#DD6B20;">${balance} credit${balance !== 1 ? 's' : ''}</strong> remaining on EduDraftAI. Please contact your college admin to top up your balance before your credits run out.
      </p>
    `
    await resend.emails.send({
      from:    FROM,
      to,
      subject: "You're running low on credits",
      html:    baseHtml({
        preheader: `Only ${balance} credit${balance !== 1 ? 's' : ''} remaining — ask your admin to top up.`,
        bodyContent,
        ctaText:   'View Dashboard',
        ctaUrl:    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      }),
    })
  } catch (err) {
    logger.error('[email] sendCreditLowEmail failed', err.message)
  }
}

/**
 * Send a "Generation failed" notification email.
 * @param {{ to: string, name: string }} opts
 */
export async function sendGenerationFailedEmail({ to, name }) {
  try {
    const bodyContent = `
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1A202C;">Your content generation failed</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#4A5568;line-height:1.6;">
        Hi ${name},
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:#4A5568;line-height:1.6;">
        Unfortunately your recent content generation on EduDraftAI could not be completed. <strong>No credits have been deducted</strong> from your account. Please try again &mdash; if the problem persists, contact support at <a href="mailto:info@yuktraai.com" style="color:#00B4A6;">info@yuktraai.com</a>.
      </p>
    `
    await resend.emails.send({
      from:    FROM,
      to,
      subject: 'Your content generation failed',
      html:    baseHtml({
        preheader: 'Your content generation could not be completed. No credits were deducted.',
        bodyContent,
        ctaText:   'Try Again',
        ctaUrl:    `${process.env.NEXT_PUBLIC_APP_URL}/generate`,
      }),
    })
  } catch (err) {
    logger.error('[email] sendGenerationFailedEmail failed', err.message)
  }
}
