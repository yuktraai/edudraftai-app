/**
 * Waitlist confirmation email template.
 * Returns { subject, html } ready for Resend.
 */
export function waitlistConfirmationEmail({ name, email }) {
  const displayName = name?.trim() || 'there'

  const subject = "You're on the EduDraftAI waitlist!"

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:'Inter',Arial,sans-serif;color:#1A202C;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">

          <!-- Header -->
          <tr>
            <td style="background:#0D1F3C;padding:32px 40px;">
              <p style="margin:0;font-size:22px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">
                EduDraft<span style="color:#00B4A6;">AI</span>
              </p>
              <p style="margin:4px 0 0;font-size:12px;color:#94A3B8;">by Yuktra AI</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0D1F3C;">
                You're on the list, ${displayName}! 🎉
              </h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A5568;">
                Thank you for joining the EduDraftAI waitlist. We're building the first AI-powered
                content generation platform purpose-built for SCTE & VT Odisha diploma colleges.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4A5568;">
                When we launch on <strong>July 7, 2026</strong>, you'll be among the first to
                get access. We'll send you an exclusive early-access invite directly to
                <strong>${email}</strong>.
              </p>

              <!-- Feature highlights -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                ${[
                  ['📝', 'Lesson Notes', 'Syllabus-locked, curriculum-aligned lesson plans in seconds.'],
                  ['✅', 'MCQ Banks', 'Auto-generate exam-ready multiple choice question banks.'],
                  ['📋', 'Question Banks', 'SCTE & VT-pattern 2/5/10 mark question sets.'],
                  ['🗓️', 'Test Plans', 'Structured internal test schedules with topic weightage.'],
                ].map(([icon, title, desc]) => `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #E2E8F0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:20px;padding-right:12px;vertical-align:top;">${icon}</td>
                        <td>
                          <p style="margin:0;font-weight:600;font-size:14px;color:#0D1F3C;">${title}</p>
                          <p style="margin:4px 0 0;font-size:13px;color:#718096;">${desc}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`).join('')}
              </table>

              <p style="margin:0;font-size:14px;color:#718096;">
                Questions? Reply to this email or write to us at
                <a href="mailto:info@yuktraai.com" style="color:#00B4A6;text-decoration:none;">info@yuktraai.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F4F7F6;padding:20px 40px;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;color:#718096;text-align:center;">
                © 2026 Yuktra AI · edudraftai.com<br />
                You're receiving this because you signed up at edudraftai.com.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  return { subject, html }
}
