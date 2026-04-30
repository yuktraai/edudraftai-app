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

// PUT /api/super-admin/careers/[id] — update job posting
export async function PUT(request, { params }) {
  const user = await verifySuperAdmin()
  if (!user) return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })

  const { id } = params

  try {
    const body = await request.json()

    // Build update payload — only include provided fields
    const update = {}
    if (body.title        !== undefined) update.title            = body.title.trim()
    if (body.department   !== undefined) update.department       = body.department.trim()
    if (body.location     !== undefined) update.location         = body.location.trim()
    if (body.type         !== undefined) update.type             = body.type.trim()
    if (body.experience   !== undefined) update.experience       = body.experience.trim()
    if (body.description  !== undefined) update.description      = body.description.trim()
    if (body.responsibilities !== undefined) update.responsibilities = Array.isArray(body.responsibilities)
      ? body.responsibilities.filter(Boolean) : []
    if (body.requirements !== undefined) update.requirements     = Array.isArray(body.requirements)
      ? body.requirements.filter(Boolean) : []
    if (body.is_active    !== undefined) update.is_active        = Boolean(body.is_active)

    if (!Object.keys(update).length) {
      return Response.json({ error: 'No fields to update', code: 'VALIDATION_ERROR' }, { status: 422 })
    }

    const { data, error } = await adminSupabase
      .from('job_postings')
      .update(update)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      logger.error(`PUT /api/super-admin/careers/${id} — error`, error)
      return Response.json({ error: 'Failed to update job posting', code: 'DB_ERROR' }, { status: 500 })
    }

    return Response.json({ data })
  } catch (err) {
    logger.error(`PUT /api/super-admin/careers/${id} — unexpected`, err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// DELETE /api/super-admin/careers/[id] — delete job posting (also cascades applications)
export async function DELETE(request, { params }) {
  const user = await verifySuperAdmin()
  if (!user) return Response.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 })

  const { id } = params

  try {
    const { error } = await adminSupabase
      .from('job_postings')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error(`DELETE /api/super-admin/careers/${id} — error`, error)
      return Response.json({ error: 'Failed to delete job posting', code: 'DB_ERROR' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    logger.error(`DELETE /api/super-admin/careers/${id} — unexpected`, err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
