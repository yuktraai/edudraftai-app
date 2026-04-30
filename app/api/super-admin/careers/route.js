import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

async function verifySuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'super_admin' ? user : null
}

// GET /api/super-admin/careers — list ALL jobs (active + inactive) with application counts
export async function GET() {
  const user = await verifySuperAdmin()
  if (!user) return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })

  try {
    const { data: jobs, error } = await adminSupabase
      .from('job_postings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('GET /api/super-admin/careers — db error', error)
      return Response.json({ error: 'Failed to fetch jobs', code: 'DB_ERROR' }, { status: 500 })
    }

    // Fetch application counts per job
    const jobIds = (jobs ?? []).map(j => j.id)
    let countMap = {}
    if (jobIds.length) {
      const { data: counts } = await adminSupabase
        .from('job_applications')
        .select('job_id')
        .in('job_id', jobIds)

      for (const row of counts ?? []) {
        countMap[row.job_id] = (countMap[row.job_id] ?? 0) + 1
      }
    }

    const enriched = (jobs ?? []).map(j => ({
      ...j,
      application_count: countMap[j.id] ?? 0,
    }))

    return Response.json({ data: enriched })
  } catch (err) {
    logger.error('GET /api/super-admin/careers — unexpected', err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// POST /api/super-admin/careers — create new job posting
export async function POST(request) {
  const user = await verifySuperAdmin()
  if (!user) return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })

  try {
    const body = await request.json()
    const { title, department, location, type, experience, description, responsibilities, requirements, is_active } = body

    // Validate required fields
    const missing = ['title', 'department', 'location', 'type', 'experience', 'description']
      .filter(f => !body[f]?.toString().trim())
    if (missing.length) {
      return Response.json(
        { error: `Missing required fields: ${missing.join(', ')}`, code: 'VALIDATION_ERROR' },
        { status: 422 }
      )
    }

    const { data, error } = await adminSupabase
      .from('job_postings')
      .insert({
        title:            title.trim(),
        department:       department.trim(),
        location:         location.trim(),
        type:             type.trim(),
        experience:       experience.trim(),
        description:      description.trim(),
        responsibilities: Array.isArray(responsibilities) ? responsibilities.filter(Boolean) : [],
        requirements:     Array.isArray(requirements)     ? requirements.filter(Boolean)     : [],
        is_active:        is_active === true,
      })
      .select('*')
      .single()

    if (error) {
      logger.error('POST /api/super-admin/careers — insert error', error)
      return Response.json({ error: 'Failed to create job posting', code: 'DB_ERROR' }, { status: 500 })
    }

    return Response.json({ data }, { status: 201 })
  } catch (err) {
    logger.error('POST /api/super-admin/careers — unexpected', err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
