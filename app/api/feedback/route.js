import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const schema = z.object({
  generation_id: z.string().uuid(),
  rating:        z.enum(['thumbs_up', 'thumbs_down']).nullable(),
  feedback_text: z.string().max(150).optional().nullable(),
})

export async function GET(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const generationId = searchParams.get('generation_id')
    if (!generationId) return Response.json({ data: null })

    const { data } = await adminSupabase
      .from('content_feedback')
      .select('rating, feedback_text')
      .eq('generation_id', generationId)
      .eq('user_id', user.id)
      .single()

    return Response.json({ data: data ?? null })
  } catch (err) {
    logger.error('[feedback GET]', err)
    return Response.json({ data: null })
  }
}

export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body   = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { generation_id, rating, feedback_text } = parsed.data

    const { data: profile } = await adminSupabase
      .from('users')
      .select('college_id')
      .eq('id', user.id)
      .single()

    // Verify the generation belongs to this user
    const { data: generation } = await adminSupabase
      .from('content_generations')
      .select('id, college_id, subject_id, content_type, user_id')
      .eq('id', generation_id)
      .single()

    if (!generation || generation.user_id !== user.id) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    if (rating === null) {
      // Remove rating
      await adminSupabase
        .from('content_feedback')
        .delete()
        .eq('generation_id', generation_id)
        .eq('user_id', user.id)
    } else {
      // Upsert rating
      await adminSupabase
        .from('content_feedback')
        .upsert({
          generation_id,
          user_id:      user.id,
          college_id:   generation.college_id ?? profile?.college_id,
          rating,
          feedback_text: feedback_text ?? null,
          content_type:  generation.content_type,
          subject_id:    generation.subject_id,
          updated_at:    new Date().toISOString(),
        }, { onConflict: 'generation_id,user_id' })
    }

    return Response.json({ data: { success: true } })
  } catch (err) {
    logger.error('[feedback POST]', err)
    return Response.json({ error: 'Failed to save feedback' }, { status: 500 })
  }
}
