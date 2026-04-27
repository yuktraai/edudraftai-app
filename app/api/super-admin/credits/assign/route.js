import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const schema = z.object({
  user_id:  z.string().uuid(),
  amount:   z.number().int().min(1).max(10000),
  note:     z.string().max(200).optional().default(''),
})

async function getSuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await adminSupabase
    .from('users').select('role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? user : null
}

// POST /api/super-admin/credits/assign
// Assigns personal credits directly to a lecturer.
export async function POST(request) {
  try {
    const admin = await getSuperAdmin()
    if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

    let body
    try { body = await request.json() } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { user_id, amount, note } = parsed.data

    // Verify the target is a real lecturer/college_admin (not another super admin)
    const { data: target } = await adminSupabase
      .from('users')
      .select('id, name, email, role, college_id, is_active')
      .eq('id', user_id)
      .single()

    if (!target)
      return Response.json({ error: 'User not found', code: 'USER_NOT_FOUND' }, { status: 404 })
    if (!target.is_active)
      return Response.json({ error: 'User account is deactivated', code: 'USER_INACTIVE' }, { status: 400 })
    if (target.role === 'super_admin')
      return Response.json({ error: 'Cannot assign credits to super admin', code: 'INVALID_ROLE' }, { status: 400 })
    if (!target.college_id)
      return Response.json({ error: 'User has no college assigned', code: 'NO_COLLEGE' }, { status: 400 })

    // Insert positive row into personal_credit_ledger
    const { data: ledgerRow, error: insertError } = await adminSupabase
      .from('personal_credit_ledger')
      .insert({
        user_id:    target.id,
        college_id: target.college_id,
        amount,
        reason:     'admin_grant',
        reference_id: null,
      })
      .select('id, amount, created_at')
      .single()

    if (insertError) throw insertError

    logger.info(`[super-admin credits] assigned ${amount} credits to ${target.email} (${target.id}) by super_admin ${admin.id}${note ? ` — note: ${note}` : ''}`)

    return Response.json({
      ok: true,
      assigned: {
        user_id:    target.id,
        name:       target.name,
        email:      target.email,
        amount,
        ledger_id:  ledgerRow.id,
        created_at: ledgerRow.created_at,
      },
    }, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/super-admin/credits/assign]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}

// GET /api/super-admin/credits/assign?college_id=&limit=
// Returns recent admin_grant rows from personal_credit_ledger with user info.
export async function GET(request) {
  try {
    const admin = await getSuperAdmin()
    if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const college_id = searchParams.get('college_id')
    const limit      = Math.min(Number(searchParams.get('limit') ?? 50), 200)

    let query = adminSupabase
      .from('personal_credit_ledger')
      .select('id, user_id, college_id, amount, reason, created_at, users(name, email, role)')
      .eq('reason', 'admin_grant')
      .gt('amount', 0)   // only positive (grant) rows
      .order('created_at', { ascending: false })
      .limit(limit)

    if (college_id) query = query.eq('college_id', college_id)

    const { data, error } = await query
    if (error) throw error

    return Response.json({ history: data ?? [] })
  } catch (err) {
    logger.error('[GET /api/super-admin/credits/assign]', err)
    return Response.json({ error: 'Internal server error', code: err.message }, { status: 500 })
  }
}
