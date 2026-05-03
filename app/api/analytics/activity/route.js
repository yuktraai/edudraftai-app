import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET /api/analytics/activity — last 30 days of generation counts per day per content_type
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const since = new Date()
    since.setDate(since.getDate() - 29)
    since.setHours(0, 0, 0, 0)

    const { data, error } = await adminSupabase
      .from('content_generations')
      .select('content_type, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', since.toISOString())
      .order('created_at')

    if (error) throw error

    // Build a map: date string → { lesson_notes, mcq_bank, question_bank, test_plan, total }
    const map = {}
    // Pre-fill all 30 days so chart shows gaps
    for (let i = 0; i < 30; i++) {
      const d = new Date(since)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      map[key] = { date: key, lesson_notes: 0, mcq_bank: 0, question_bank: 0, test_plan: 0, exam_paper: 0, total: 0 }
    }

    for (const row of data ?? []) {
      const key = row.created_at.slice(0, 10)
      if (map[key]) {
        const ct = row.content_type
        if (map[key][ct] !== undefined) map[key][ct]++
        map[key].total++
      }
    }

    return Response.json({ data: Object.values(map) })
  } catch (err) {
    logger.error('[GET /api/analytics/activity]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
