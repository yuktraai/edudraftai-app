import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['pending', 'in_progress', 'selected', 'rejected']

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

// PUT /api/super-admin/careers/[id]/applications/[appId] — update status and/or notes
export async function PUT(request, { params }) {
  const user = await verifySuperAdmin()
  if (!user) return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })

  const { id: jobId, appId } = params

  try {
    const body = await request.json()
    const update = {}

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return Response.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, code: 'VALIDATION_ERROR' },
          { status: 422 }
        )
      }
      update.status = body.status
    }

    if (body.notes !== undefined) {
      update.notes = body.notes === '' ? null : body.notes.toString().trim()
    }

    if (!Object.keys(update).length) {
      return Response.json({ error: 'No fields to update', code: 'VALIDATION_ERROR' }, { status: 422 })
    }

    const { data, error } = await adminSupabase
      .from('job_applications')
      .update(update)
      .eq('id', appId)
      .eq('job_id', jobId)
      .select('id, status, notes')
      .single()

    if (error || !data) {
      logger.error(`PUT /api/super-admin/careers/${jobId}/applications/${appId} — error`, error)
      return Response.json({ error: 'Failed to update application', code: 'DB_ERROR' }, { status: 500 })
    }

    return Response.json({ data })
  } catch (err) {
    logger.error(`PUT /api/super-admin/careers/${jobId}/applications/${appId} — unexpected`, err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
