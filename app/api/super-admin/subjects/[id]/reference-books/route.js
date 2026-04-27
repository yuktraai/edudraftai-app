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

const createSchema = z.object({
  title:        z.string().min(1).max(200),
  author:       z.string().min(1).max(200),
  edition:      z.string().max(100).optional().nullable(),
  publisher:    z.string().max(200).optional().nullable(),
  chapter_hint: z.string().max(500).optional().nullable(),
  is_primary:   z.boolean().optional().default(false),
})

// GET /api/super-admin/subjects/[id]/reference-books
// Returns all reference books for a subject
export async function GET(request, { params }) {
  try {
    const user = await verifySuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = params

    const { data, error } = await adminSupabase
      .from('subject_reference_books')
      .select('id, title, author, edition, publisher, chapter_hint, is_primary, created_at')
      .eq('subject_id', id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('[GET reference-books]', error.message)
      return Response.json({ error: 'Failed to fetch reference books' }, { status: 500 })
    }

    return Response.json({ data: data ?? [] })
  } catch (err) {
    logger.error('[GET reference-books]', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/super-admin/subjects/[id]/reference-books
// Creates a new reference book for a subject
export async function POST(request, { params }) {
  try {
    const user = await verifySuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { id: subject_id } = params

    // Verify subject exists
    const { data: subject } = await adminSupabase
      .from('subjects').select('id').eq('id', subject_id).single()
    if (!subject) return Response.json({ error: 'Subject not found' }, { status: 404 })

    let body
    try { body = await request.json() } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const bookData = { ...parsed.data, subject_id }

    // If marking as primary, clear existing primary first
    if (bookData.is_primary) {
      await adminSupabase
        .from('subject_reference_books')
        .update({ is_primary: false })
        .eq('subject_id', subject_id)
    }

    const { data, error } = await adminSupabase
      .from('subject_reference_books')
      .insert(bookData)
      .select()
      .single()

    if (error) {
      logger.error('[POST reference-books]', error.message)
      return Response.json({ error: 'Failed to create reference book' }, { status: 500 })
    }

    return Response.json({ data }, { status: 201 })
  } catch (err) {
    logger.error('[POST reference-books]', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
