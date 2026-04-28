import { adminSupabase } from '@/lib/supabase/admin'
import { sendDigestEmail } from '@/lib/email/digest'
import { logger } from '@/lib/logger'

// GET /api/cron/weekly-digest
// Triggered by Vercel cron every Monday 2:30 UTC (8:00 AM IST).
// Also callable manually with the cron secret header for testing.
export async function GET(request) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET)
    return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const now     = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const weekAgoIso = weekAgo.toISOString()

    // Fetch all active college admins with their college info
    const { data: admins, error: adminErr } = await adminSupabase
      .from('users')
      .select('id, name, email, college_id, colleges(id, name), preferences')
      .eq('role', 'college_admin')
      .eq('is_active', true)
      .not('college_id', 'is', null)

    if (adminErr) throw adminErr

    let sent = 0

    for (const admin of admins ?? []) {
      // Respect opt-out
      if (admin.preferences?.email_notifications?.weekly_digest === false) continue

      const collegeId   = admin.college_id
      const collegeName = admin.colleges?.name ?? 'Your College'

      try {
        // Queries in parallel
        const [
          { data: genRows },
          { count: totalLecturers },
          { data: creditRows },
          { data: poolRows },
          { data: deptRows },
        ] = await Promise.all([
          // Generations this week
          adminSupabase
            .from('content_generations')
            .select('user_id, department_id, credits_used')
            .eq('college_id', collegeId)
            .eq('status', 'completed')
            .gte('created_at', weekAgoIso),

          // Total active lecturers in college
          adminSupabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('college_id', collegeId)
            .eq('role', 'lecturer')
            .eq('is_active', true),

          // Credit ledger debits this week (negative = used)
          adminSupabase
            .from('credit_ledger')
            .select('amount')
            .eq('college_id', collegeId)
            .lt('amount', 0)
            .gte('created_at', weekAgoIso),

          // Current pool balance
          adminSupabase
            .from('credit_ledger')
            .select('amount')
            .eq('college_id', collegeId),

          // Dept breakdown (need dept names)
          adminSupabase
            .from('content_generations')
            .select('department_id, departments(name)')
            .eq('college_id', collegeId)
            .eq('status', 'completed')
            .gte('created_at', weekAgoIso),
        ])

        const totalGenerations = genRows?.length ?? 0
        const activeLecturers  = new Set((genRows ?? []).map(r => r.user_id)).size
        const creditsUsed      = Math.abs((creditRows ?? []).reduce((s, r) => s + r.amount, 0))
        const creditsRemaining = (poolRows ?? []).reduce((s, r) => s + r.amount, 0)

        // Top department by generation count
        const deptCount = {}
        for (const r of deptRows ?? []) {
          const dname = r.departments?.name ?? 'Unknown'
          deptCount[dname] = (deptCount[dname] ?? 0) + 1
        }
        const topDeptEntry = Object.entries(deptCount).sort((a, b) => b[1] - a[1])[0]
        const topDept      = topDeptEntry?.[0] ?? null
        const topDeptCount = topDeptEntry?.[1] ?? 0

        // Zero-credit lecturers
        const { data: lecturers } = await adminSupabase
          .from('users')
          .select('id, name')
          .eq('college_id', collegeId)
          .eq('role', 'lecturer')
          .eq('is_active', true)

        const zeroBalanceLecturers = []
        for (const lec of lecturers ?? []) {
          const { data: bal } = await adminSupabase
            .rpc('get_credit_balance', { p_user_id: lec.id })
          if ((bal ?? 0) <= 0) zeroBalanceLecturers.push(lec.name ?? lec.id)
        }

        await sendDigestEmail({
          to:          admin.email,
          name:        admin.name ?? 'Admin',
          collegeName,
          stats: {
            totalGenerations,
            activeLecturers,
            totalLecturers: totalLecturers ?? 0,
            creditsUsed,
            creditsRemaining,
            topDept,
            topDeptCount,
            zeroBalanceLecturers,
          },
        })

        sent++
        logger.info(`[digest] sent to ${admin.email} (${collegeName})`)
      } catch (innerErr) {
        logger.error(`[digest] failed for ${admin.email}`, innerErr.message)
      }
    }

    return Response.json({ ok: true, sent })
  } catch (err) {
    logger.error('[GET /api/cron/weekly-digest]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
