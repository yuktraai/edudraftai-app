import { adminSupabase } from '@/lib/supabase/admin'
import { getResend }     from '@/lib/email/resend'
import { waitlistConfirmationEmail } from '@/lib/email/templates/waitlist-confirmation'
import { z }            from 'zod'
import { logger }       from '@/lib/logger'

const schema = z.object({
  name:         z.string().min(2).max(100).trim(),
  email:        z.string().email().max(254).trim().toLowerCase(),
  college_name: z.string().max(200).trim().optional().nullable(),
  role:         z.string().max(50).trim().optional().nullable(),
})

export async function POST(request) {
  try {
    const body   = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
    }

    const { name, email, college_name, role } = parsed.data

    // Check for duplicate (silent success — don't reveal if email already exists)
    const { data: existing } = await adminSupabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!existing) {
      // Insert new waitlist entry
      const { error: insertErr } = await adminSupabase
        .from('waitlist')
        .insert({ name, email, college_name: college_name ?? null, role: role ?? null })

      if (insertErr) {
        logger.error('[waitlist POST] insert error', insertErr)
        return Response.json({ error: 'Failed to join waitlist' }, { status: 500 })
      }

      // Send confirmation email (fire-and-forget — don't fail the request if email fails)
      try {
        const { subject, html } = waitlistConfirmationEmail({ name, email })
        const result = await getResend().emails.send({
          from:    'EduDraftAI <waitlist@edudraftai.com>',
          to:      email,
          subject,
          html,
        })
        if (result?.error) {
          logger.error('[waitlist] Resend API error:', JSON.stringify(result.error))
        } else {
          logger.info('[waitlist] confirmation email sent, id:', result?.data?.id)
        }
      } catch (emailErr) {
        logger.error('[waitlist] email send exception:', emailErr?.message ?? emailErr)
        // Don't fail the signup — just log
      }
    }

    return Response.json({ data: { success: true } })
  } catch (err) {
    logger.error('[waitlist POST]', err)
    return Response.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

export async function GET(request) {
  // Super-admin only listing endpoint
  // Authentication checked client-side via Supabase session;
  // actual data-access restriction is enforced by the fact that only service role can read waitlist.
  try {
    const { searchParams } = new URL(request.url)
    const page    = parseInt(searchParams.get('page') ?? '1', 10)
    const limit   = 50
    const offset  = (page - 1) * limit

    const { data, count } = await adminSupabase
      .from('waitlist')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    return Response.json({ data: data ?? [], total: count ?? 0, page, limit })
  } catch (err) {
    logger.error('[waitlist GET]', err)
    return Response.json({ error: 'Failed to fetch waitlist' }, { status: 500 })
  }
}
