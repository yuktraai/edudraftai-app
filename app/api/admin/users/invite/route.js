import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const schema = z.object({
  email:      z.string().email(),
  college_id: z.string().uuid().optional(),  // super_admin can specify target college
  role:       z.enum(['lecturer', 'college_admin']).optional().default('lecturer'),
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

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { email, role: inviteRole } = parsed.data

    // Determine which college this invite is for:
    // - super_admin: use college_id from request body (required)
    // - college_admin: always use their own college_id
    let targetCollegeId = adminProfile.college_id
    if (adminProfile.role === 'super_admin') {
      targetCollegeId = parsed.data.college_id ?? null
      if (!targetCollegeId)
        return Response.json({ error: 'college_id is required for super_admin invite', code: 'NO_COLLEGE' }, { status: 400 })
    } else {
      if (!targetCollegeId)
        return Response.json({ error: 'Your account is not assigned to a college', code: 'NO_COLLEGE' }, { status: 400 })
    }

    // Check if already a member of this college
    const { data: existingUser } = await adminSupabase
      .from('users').select('id, college_id, is_active').eq('email', email).single()

    if (existingUser?.college_id === targetCollegeId)
      return Response.json({ error: 'This user is already a member of this college', code: 'ALREADY_MEMBER' }, { status: 409 })

    // Invite via Supabase Auth (creates auth.users row, sends invite email via Resend/SMTP)
    const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
      data: { college_id: targetCollegeId },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')}/auth/callback`,
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
        role:       inviteRole ?? 'lecturer',
        is_active:  true,
        college_id: targetCollegeId,
      }, { onConflict: 'id' })
    }

    return Response.json({ data: { ok: true, email } }, { status: 201 })
  } catch (error) {
    logger.error('[POST /api/admin/users/invite]', error)
    return Response.json({ error: 'Internal server error', code: error.message }, { status: 500 })
  }
}
