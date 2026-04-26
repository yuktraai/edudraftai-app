import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export async function GET(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role').eq('id', user.id).single()

    if (profile?.role !== 'super_admin') return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { data: webinar } = await adminSupabase
      .from('webinars').select('id, slug').eq('slug', params.slug).single()

    if (!webinar) return Response.json({ error: 'Webinar not found' }, { status: 404 })

    const { data: regs } = await adminSupabase
      .from('webinar_registrations')
      .select('id, name, email, role, college, city, registered_at, meet_link_sent')
      .eq('webinar_id', webinar.id)
      .order('registered_at', { ascending: true })

    const { data: feedbacks } = await adminSupabase
      .from('webinar_feedback')
      .select('registration_id, rating')
      .eq('webinar_id', webinar.id)

    const feedbackMap = new Map((feedbacks ?? []).map(f => [f.registration_id, f]))

    const rows = (regs ?? []).map(r => ({
      ...r,
      feedback_submitted: feedbackMap.has(r.id),
      feedback_rating: feedbackMap.get(r.id)?.rating ?? null,
    }))

    const { searchParams } = new URL(request.url)
    if (searchParams.get('format') === 'csv') {
      const csv = [
        ['Name','Email','Role','College','City','Registered At','Meet Link Sent','Feedback Submitted','Rating'],
        ...rows.map(r => [
          r.name, r.email, r.role, r.college, r.city ?? '',
          new Date(r.registered_at).toLocaleString('en-IN'),
          r.meet_link_sent ? 'Yes' : 'No',
          r.feedback_submitted ? 'Yes' : 'No',
          r.feedback_rating ?? '',
        ])
      ].map(row => row.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\n')

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="registrations-${params.slug}.csv"`,
        }
      })
    }

    return Response.json({ registrations: rows })
  } catch (err) {
    logger.error('[GET /api/webinar/[slug]/registrations]', err)
    return Response.json({ error: 'Failed to fetch registrations', code: err.message }, { status: 500 })
  }
}
