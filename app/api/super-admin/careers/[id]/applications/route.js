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

// GET /api/super-admin/careers/[id]/applications — all applications for a job
export async function GET(request, { params }) {
  const user = await verifySuperAdmin()
  if (!user) return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })

  const { id: jobId } = params

  try {
    // Verify job exists
    const { data: job } = await adminSupabase
      .from('job_postings')
      .select('id, title')
      .eq('id', jobId)
      .single()

    if (!job) {
      return Response.json({ error: 'Job not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    const { data: applications, error } = await adminSupabase
      .from('job_applications')
      .select('id, full_name, email, phone, applicant_role, resume_path, status, applied_at, notes')
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false })

    if (error) {
      logger.error(`GET /api/super-admin/careers/${jobId}/applications — db error`, error)
      return Response.json({ error: 'Failed to fetch applications', code: 'DB_ERROR' }, { status: 500 })
    }

    return Response.json({ job, data: applications ?? [] })
  } catch (err) {
    logger.error(`GET /api/super-admin/careers/${jobId}/applications — unexpected`, err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
