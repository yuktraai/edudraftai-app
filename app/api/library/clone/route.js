import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const schema = z.object({
  source_draft_id: z.string().uuid(),
})

// POST /api/library/clone  { source_draft_id }
// Clones a published draft into the current user's drafts (costs 0 credits)
export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('college_id')
      .eq('id', user.id)
      .single()

    const body   = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 })

    const { source_draft_id } = parsed.data

    // Fetch the source draft — must be published and from the same college
    // Include clone_count so we can safely increment it
    const { data: source, error: srcErr } = await adminSupabase
      .from('content_generations')
      .select('id, content_type, subject_id, syllabus_chunk_id, prompt_params, raw_output, college_id, clone_count')
      .eq('id', source_draft_id)
      .eq('is_published', true)
      .eq('status', 'completed')
      .single()

    if (srcErr || !source) return Response.json({ error: 'Draft not found or not published' }, { status: 404 })
    if (source.college_id !== profile.college_id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Insert cloned draft into content_generations
    const { data: cloned, error: insertErr } = await adminSupabase
      .from('content_generations')
      .insert({
        user_id:           user.id,
        college_id:        profile.college_id,
        subject_id:        source.subject_id,
        syllabus_chunk_id: source.syllabus_chunk_id,
        content_type:      source.content_type,
        prompt_params:     source.prompt_params,
        raw_output:        source.raw_output,
        ai_model:          'cloned',
        credits_used:      0,
        status:            'completed',
        current_version:   1,
      })
      .select('id')
      .single()

    if (insertErr) throw insertErr

    // Record in draft_clones (non-fatal)
    const { error: cloneRecordErr } = await adminSupabase
      .from('draft_clones')
      .insert({
        source_draft_id,
        cloned_by:       user.id,
        cloned_draft_id: cloned.id,
      })
    if (cloneRecordErr) logger.error('[clone] draft_clones insert failed', cloneRecordErr)

    // Increment clone_count on source — direct update, fully non-fatal
    const newCount = (source.clone_count ?? 0) + 1
    const { error: incErr } = await adminSupabase
      .from('content_generations')
      .update({ clone_count: newCount })
      .eq('id', source_draft_id)
    if (incErr) logger.error('[clone] clone_count increment failed', incErr)

    return Response.json({ cloned_draft_id: cloned.id }, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/library/clone]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
