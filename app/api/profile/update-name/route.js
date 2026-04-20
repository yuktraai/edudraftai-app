/**
 * PATCH /api/profile/update-name
 *
 * Available to all authenticated roles (lecturer, college_admin, super_admin).
 * Updates the current user's display name in public.users.
 *
 * Body: { name: string }
 */

import { createClient }  from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger }        from '@/lib/logger'

export async function PATCH(request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  let body
  try { body = await request.json() }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const name = (body.name ?? '').trim()

  if (!name)
    return Response.json({ error: 'Name cannot be empty' }, { status: 400 })

  if (name.length > 100)
    return Response.json({ error: 'Name must be 100 characters or fewer' }, { status: 400 })

  const { data, error } = await adminSupabase
    .from('users')
    .update({ name })
    .eq('id', user.id)
    .select('id, name')
    .single()

  if (error) {
    logger.error('[PATCH /api/profile/update-name]', error)
    return Response.json({ error: 'Failed to update name' }, { status: 500 })
  }

  return Response.json({ data })
}
