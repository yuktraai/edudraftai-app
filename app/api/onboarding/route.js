import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
})

export async function POST(request) {
  try {
    // 1. Verify the user is authenticated
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized', code: 'NOT_AUTHENTICATED' }, { status: 401 })
    }

    // 2. Validate input
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    // 3. Check if a profile row already exists (prevent duplicate insert)
    const { data: existing } = await adminSupabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existing) {
      return Response.json({ error: 'Profile already exists', code: 'ALREADY_EXISTS' }, { status: 409 })
    }

    // 4. Insert using the service-role client (bypasses RLS safely on the server)
    const { error: insertError } = await adminSupabase.from('users').insert({
      id:         user.id,
      name:       parsed.data.name,
      email:      user.email,
      role:       'lecturer',   // default — promoted by admin later
      is_active:  true,
      college_id: null,         // assigned by college admin
    })

    if (insertError) {
      logger.error('[/api/onboarding] insert error', insertError)
      return Response.json({ error: insertError.message, code: 'INSERT_FAILED' }, { status: 500 })
    }

    return Response.json({ data: { ok: true } }, { status: 200 })
  } catch (error) {
    logger.error('[/api/onboarding] unexpected error', error)
    return Response.json({ error: 'Internal server error', code: error.message }, { status: 500 })
  }
}
