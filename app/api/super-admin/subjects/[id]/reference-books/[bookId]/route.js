import { adminSupabase } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { z } from 'zod'

async function verifySuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await adminSupabase
    .from('users').select('role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? user : null
}

const patchSchema = z.object({
  title:        z.string().min(1).max(200).optional(),
  author:       z.string().min(1).max(200).optional(),
  edition:      z.string().max(100).nullable().optional(),
  publisher:    z.string().max(200).nullable().optional(),
  chapter_hint: z.string().max(500).nullable().optional(),
  is_primary:   z.boolean().optional(),
})

// PATCH /api/super-admin/subjects/[id]/reference-books/[bookId]
export async function PATCH(request, { params }) {
  try {
    const user = await verifySuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { id: subject_id, bookId } = params

    let body
    try { body = await request.json() } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    // If marking as primary, clear existing primary first
    if (parsed.data.is_primary) {
      await adminSupabase
        .from('subject_reference_books')
        .update({ is_primary: false })
        .eq('subject_id', subject_id)
    }

    const { data, error } = await adminSupabase
      .from('subject_reference_books')
      .update({ ...parsed.data })
      .eq('id', bookId)
      .eq('subject_id', subject_id)
      .select()
      .single()

    if (error) {
      logger.error('[PATCH reference-books/[bookId]]', error.message)
      return Response.json({ error: 'Failed to update' }, { status: 500 })
    }

    return Response.json({ data })
  } catch (err) {
    logger.error('[PATCH reference-books/[bookId]]', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/super-admin/subjects/[id]/reference-books/[bookId]
export async function DELETE(request, { params }) {
  try {
    const user = await verifySuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { id: subject_id, bookId } = params

    const { error } = await adminSupabase
      .from('subject_reference_books')
      .delete()
      .eq('id', bookId)
      .eq('subject_id', subject_id)

    if (error) {
      logger.error('[DELETE reference-books/[bookId]]', error.message)
      return Response.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    logger.error('[DELETE reference-books/[bookId]]', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
