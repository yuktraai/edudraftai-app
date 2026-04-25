import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// POST /api/drafts/[id]/share — generate a 7-day share link
export async function POST(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: gen, error: fetchError } = await adminSupabase
      .from('content_generations')
      .select('id, user_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !gen) return Response.json({ error: 'Draft not found' }, { status: 404 })
    if (gen.user_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const token = crypto.randomUUID()
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error: updateError } = await adminSupabase
      .from('content_generations')
      .update({ share_token: token, share_expires_at: expiry })
      .eq('id', params.id)

    if (updateError) throw updateError

    return Response.json({
      share_url: `${process.env.NEXT_PUBLIC_APP_URL}/shared/${token}`,
      expires_at: expiry,
    })
  } catch (err) {
    logger.error('[POST /api/drafts/[id]/share]', err)
    return Response.json({ error: 'Failed to generate share link', code: err.message }, { status: 500 })
  }
}

// DELETE /api/drafts/[id]/share — revoke share link
export async function DELETE(request, { params }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: gen, error: fetchError } = await adminSupabase
      .from('content_generations')
      .select('id, user_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !gen) return Response.json({ error: 'Draft not found' }, { status: 404 })
    if (gen.user_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { error: updateError } = await adminSupabase
      .from('content_generations')
      .update({ share_token: null, share_expires_at: null })
      .eq('id', params.id)

    if (updateError) throw updateError

    return Response.json({ success: true })
  } catch (err) {
    logger.error('[DELETE /api/drafts/[id]/share]', err)
    return Response.json({ error: 'Failed to revoke share link', code: err.message }, { status: 500 })
  }
}
