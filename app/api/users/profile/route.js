import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const preferencesSchema = z.object({
  default_difficulty:     z.enum(['easy', 'medium', 'hard']).optional(),
  default_mcq_count:      z.number().int().min(5).max(50).optional(),
  default_question_count: z.number().int().min(5).max(50).optional(),
  email_notifications: z.object({
    credit_allocated:  z.boolean().optional(),
    credit_low:        z.boolean().optional(),
    generation_failed: z.boolean().optional(),
  }).optional(),
}).optional()

const schema = z.object({
  name:        z.string().min(1).max(100).optional(),
  preferences: preferencesSchema,
})

export async function PATCH(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    // Fetch existing preferences to merge (not replace)
    const { data: existing } = await adminSupabase
      .from('users').select('preferences').eq('id', user.id).single()

    const mergedPreferences = {
      ...(existing?.preferences ?? {}),
      ...(parsed.data.preferences ?? {}),
      email_notifications: {
        ...((existing?.preferences?.email_notifications) ?? {}),
        ...((parsed.data.preferences?.email_notifications) ?? {}),
      },
    }

    const updates = {}
    if (parsed.data.name)        updates.name = parsed.data.name
    if (parsed.data.preferences) updates.preferences = mergedPreferences

    if (Object.keys(updates).length === 0)
      return Response.json({ error: 'Nothing to update' }, { status: 400 })

    const { error } = await adminSupabase.from('users').update(updates).eq('id', user.id)
    if (error) throw error

    return Response.json({ success: true, preferences: mergedPreferences })
  } catch (err) {
    logger.error('[PATCH /api/users/profile]', err)
    return Response.json({ error: 'Update failed', code: err.message }, { status: 500 })
  }
}
