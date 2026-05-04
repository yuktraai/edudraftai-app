/**
 * Phase 52.1 — /api/super-admin/canonical-ref-books/[id]
 *
 * PATCH  → update a canonical reference book (title, author, edition, publisher, chapter_hint, is_primary)
 * DELETE → delete a canonical reference book
 *
 * super_admin only. No Pinecone or Storage cleanup — books are metadata only.
 */

import { createClient }   from '@/lib/supabase/server'
import { adminSupabase }  from '@/lib/supabase/admin'
import { logger }         from '@/lib/logger'

async function verifySuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await adminSupabase
    .from('users').select('role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? user : null
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(request, { params }) {
  try {
    const user = await verifySuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = params
    const body = await request.json()
    const { title, author, edition, publisher, chapter_hint, is_primary } = body

    // Fetch existing book to get subject_code for primary promotion
    const { data: existing } = await adminSupabase
      .from('canonical_reference_books')
      .select('id, subject_code')
      .eq('id', id)
      .single()

    if (!existing) return Response.json({ error: 'Book not found' }, { status: 404 })

    // If promoting to primary — clear any existing primary for this code first
    if (is_primary) {
      await adminSupabase
        .from('canonical_reference_books')
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq('subject_code', existing.subject_code)
        .eq('is_primary', true)
        .neq('id', id)
    }

    const updates = { updated_at: new Date().toISOString() }
    if (title        !== undefined) updates.title        = title.trim()
    if (author       !== undefined) updates.author       = author.trim()
    if (edition      !== undefined) updates.edition      = edition?.trim() || null
    if (publisher    !== undefined) updates.publisher    = publisher?.trim() || null
    if (chapter_hint !== undefined) updates.chapter_hint = chapter_hint?.trim() || null
    if (is_primary   !== undefined) updates.is_primary   = is_primary

    const { data: book, error } = await adminSupabase
      .from('canonical_reference_books')
      .update(updates)
      .eq('id', id)
      .select('id, title, author, edition, publisher, chapter_hint, is_primary, created_at')
      .single()

    if (error) throw error
    return Response.json({ book })
  } catch (err) {
    logger.error('[PATCH /api/super-admin/canonical-ref-books/[id]]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const user = await verifySuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = params

    const { error } = await adminSupabase
      .from('canonical_reference_books')
      .delete()
      .eq('id', id)

    if (error) throw error
    return Response.json({ message: 'Reference book deleted' })
  } catch (err) {
    logger.error('[DELETE /api/super-admin/canonical-ref-books/[id]]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
