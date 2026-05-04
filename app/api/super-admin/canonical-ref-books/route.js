/**
 * Phase 52.1 — /api/super-admin/canonical-ref-books
 *
 * GET  ?code=TH2  → list all reference books for a subject code
 * POST            → add a new reference book for a subject code
 *
 * super_admin only. Books are keyed by SCTEVT subject code, shared across all colleges.
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

// ── GET ?code=TH2 ─────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const user = await verifySuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')?.trim().toUpperCase()
    if (!code) return Response.json({ error: 'code query parameter required' }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('canonical_reference_books')
      .select('id, title, author, edition, publisher, chapter_hint, is_primary, created_at')
      .eq('subject_code', code)
      .order('is_primary', { ascending: false })
      .order('created_at',  { ascending: true })

    if (error) throw error
    return Response.json({ books: data ?? [] })
  } catch (err) {
    logger.error('[GET /api/super-admin/canonical-ref-books]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const user = await verifySuperAdmin()
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { subject_code, title, author, edition, publisher, chapter_hint, is_primary } = body

    if (!subject_code || !title?.trim() || !author?.trim())
      return Response.json({ error: 'subject_code, title, and author are required' }, { status: 400 })

    const code = subject_code.trim().toUpperCase()

    // Verify subject code exists in the system
    const { data: codeCheck } = await adminSupabase
      .from('subjects').select('id').ilike('code', code).limit(1).maybeSingle()
    if (!codeCheck)
      return Response.json({ error: `Subject code "${code}" not found in any college.` }, { status: 404 })

    // If setting as primary — clear any existing primary for this code first
    if (is_primary) {
      await adminSupabase
        .from('canonical_reference_books')
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq('subject_code', code)
        .eq('is_primary', true)
    }

    const { data: book, error: insertErr } = await adminSupabase
      .from('canonical_reference_books')
      .insert({
        subject_code:  code,
        title:         title.trim(),
        author:        author.trim(),
        edition:       edition?.trim() || null,
        publisher:     publisher?.trim() || null,
        chapter_hint:  chapter_hint?.trim() || null,
        is_primary:    is_primary ?? false,
      })
      .select('id, title, author, edition, publisher, chapter_hint, is_primary, created_at')
      .single()

    if (insertErr) throw insertErr
    return Response.json({ book }, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/super-admin/canonical-ref-books]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
