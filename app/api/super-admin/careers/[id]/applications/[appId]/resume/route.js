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

// GET /api/super-admin/careers/[id]/applications/[appId]/resume
// Returns a 60-minute signed URL for the applicant's resume
export async function GET(request, { params }) {
  const user = await verifySuperAdmin()
  if (!user) return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })

  const { id: jobId, appId } = params

  try {
    // Fetch the application to get the resume_path
    const { data: application, error: appError } = await adminSupabase
      .from('job_applications')
      .select('id, resume_path')
      .eq('id', appId)
      .eq('job_id', jobId)
      .single()

    if (appError || !application) {
      return Response.json({ error: 'Application not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    if (!application.resume_path) {
      return Response.json({ error: 'No resume on file', code: 'NO_RESUME' }, { status: 404 })
    }

    // Generate a 60-minute signed URL
    const { data: signed, error: signError } = await adminSupabase
      .storage
      .from('resumes')
      .createSignedUrl(application.resume_path, 3600)

    if (signError || !signed?.signedUrl) {
      logger.error(`GET resume signed URL — storage error`, signError)
      return Response.json(
        { error: 'Failed to generate download link', code: 'STORAGE_ERROR' },
        { status: 500 }
      )
    }

    return Response.json({ signedUrl: signed.signedUrl })
  } catch (err) {
    logger.error(`GET /api/super-admin/careers/${jobId}/applications/${appId}/resume — unexpected`, err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
