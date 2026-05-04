/**
 * Phase 51.3 — GET /api/super-admin/canonical-rag/subject-codes
 *
 * Returns all distinct SCTEVT subject codes from the subjects table.
 * super_admin only. Used to populate the subject code selector in canonical-docs UI.
 */

import { createClient }   from '@/lib/supabase/server'
import { adminSupabase }  from '@/lib/supabase/admin'
import { logger }         from '@/lib/logger'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin')
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await adminSupabase
      .from('subjects')
      .select('code, name')
      .not('code', 'is', null)
      .order('code')

    if (error) throw error

    // Deduplicate by normalized UPPER(code)
    const seen  = new Set()
    const codes = []
    for (const row of data ?? []) {
      const key = row.code?.trim().toUpperCase()
      if (key && !seen.has(key)) {
        seen.add(key)
        codes.push({ code: key, name: row.name })
      }
    }

    return Response.json({ codes })
  } catch (err) {
    logger.error('[GET /api/super-admin/canonical-rag/subject-codes]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
