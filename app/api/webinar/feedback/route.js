import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const schema = z.object({
  registrationId: z.string().uuid(),
  webinarId:      z.string().uuid(),
  token:          z.string().uuid(),
  rating:         z.number().int().min(1).max(5),
  foundUseful:    z.boolean().optional(),
  wouldRecommend: z.boolean().optional(),
  comment:        z.string().max(2000).optional(),
})

export async function POST(request) {
  try {
    let body
    try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

    const parsed = schema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { registrationId, webinarId, token, rating, foundUseful, wouldRecommend, comment } = parsed.data

    // Verify token
    const { data: reg } = await adminSupabase
      .from('webinar_registrations')
      .select('id')
      .eq('id', registrationId)
      .eq('feedback_token', token)
      .eq('webinar_id', webinarId)
      .single()

    if (!reg) return Response.json({ error: 'Invalid feedback token' }, { status: 401 })

    // Check feedback_open
    const { data: webinar } = await adminSupabase
      .from('webinars')
      .select('feedback_open')
      .eq('id', webinarId)
      .single()

    if (!webinar?.feedback_open) return Response.json({ error: 'Feedback is not open yet for this event.' }, { status: 403 })

    // Check duplicate
    const { data: existing } = await adminSupabase
      .from('webinar_feedback')
      .select('id')
      .eq('registration_id', registrationId)
      .single()

    if (existing) return Response.json({ error: 'You have already submitted feedback.' }, { status: 409 })

    // Insert
    const { error: insertErr } = await adminSupabase
      .from('webinar_feedback')
      .insert({
        webinar_id:      webinarId,
        registration_id: registrationId,
        rating,
        found_useful:    foundUseful ?? null,
        would_recommend: wouldRecommend ?? null,
        comment:         comment ?? null,
      })

    if (insertErr) throw insertErr

    return Response.json({ success: true })
  } catch (err) {
    logger.error('[POST /api/webinar/feedback]', err)
    return Response.json({ error: 'Failed to submit feedback.', code: err.message }, { status: 500 })
  }
}
