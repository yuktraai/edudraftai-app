import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

async function verifySuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? user : null
}

// GET /api/super-admin/college-pilot/[id]/logo — return 60-min signed URL
export async function GET(request, { params }) {
  const user = await verifySuperAdmin()
  if (!user) return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })

  const { id } = params

  try {
    const { data: record, error: recErr } = await adminSupabase
      .from('college_pilot_requests')
      .select('id, logo_path, college_name')
      .eq('id', id)
      .single()

    if (recErr || !record) {
      return Response.json({ error: 'Request not found', code: 'NOT_FOUND' }, { status: 404 })
    }
    if (!record.logo_path) {
      return Response.json({ error: 'No logo on file', code: 'NO_LOGO' }, { status: 404 })
    }

    const { data: signed, error: signErr } = await adminSupabase
      .storage.from('college-logos')
      .createSignedUrl(record.logo_path, 3600)

    if (signErr || !signed?.signedUrl) {
      logger.error(`GET logo signed URL for ${id} — storage error`, signErr)
      return Response.json({ error: 'Failed to generate download link', code: 'STORAGE_ERROR' }, { status: 500 })
    }

    return Response.json({ signedUrl: signed.signedUrl, collegeName: record.college_name })
  } catch (err) {
    logger.error(`GET /api/super-admin/college-pilot/${id}/logo — unexpected`, err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
