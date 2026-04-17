import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role').eq('id', user.id).single()

    if (profile?.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all feedback
    const { data: feedback } = await adminSupabase
      .from('content_feedback')
      .select(`
        id, rating, feedback_text, content_type, created_at,
        users ( name ),
        colleges ( name ),
        content_generations ( prompt_params )
      `)
      .order('created_at', { ascending: false })

    const all        = feedback ?? []
    const total      = all.length
    const thumbsUp   = all.filter(f => f.rating === 'thumbs_up').length
    const thumbsDown = all.filter(f => f.rating === 'thumbs_down').length
    const satPct     = total > 0 ? Math.round((thumbsUp / total) * 100) : 0

    // By content type
    const typeMap = {}
    for (const f of all) {
      const t = f.content_type ?? 'unknown'
      if (!typeMap[t]) typeMap[t] = { type: t, up: 0, down: 0 }
      if (f.rating === 'thumbs_up')   typeMap[t].up++
      if (f.rating === 'thumbs_down') typeMap[t].down++
    }
    const byContentType = Object.values(typeMap).map(t => ({
      ...t,
      pct: t.up + t.down > 0 ? Math.round((t.up / (t.up + t.down)) * 100) : 0,
    }))

    // By college
    const collegeMap = {}
    for (const f of all) {
      const name = f.colleges?.name ?? 'Unknown'
      if (!collegeMap[name]) collegeMap[name] = { college_name: name, up: 0, down: 0 }
      if (f.rating === 'thumbs_up')   collegeMap[name].up++
      if (f.rating === 'thumbs_down') collegeMap[name].down++
    }
    const byCollege = Object.values(collegeMap)
      .sort((a, b) => (b.up + b.down) - (a.up + a.down))
      .slice(0, 10)
      .map(c => ({
        ...c,
        pct: c.up + c.down > 0 ? Math.round((c.up / (c.up + c.down)) * 100) : 0,
      }))

    // Worst content type
    const worstType = byContentType.sort((a, b) => a.pct - b.pct)[0] ?? null

    // Negative feedback rows
    const negativeFeedback = all
      .filter(f => f.rating === 'thumbs_down')
      .map(f => ({
        college:       f.colleges?.name ?? '—',
        lecturer_name: f.users?.name ?? '—',
        content_type:  f.content_type ?? '—',
        topic:         f.content_generations?.prompt_params?.topic ?? '—',
        feedback_text: f.feedback_text ?? '',
        created_at:    f.created_at,
      }))

    return Response.json({
      data: {
        total_rated:      total,
        thumbs_up_count:  thumbsUp,
        thumbs_down_count: thumbsDown,
        satisfaction_pct: satPct,
        by_content_type:  byContentType,
        by_college:       byCollege,
        worst_type:       worstType,
        negative_feedback: negativeFeedback,
      },
    })
  } catch (err) {
    logger.error('[analytics/feedback]', err)
    return Response.json({ error: 'Failed to fetch feedback analytics' }, { status: 500 })
  }
}
