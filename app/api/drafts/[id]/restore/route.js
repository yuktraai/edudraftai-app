import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const schema = z.object({
  versionId: z.string().uuid(),
})

// POST /api/drafts/[id]/restore
// Body: { versionId: uuid }
// Restores a previous version — saves a new version row and updates the draft content
export async function POST(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { id } = params

    let body
    try { body = await request.json() } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { versionId } = parsed.data

    // Verify draft ownership + get current version number
    const { data: draft } = await adminSupabase
      .from('content_generations')
      .select('id, current_version')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 })

    // Fetch the target version (must belong to this draft)
    const { data: targetVersion } = await adminSupabase
      .from('draft_versions')
      .select('id, version_number, content')
      .eq('id', versionId)
      .eq('draft_id', id)
      .single()

    if (!targetVersion) return Response.json({ error: 'Version not found' }, { status: 404 })

    const nextVersion = (draft.current_version ?? 1) + 1

    // Insert a new version row recording the restore
    const { error: insertErr } = await adminSupabase
      .from('draft_versions')
      .insert({
        draft_id:       id,
        version_number: nextVersion,
        content:        targetVersion.content,
        instruction:    `Restored from v${targetVersion.version_number}`,
      })

    if (insertErr) {
      logger.error('[POST /drafts/[id]/restore] version insert', insertErr.message)
      return Response.json({ error: 'Failed to save restore version' }, { status: 500 })
    }

    // Update the draft with the restored content
    const { error: updateErr } = await adminSupabase
      .from('content_generations')
      .update({
        raw_output:      targetVersion.content,
        current_version: nextVersion,
        updated_at:      new Date().toISOString(),
      })
      .eq('id', id)

    if (updateErr) {
      logger.error('[POST /drafts/[id]/restore] draft update', updateErr.message)
      return Response.json({ error: 'Failed to restore draft content' }, { status: 500 })
    }

    return Response.json({ success: true, restoredFrom: targetVersion.version_number, newVersion: nextVersion })
  } catch (err) {
    logger.error('[POST /drafts/[id]/restore]', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
