import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/analytics/global?range=month|last_month|all
// super_admin ONLY — returns per-college breakdown + platform totals
export async function GET(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role').eq('id', user.id).single()

    if (profile?.role !== 'super_admin')
      return Response.json({ error: 'Forbidden — super_admin only' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') ?? 'month'

    const now = new Date()
    let fromDate, toDate
    if (range === 'month') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      toDate   = null
    } else if (range === 'last_month') {
      fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      toDate   = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    } else {
      fromDate = null
      toDate   = null
    }

    // Fetch all active colleges
    const { data: colleges, error: cErr } = await adminSupabase
      .from('colleges').select('id, name').eq('is_active', true).order('name')
    if (cErr) throw cErr

    // Fetch all completed generations in range (for platform-wide stats)
    const allGensQuery = (() => {
      let q = adminSupabase
        .from('content_generations')
        .select('college_id, content_type, credits_used, user_id')
        .eq('status', 'completed')
      if (fromDate) q = q.gte('created_at', fromDate)
      if (toDate)   q = q.lt('created_at', toDate)
      return q
    })()

    // Fetch per-college lecturer counts
    const lecturerCountQuery = adminSupabase
      .from('users')
      .select('college_id', { count: 'exact' })
      .eq('role', 'lecturer')
      .eq('is_active', true)

    const [allGensRes, lecturerRes] = await Promise.all([allGensQuery, lecturerCountQuery])

    const allGens = allGensRes.data ?? []

    // Platform-wide content type breakdown
    const platform_by_type = { lesson_notes: 0, mcq_bank: 0, question_bank: 0, test_plan: 0 }
    allGens.forEach(g => {
      if (platform_by_type[g.content_type] !== undefined) platform_by_type[g.content_type]++
    })

    // Per-college grouping
    const gensByCollege = {}
    allGens.forEach(g => {
      if (!gensByCollege[g.college_id]) gensByCollege[g.college_id] = []
      gensByCollege[g.college_id].push(g)
    })

    // Lecturer counts per college (from all lecturers in DB, not filtered by range)
    const lecturersByCollege = {}
    const { data: lecturers } = await adminSupabase
      .from('users')
      .select('college_id')
      .eq('role', 'lecturer')
      .eq('is_active', true)
    ;(lecturers ?? []).forEach(u => {
      lecturersByCollege[u.college_id] = (lecturersByCollege[u.college_id] ?? 0) + 1
    })

    // Build per-college results
    const results = (colleges ?? []).map(col => {
      const gens         = gensByCollege[col.id] ?? []
      const total_gens   = gens.length
      const credits_used = gens.reduce((s, g) => s + (g.credits_used ?? 1), 0)

      const typeCounts = {}
      gens.forEach(g => { typeCounts[g.content_type] = (typeCounts[g.content_type] ?? 0) + 1 })
      const top_type   = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

      return {
        college_id:   col.id,
        college_name: col.name,
        lecturers:    lecturersByCollege[col.id] ?? 0,
        generations:  total_gens,
        credits_used,
        top_type,
        by_type:      typeCounts,
      }
    })

    // Platform totals
    const totals = {
      colleges:     colleges?.length ?? 0,
      lecturers:    Object.values(lecturersByCollege).reduce((s, n) => s + n, 0),
      generations:  allGens.length,
      credits_used: allGens.reduce((s, g) => s + (g.credits_used ?? 1), 0),
    }

    return Response.json({ data: results, platform_by_type, totals, range })
  } catch (err) {
    logger.error('[GET /api/analytics/global]', err)
    return Response.json({ error: 'Failed to fetch global analytics', code: err.message }, { status: 500 })
  }
}
