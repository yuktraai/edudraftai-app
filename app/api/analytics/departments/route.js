import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET(request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: profile } = await adminSupabase
    .from('users')
    .select('id, role, college_id, is_active')
    .eq('id', user.id)
    .single()

  if (!profile?.is_active) return Response.json({ error: 'Account not active' }, { status: 403 })
  if (!['college_admin', 'super_admin'].includes(profile.role))
    return Response.json({ error: 'Forbidden' }, { status: 403 })

  try {
    // Fetch all departments for the college
    const { data: departments, error: deptError } = await adminSupabase
      .from('departments')
      .select('id, name, code')
      .eq('college_id', profile.college_id)

    if (deptError) throw deptError

    // Fetch all completed generations with subject + department info
    const { data: genRows, error: genError } = await adminSupabase
      .from('content_generations')
      .select('id, subject_id, subjects(id, name, code, semester, department_id, departments(id, name, code))')
      .eq('college_id', profile.college_id)
      .eq('status', 'completed')

    if (genError) throw genError

    // Fetch credit ledger rows for content_generation
    const { data: creditRows, error: creditError } = await adminSupabase
      .from('credit_ledger')
      .select('user_id, amount, reason')
      .eq('college_id', profile.college_id)
      .eq('reason', 'content_generation')

    if (creditError) throw creditError

    // Fetch completed generations with user info for top lecturers
    const { data: lecturerGens, error: lecError } = await adminSupabase
      .from('content_generations')
      .select('user_id, created_at, users(id, name, email)')
      .eq('college_id', profile.college_id)
      .eq('status', 'completed')

    if (lecError) throw lecError

    // --- Group by department ---
    const deptMap = {}

    // Pre-populate all departments with zero counts
    for (const dept of (departments ?? [])) {
      deptMap[dept.id] = {
        dept_id: dept.id,
        dept_name: dept.name,
        dept_code: dept.code,
        total_generations: 0,
        credits_used: 0,
      }
    }

    // Count generations per department
    for (const row of (genRows ?? [])) {
      const dept = row.subjects?.departments
      if (!dept) continue
      if (!deptMap[dept.id]) {
        deptMap[dept.id] = {
          dept_id: dept.id,
          dept_name: dept.name,
          dept_code: dept.code,
          total_generations: 0,
          credits_used: 0,
        }
      }
      deptMap[dept.id].total_generations += 1
    }

    // Count credits used (negative amounts = spent; sum absolute values)
    for (const row of (creditRows ?? [])) {
      // credits_used is counted per generation == 1 debit each
      // We simply count generation credits by matching generation count
      // (credit_ledger amounts are negative for debits)
    }
    // Simpler: use total_generations as credits_used since each generation costs 1 credit
    for (const dept of Object.values(deptMap)) {
      dept.credits_used = dept.total_generations
    }

    const by_department = Object.values(deptMap).sort(
      (a, b) => b.total_generations - a.total_generations
    )

    // --- Top subjects ---
    const subjectMap = {}
    for (const row of (genRows ?? [])) {
      const subj = row.subjects
      if (!subj) continue
      if (!subjectMap[subj.id]) {
        subjectMap[subj.id] = {
          subject_id: subj.id,
          subject_name: subj.name,
          subject_code: subj.code ?? null,
          semester: subj.semester ?? null,
          generation_count: 0,
        }
      }
      subjectMap[subj.id].generation_count += 1
    }

    const top_subjects = Object.values(subjectMap)
      .sort((a, b) => b.generation_count - a.generation_count)
      .slice(0, 10)

    // --- Top lecturers ---
    const lecturerMap = {}
    for (const row of (lecturerGens ?? [])) {
      if (!row.user_id) continue
      if (!lecturerMap[row.user_id]) {
        lecturerMap[row.user_id] = {
          user_id: row.user_id,
          name: row.users?.name ?? null,
          email: row.users?.email ?? null,
          generation_count: 0,
          last_active: null,
        }
      }
      lecturerMap[row.user_id].generation_count += 1
      const ts = row.created_at
      if (!lecturerMap[row.user_id].last_active || ts > lecturerMap[row.user_id].last_active) {
        lecturerMap[row.user_id].last_active = ts
      }
    }

    const top_lecturers = Object.values(lecturerMap)
      .sort((a, b) => b.generation_count - a.generation_count)
      .slice(0, 5)

    return Response.json({ by_department, top_subjects, top_lecturers })
  } catch (err) {
    console.error('[analytics/departments]', err)
    return Response.json({ error: 'Failed to load department analytics', code: 'ANALYTICS_ERROR' }, { status: 500 })
  }
}
