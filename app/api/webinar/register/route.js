import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const schema = z.object({
  webinarId: z.string().uuid(),
  name:      z.string().min(2),
  email:     z.string().email(),
  role:      z.enum(['lecturer','hod','principal','student','other']),
  college:   z.string().min(2),
  city:      z.string().optional(),
})

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

function buildConfirmationEmail({ name, webinar, feedbackToken }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://edudraftai.com'
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F7F6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F6;padding:40px 16px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0">
<tr><td style="background:#0D1F3C;padding:28px 32px">
  <span style="font-size:22px;font-weight:800;color:#ffffff">EduDraftAI</span>
  <span style="font-size:12px;color:#94a3b8;margin-left:8px">by Yuktra AI</span>
</td></tr>
<tr><td style="padding:32px">
  <h1 style="margin:0 0 8px;font-size:24px;color:#0D1F3C">You're in, ${name}! 🎉</h1>
  <p style="margin:0 0 24px;color:#718096;font-size:15px">You're registered for the EduDraftAI live demo.</p>
  <table width="100%" cellpadding="16" cellspacing="0" style="background:#F4F7F6;border-radius:12px;margin-bottom:24px;border:1px solid #E2E8F0">
  <tr><td>
    <p style="margin:0 0 6px;font-size:15px;color:#1A202C"><strong>${webinar.title}</strong></p>
    <p style="margin:0 0 4px;font-size:14px;color:#4a5568">📅 ${formatDate(webinar.date)}</p>
    <p style="margin:0 0 4px;font-size:14px;color:#4a5568">🕗 ${webinar.time_ist} IST &nbsp;·&nbsp; ${webinar.time_est} EST</p>
    <p style="margin:0;font-size:14px;color:#4a5568">📍 Google Meet (online)</p>
  </td></tr>
  </table>
  ${webinar.meet_link
    ? `<table width="100%" cellpadding="16" cellspacing="0" style="background:#E6FFFA;border-radius:12px;margin-bottom:24px;border:1px solid #00B4A6"><tr><td>
        <p style="margin:0 0 8px;font-size:13px;color:#00B4A6;font-weight:600">YOUR MEETING LINK</p>
        <a href="${webinar.meet_link}" style="font-size:15px;color:#0D1F3C;font-weight:700;word-break:break-all">${webinar.meet_link}</a>
       </td></tr></table>`
    : `<p style="color:#718096;font-size:14px;margin:0 0 24px;padding:16px;background:#f8fafc;border-radius:8px;border-left:3px solid #00B4A6">
        📧 The Google Meet link will be sent to this email <strong>1 hour before the event.</strong></p>`
  }
  <h3 style="font-size:15px;color:#0D1F3C;margin:0 0 12px">What you'll see:</h3>
  <ul style="margin:0 0 24px;padding-left:20px;color:#4a5568;font-size:14px;line-height:1.8">
    <li>Live MCQ bank generation from syllabus topics</li>
    <li>Lesson notes and question paper creation in real time</li>
    <li>Q&A — ask anything about the product</li>
  </ul>
  <p style="color:#718096;font-size:13px;margin:0;padding:12px 16px;background:#f8fafc;border-radius:8px">
    💬 During the demo, we'll share a personalised feedback link — only registered attendees can submit it.
  </p>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #E2E8F0;background:#f8fafc">
  <p style="margin:0;font-size:12px;color:#a0aec0;text-align:center">
    Yuktra AI · <a href="https://edudraftai.com" style="color:#00B4A6">edudraftai.com</a> · <a href="mailto:info@yuktraai.com" style="color:#00B4A6">info@yuktraai.com</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

export async function POST(request) {
  try {
    let body
    try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const parsed = schema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { webinarId, name, email, role, college, city } = parsed.data

    // Fetch webinar
    const { data: webinar, error: webinarErr } = await adminSupabase
      .from('webinars')
      .select('id,title,date,time_ist,time_est,meet_link,status,max_registrations')
      .eq('id', webinarId)
      .single()

    if (webinarErr || !webinar) return Response.json({ error: 'Webinar not found' }, { status: 404 })
    if (webinar.status === 'cancelled') return Response.json({ error: 'This webinar has been cancelled' }, { status: 400 })

    // Check capacity
    const { count } = await adminSupabase
      .from('webinar_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('webinar_id', webinarId)

    if ((count ?? 0) >= (webinar.max_registrations ?? 200))
      return Response.json({ error: 'This webinar is full. Check back for future events.' }, { status: 409 })

    // Insert registration
    const { data: reg, error: insertErr } = await adminSupabase
      .from('webinar_registrations')
      .insert({ webinar_id: webinarId, name, email, role, college, city: city ?? null })
      .select('id, feedback_token')
      .single()

    if (insertErr) {
      if (insertErr.code === '23505') return Response.json({ error: 'You are already registered for this webinar.' }, { status: 409 })
      throw insertErr
    }

    // Send confirmation email (non-fatal)
    let emailError = null
    try {
      const emailRes = await resend.emails.send({
        from: `EduDraftAI <${process.env.RESEND_FROM_EMAIL}>`,
        to: email,
        subject: `You're registered — ${webinar.title}, ${formatDate(webinar.date)} at ${webinar.time_ist} IST`,
        html: buildConfirmationEmail({ name, webinar, feedbackToken: reg.feedback_token }),
      })
      if (emailRes.error) {
        emailError = emailRes.error.message ?? JSON.stringify(emailRes.error)
        logger.error('[webinar/register] Resend returned error', emailError)
      }
    } catch (emailErr) {
      emailError = emailErr.message
      logger.error('[webinar/register] Email send failed', emailErr.message)
    }

    return Response.json({
      success: true,
      message: 'Registered successfully',
      ...(emailError ? { email_warning: emailError } : {}),
    })
  } catch (err) {
    logger.error('[POST /api/webinar/register]', err)
    return Response.json({ error: 'Registration failed. Please try again.', code: err.message }, { status: 500 })
  }
}
