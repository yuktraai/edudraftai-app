import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/drafts/[id]/versions
// Returns all versions of a draft ordered by version_number ASC
// Auth: user must own the draft
export async function GET(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { id } = params

    // Verify ownership
    const { data: draft } = await adminSupabase
      .from('content_generations')
      .select('id, current_version')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 })

    const { data: versions, error } = await adminSupabase
      .from('draft_versions')
      .select('id, version_number, instruction, created_at')
      .eq('draft_id', id)
      .order('version_number', { ascending: true })

    if (error) {
      logger.error('[GET /drafts/[id]/versions]', error.message)
      return Response.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }

    return Response.json({ versions: versions ?? [], currentVersion: draft.current_version })
  } catch (err) {
    logger.error('[GET /drafts/[id]/versions]', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
