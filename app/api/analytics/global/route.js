import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/analytics/global?range=month|last_month|all
// super_admin ONLY — returns per-college breakdown
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

    // Fetch all colleges
    const { data: colleges, error: cErr } = await adminSupabase
      .from('colleges').select('id, name').eq('is_active', true).order('name')
    if (cErr) throw cErr

    // For each college: lecturers count, generations, credits used, top type
    const results = await Promise.all((colleges ?? []).map(async (col) => {
      const [lecturersRes, gensRes] = await Promise.all([
        adminSupabase.from('users')
          .select('id', { count: 'exact', head: true })
          .eq('college_id', col.id).eq('role', 'lecturer').eq('is_active', true),

        (() => {
          let q = adminSupabase.from('content_generations')
            .select('content_type, credits_used')
            .eq('college_id', col.id)
            .eq('status', 'completed')
          if (fromDate) q = q.gte('created_at', fromDate)
          if (toDate)   q = q.lt('created_at', toDate)
          return q
        })(),
      ])

      const gens           = gensRes.data ?? []
      const total_gens     = gens.length
      const credits_used   = gens.reduce((s, g) => s + (g.credits_used ?? 1), 0)

      const typeCounts = {}
      gens.forEach(g => { typeCounts[g.content_type] = (typeCounts[g.content_type] ?? 0) + 1 })
      const top_type = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

      return {
        college_id:   col.id,
        college_name: col.name,
        lecturers:    lecturersRes.count ?? 0,
        generations:  total_gens,
        credits_used,
        top_type,
      }
    }))

    return Response.json({ data: results, range })
  } catch (err) {
    logger.error('[GET /api/analytics/global]', err)
    return Response.json({ error: 'Failed to fetch global analytics', code: err.message }, { status: 500 })
  }
}
