import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/analytics/global?range=month|last_month|all
// super_admin ONLY — returns per-college breakdown + platform totals + trend + deltas
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

    // ── Date bounds ────────────────────────────────────────────────────────────
    let fromDate, toDate, prevFromDate, prevToDate

    if (range === 'month') {
      fromDate     = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      toDate       = null
      prevFromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      prevToDate   = fromDate
    } else if (range === 'last_month') {
      fromDate     = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      toDate       = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      prevFromDate = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString()
      prevToDate   = fromDate
    } else {
      // all time — no previous comparison
      fromDate     = null
      toDate       = null
      prevFromDate = null
      prevToDate   = null
    }

    // ── Build scoped queries ────────────────────────────────────────────────────
    function gensQuery(from, to) {
      let q = adminSupabase
        .from('content_generations')
        .select('college_id, content_type, credits_used, user_id, metadata, created_at')
        .eq('status', 'completed')
      if (from) q = q.gte('created_at', from)
      if (to)   q = q.lt('created_at', to)
      return q
    }

    // ── Parallel fetches ────────────────────────────────────────────────────────
    const [
      collegesRes,
      allGensRes,
      prevGensRes,
      lecturersRes,
      departmentsRes,
    ] = await Promise.all([
      adminSupabase.from('colleges').select('id, name').eq('is_active', true).order('name'),
      gensQuery(fromDate, toDate),
      prevFromDate ? gensQuery(prevFromDate, prevToDate) : Promise.resolve({ data: [] }),
      adminSupabase.from('users').select('college_id').eq('role', 'lecturer').eq('is_active', true),
      adminSupabase.from('departments').select('college_id').eq('is_active', true),
    ])

    if (collegesRes.error) throw collegesRes.error

    const colleges    = collegesRes.data   ?? []
    const allGens     = allGensRes.data    ?? []
    const prevGens    = prevGensRes.data   ?? []
    const lecturers   = lecturersRes.data  ?? []
    const departments = departmentsRes.data ?? []

    // ── Lecturer + department counts per college ────────────────────────────────
    const lecturersByCollege = {}
    lecturers.forEach(u => {
      lecturersByCollege[u.college_id] = (lecturersByCollege[u.college_id] ?? 0) + 1
    })
    const deptsByCollege = {}
    departments.forEach(d => {
      deptsByCollege[d.college_id] = (deptsByCollege[d.college_id] ?? 0) + 1
    })

    // ── Current period aggregations ─────────────────────────────────────────────
    const platform_by_type = { lesson_notes: 0, mcq_bank: 0, question_bank: 0, test_plan: 0, exam_paper: 0 }
    let rag_generations = 0
    allGens.forEach(g => {
      if (platform_by_type[g.content_type] !== undefined) platform_by_type[g.content_type]++
      if (Number(g.metadata?.rag_chunks_used ?? 0) > 0) rag_generations++
    })

    // ── Previous period aggregations (for delta) ────────────────────────────────
    const prevTotalGens    = prevGens.length
    const prevTotalCredits = prevGens.reduce((s, g) => s + (g.credits_used ?? 1), 0)

    // ── Trend data (daily for month/last_month, monthly for all) ───────────────
    function buildTrend(gens, rangeType) {
      if (gens.length === 0) return { labels: [], values: [] }

      const buckets = {}
      gens.forEach(g => {
        const d = new Date(g.created_at)
        let key, label
        if (rangeType === 'all') {
          key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          label = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' })
        } else {
          key   = d.toISOString().slice(0, 10)
          label = d.toLocaleString('en-IN', { day: '2-digit', month: 'short' })
        }
        if (!buckets[key]) buckets[key] = { label, count: 0 }
        buckets[key].count++
      })

      const sorted = Object.keys(buckets).sort()
      return {
        labels: sorted.map(k => buckets[k].label),
        values: sorted.map(k => buckets[k].count),
      }
    }
    const trend = buildTrend(allGens, range)

    // ── Breakdown by content type ────────────────────────────────────────────────
    const totalGens = allGens.length
    const breakdown = Object.entries(platform_by_type)
      .map(([type, count]) => ({
        type,
        count,
        pct: totalGens > 0 ? Math.round((count / totalGens) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    // ── Per-college grouping ─────────────────────────────────────────────────────
    const gensByCollege = {}
    allGens.forEach(g => {
      if (!gensByCollege[g.college_id]) gensByCollege[g.college_id] = []
      gensByCollege[g.college_id].push(g)
    })

    // ── Build per-college results ───────────────────────────────────────────────
    const collegeResults = colleges.map(col => {
      const gens         = gensByCollege[col.id] ?? []
      const total_gens   = gens.length
      const credits_used = gens.reduce((s, g) => s + (g.credits_used ?? 1), 0)

      const typeCounts = {}
      gens.forEach(g => { typeCounts[g.content_type] = (typeCounts[g.content_type] ?? 0) + 1 })
      const top_type = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

      return {
        college_id:   col.id,
        college_name: col.name,
        departments:  deptsByCollege[col.id]   ?? 0,
        lecturers:    lecturersByCollege[col.id] ?? 0,
        generations:  total_gens,
        credits_used,
        top_type,
        by_type:      typeCounts,
      }
    })

    // ── Needs attention ──────────────────────────────────────────────────────────
    const needs_attention = range !== 'all'
      ? collegeResults
          .filter(c => c.generations === 0)
          .map(c => ({ id: c.college_id, name: c.college_name, issue: 'no_activity' }))
      : []

    // ── Summary with deltas ──────────────────────────────────────────────────────
    const totalLecturers  = Object.values(lecturersByCollege).reduce((s, n) => s + n, 0)
    const totalCredits    = allGens.reduce((s, g) => s + (g.credits_used ?? 1), 0)

    const summary = {
      colleges:        { current: colleges.length,  previous: colleges.length },
      lecturers:       { current: totalLecturers,   previous: totalLecturers },
      generations:     { current: totalGens,        previous: prevTotalGens },
      credits_used:    { current: totalCredits,     previous: prevTotalCredits },
      rag_generations,
    }

    // ── Legacy-compatible totals (for any other callers) ───────────────────────
    const totals = {
      colleges:        colleges.length,
      lecturers:       totalLecturers,
      generations:     totalGens,
      credits_used:    totalCredits,
      rag_generations,
    }

    return Response.json({
      // New shape (Phase 53)
      summary,
      breakdown,
      trend,
      colleges: collegeResults,
      needs_attention,
      // Legacy shape (kept for compatibility)
      data:             collegeResults,
      platform_by_type,
      totals,
      range,
    })
  } catch (err) {
    logger.error('[GET /api/analytics/global]', err)
    return Response.json({ error: 'Failed to fetch global analytics', code: err.message }, { status: 500 })
  }
}
