import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Resend batch.send() limit per call
const RESEND_BATCH_LIMIT = 100

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
      .from('webinars').select('id,title,slug').eq('id', webinarId).single()
    if (!webinar) return Response.json({ error: 'Webinar not found' }, { status: 404 })

    const { data: regs, error: regsError } = await adminSupabase
      .from('webinar_registrations')
      .select('id, name, email, feedback_token')
      .eq('webinar_id', webinarId)

    if (regsError) {
      logger.error('[send-feedback-emails] DB error fetching regs', regsError)
      return Response.json({ error: `DB error: ${regsError.message}` }, { status: 500 })
    }

    if (!regs || regs.length === 0) {
      return Response.json({ error: 'No registrants found for this webinar.' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://edudraftai.com'

    // Build all email payloads
    const emails = regs.map(reg => {
      const feedbackUrl = `${appUrl}/webinar/${webinar.slug}/feedback?token=${reg.feedback_token}`
      return {
        from:    `EduDraftAI <${process.env.RESEND_FROM_EMAIL}>`,
        to:      reg.email,
        subject: `Share your feedback — ${webinar.title}`,
        html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#F4F7F6;padding:40px 16px">
          <table width="560" style="background:#fff;border-radius:16px;border:1px solid #E2E8F0;margin:0 auto">
          <tr><td style="background:#0D1F3C;padding:24px 32px;border-radius:16px 16px 0 0">
            <span style="font-size:20px;font-weight:800;color:#fff">EduDraftAI</span>
          </td></tr>
          <tr><td style="padding:32px;text-align:center">
            <h2 style="color:#0D1F3C;margin:0 0 12px">Thank you for attending, ${reg.name}!</h2>
            <p style="color:#718096;margin:0 0 28px">Your feedback helps us make EduDraftAI better for lecturers across India. It takes less than 2 minutes.</p>
            <a href="${feedbackUrl}" style="display:inline-block;background:#00B4A6;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">Submit Feedback →</a>
            <p style="color:#a0aec0;font-size:12px;margin:24px 0 20px">This link is unique to you and expires once submitted.</p>
            <table width="100%" cellpadding="14" cellspacing="0" style="background:#f0fdf4;border-radius:10px;border:1px solid #86efac"><tr><td style="text-align:center">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#16a34a">📱 Join our WhatsApp Community</p>
              <p style="margin:0 0 10px;font-size:13px;color:#4a5568">Stay connected for product updates, tips, and announcements.</p>
              <a href="https://chat.whatsapp.com/In6zM8mLtJ03AFEcVFE5br?mode=gi_t" style="display:inline-block;background:#25D366;color:#ffffff;padding:9px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">Join WhatsApp Group →</a>
            </td></tr></table>
          </td></tr>
          <tr><td style="padding:16px 32px;border-top:1px solid #E2E8F0;background:#f8fafc">
            <p style="margin:0;font-size:12px;color:#a0aec0;text-align:center">edudraftai.com · info@yuktraai.com</p>
          </td></tr>
          </table>
        </body></html>`,
      }
    })

    // Send in batches of 100 (Resend batch limit) — one API call per batch
    // avoids the "5 req/s" rate limit that hits when sending individually
    let sent   = 0
    let failed = 0
    const firstError = { message: null }

    for (let i = 0; i < emails.length; i += RESEND_BATCH_LIMIT) {
      const chunk  = emails.slice(i, i + RESEND_BATCH_LIMIT)
      const result = await resend.batch.send(chunk)

      if (result.error) {
        // Whole batch rejected (e.g. daily limit, auth error)
        failed += chunk.length
        if (!firstError.message) firstError.message = result.error.message ?? JSON.stringify(result.error)
        logger.error('[send-feedback-emails] Batch rejected', result.error)
      } else {
        // result.data is an array of { id } or { error } per email
        const results = result.data ?? []
        results.forEach((r, idx) => {
          if (r?.id) {
            sent++
          } else {
            failed++
            if (!firstError.message) firstError.message = r?.error?.message ?? 'Unknown per-email error'
            logger.error('[send-feedback-emails] Per-email error', chunk[idx]?.to, r?.error)
          }
        })
        // If results array is shorter than chunk (edge case), count remainder as sent
        if (results.length < chunk.length) sent += chunk.length - results.length
      }

      // Small pause between batches (only matters if > 100 registrants)
      if (i + RESEND_BATCH_LIMIT < emails.length) {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    if (sent === 0 && failed > 0) {
      return Response.json({
        error: `All ${failed} email(s) failed. Resend error: ${firstError.message ?? 'check Resend dashboard logs'}`,
      }, { status: 500 })
    }

    return Response.json({
      success: true,
      sent,
      failed,
      total: regs.length,
      ...(firstError.message && { firstError: firstError.message }),
    })
  } catch (err) {
    logger.error('[POST /api/webinar/send-feedback-emails]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
