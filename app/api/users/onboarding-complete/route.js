// PATCH /api/users/onboarding-complete
// Sets onboarding_completed = true for the current user.
// Uses adminSupabase to bypass RLS.

import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export async function PATCH() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized', code: 'NOT_AUTHENTICATED' }, { status: 401 })
    }

    const { error } = await adminSupabase
      .from('users')
      .update({ onboarding_completed: true })
      .eq('id', user.id)

    if (error) {
      logger.error('[/api/users/onboarding-complete] update error', error)
      return Response.json({ error: error.message, code: 'UPDATE_FAILED' }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (err) {
    logger.error('[/api/users/onboarding-complete] unexpected error', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
