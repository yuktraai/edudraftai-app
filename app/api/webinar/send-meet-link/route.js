import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })
    const { data: profile } = await adminSupabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { webinarId } = await request.json()
    if (!webinarId) return Response.json({ error: 'webinarId required' }, { status: 400 })

    const { data: webinar } = await adminSupabase
      .from('webinars').select('id,title,date,time_ist,meet_link').eq('id', webinarId).single()

    if (!webinar) return Response.json({ error: 'Webinar not found' }, { status: 404 })
    if (!webinar.meet_link) return Response.json({ error: 'Meet link not set on this webinar' }, { status: 400 })

    const { data: regs } = await adminSupabase
      .from('webinar_registrations')
      .select('id, name, email')
      .eq('webinar_id', webinarId)
      .eq('meet_link_sent', false)

    if (!regs?.length) return Response.json({ success: true, sent: 0, message: 'All registrants already have the link' })

    let sent = 0
    const BATCH = 50

    for (let i = 0; i < regs.length; i += BATCH) {
      const batch = regs.slice(i, i + BATCH)
      await Promise.all(batch.map(async reg => {
        try {
          await resend.emails.send({
            from: `EduDraftAI <${process.env.RESEND_FROM_EMAIL}>`,
            to: reg.email,
            subject: `Your Google Meet link — ${webinar.title} at ${webinar.time_ist} IST`,
            html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#F4F7F6;padding:40px 16px">
              <table width="560" style="background:#fff;border-radius:16px;border:1px solid #E2E8F0;margin:0 auto">
              <tr><td style="background:#0D1F3C;padding:24px 32px;border-radius:16px 16px 0 0">
                <span style="font-size:20px;font-weight:800;color:#fff">EduDraftAI</span>
              </td></tr>
              <tr><td style="padding:32px">
                <h2 style="color:#0D1F3C;margin:0 0 16px">Hi ${reg.name}, here's your meeting link!</h2>
                <p style="color:#718096;margin:0 0 24px">Your Google Meet link for tonight's EduDraftAI demo:</p>
                <a href="${webinar.meet_link}" style="display:inline-block;background:#00B4A6;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">Join the Meeting →</a>
                <p style="color:#718096;font-size:13px;margin:24px 0 20px">Event: ${webinar.title} · ${webinar.time_ist} IST</p>
                <table width="100%" cellpadding="14" cellspacing="0" style="background:#f0fdf4;border-radius:10px;border:1px solid #86efac"><tr><td>
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#16a34a">📱 Join our WhatsApp Community</p>
                  <p style="margin:0 0 10px;font-size:13px;color:#4a5568">Stay connected for updates, tips, and announcements.</p>
                  <a href="https://chat.whatsapp.com/In6zM8mLtJ03AFEcVFE5br?mode=gi_t" style="display:inline-block;background:#25D366;color:#ffffff;padding:9px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">Join WhatsApp Group →</a>
                </td></tr></table>
              </td></tr>
              <tr><td style="padding:16px 32px;border-top:1px solid #E2E8F0;background:#f8fafc">
                <p style="margin:0;font-size:12px;color:#a0aec0;text-align:center">edudraftai.com · info@yuktraai.com</p>
              </td></tr>
              </table>
            </body></html>`,
          })
          sent++
        } catch (e) {
          logger.error('[send-meet-link] Email failed for', reg.email, e.message)
        }
      }))

      // Update sent flags for this batch
      await adminSupabase
        .from('webinar_registrations')
        .update({ meet_link_sent: true })
        .in('id', batch.map(r => r.id))

      if (i + BATCH < regs.length) await new Promise(r => setTimeout(r, 200))
    }

    return Response.json({ success: true, sent })
  } catch (err) {
    logger.error('[POST /api/webinar/send-meet-link]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
