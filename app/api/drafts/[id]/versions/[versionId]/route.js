import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// GET /api/drafts/[id]/versions/[versionId]
// Returns full content of a specific version (ownership-verified)
export async function GET(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { id, versionId } = params

    // Verify draft ownership
    const { data: draft } = await adminSupabase
      .from('content_generations')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 })

    const { data: version, error } = await adminSupabase
      .from('draft_versions')
      .select('id, version_number, content, instruction, created_at')
      .eq('id', versionId)
      .eq('draft_id', id)
      .single()

    if (error || !version) return Response.json({ error: 'Version not found' }, { status: 404 })

    return Response.json({ content: version.content, version })
  } catch (err) {
    logger.error('[GET /drafts/[id]/versions/[versionId]]', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
