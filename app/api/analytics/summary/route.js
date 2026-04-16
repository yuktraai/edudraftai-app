import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/analytics/summary?range=month|last_month|all
// college_admin → own college only | super_admin → pass college_id param
export async function GET(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role, college_id').eq('id', user.id).single()

    if (!['college_admin', 'super_admin'].includes(profile?.role))
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const range     = searchParams.get('range') ?? 'month'
    const collegeId = profile.role === 'super_admin'
      ? (searchParams.get('college_id') ?? profile.college_id)
      : profile.college_id

    // Date range
    const now = new Date()
    let fromDate
    if (range === 'month') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    } else if (range === 'last_month') {
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    } else {
      fromDate = null // all time
    }

    const baseQuery = () => {
      let q = adminSupabase.from('content_generations')
        .select('content_type, credits_used, created_at, user_id, users(name)', { count: 'exact' })
        .eq('college_id', collegeId)
        .eq('status', 'completed')
      if (fromDate) q = q.gte('created_at', fromDate)
      if (range === 'last_month') {
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        q = q.lt('created_at', endOfLastMonth)
      }
      return q
    }

    // Last 30 days for bar chart (always fixed)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const [mainResult, dailyResult] = await Promise.all([
      baseQuery(),
      adminSupabase.from('content_generations')
        .select('created_at')
        .eq('college_id', collegeId)
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo),
    ])

    if (mainResult.error) throw mainResult.error

    const rows = mainResult.data ?? []

    // by_type breakdown
    const by_type = { lesson_notes: 0, mcq_bank: 0, question_bank: 0, test_plan: 0 }
    rows.forEach(r => { if (by_type[r.content_type] !== undefined) by_type[r.content_type]++ })

    // total credits used
    const total_credits_used = rows.reduce((s, r) => s + (r.credits_used ?? 1), 0)

    // top 5 lecturers
    const userCounts = {}
    const userNames  = {}
    rows.forEach(r => {
      userCounts[r.user_id] = (userCounts[r.user_id] ?? 0) + 1
      userNames[r.user_id]  = r.users?.name ?? 'Unknown'
    })
    const top_lecturers = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([user_id, count]) => ({ user_id, name: userNames[user_id], count }))

    // daily counts (last 30 days)
    const dailyMap = {}
    ;(dailyResult.data ?? []).forEach(r => {
      const day = r.created_at.slice(0, 10)
      dailyMap[day] = (dailyMap[day] ?? 0) + 1
    })
    const daily_counts = []
    for (let i = 29; i >= 0; i--) {
      const d   = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      daily_counts.push({ date: key, count: dailyMap[key] ?? 0 })
    }

    return Response.json({
      total_generations: rows.length,
      total_credits_used,
      by_type,
      top_lecturers,
      daily_counts,
    })
  } catch (err) {
    logger.error('[GET /api/analytics/summary]', err)
    return Response.json({ error: 'Failed to fetch analytics', code: err.message }, { status: 500 })
  }
}
