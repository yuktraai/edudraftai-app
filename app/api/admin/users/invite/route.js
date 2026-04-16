import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminProfile } = await supabase
      .from('users').select('role, college_id, name').eq('id', user.id).single()

    if (!['college_admin', 'super_admin'].includes(adminProfile?.role))
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    if (!adminProfile.college_id)
      return Response.json({ error: 'Your account is not assigned to a college', code: 'NO_COLLEGE' }, { status: 400 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { email } = parsed.data

    // Check if already a member of this college
    const { data: existingUser } = await adminSupabase
      .from('users').select('id, college_id, is_active').eq('email', email).single()

    if (existingUser?.college_id === adminProfile.college_id)
      return Response.json({ error: 'This user is already a member of your college', code: 'ALREADY_MEMBER' }, { status: 409 })

    // Invite via Supabase Auth (creates auth.users row, sends invite email via Resend/SMTP)
    const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
      data: { college_id: adminProfile.college_id },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    })

    if (inviteError) {
      // If user already exists in auth, we get an error — handle gracefully
      logger.error('[invite] auth invite error', inviteError)
      return Response.json({ error: inviteError.message, code: 'INVITE_FAILED' }, { status: 400 })
    }

    const newUserId = inviteData.user?.id

    if (newUserId) {
      // Upsert public.users — pre-create profile so they land on dashboard (not onboarding)
      await adminSupabase.from('users').upsert({
        id:         newUserId,
        name:       email.split('@')[0],   // placeholder name — they can update in profile
        email:      email,
        role:       'lecturer',
        is_active:  true,
        college_id: adminProfile.college_id,
      }, { onConflict: 'id' })
    }

    return Response.json({ data: { ok: true, email } }, { status: 201 })
  } catch (error) {
    logger.error('[POST /api/admin/users/invite]', error)
    return Response.json({ error: 'Internal server error', code: error.message }, { status: 500 })
  }
}
