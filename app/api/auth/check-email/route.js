import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request) {
  let body
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ allowed: false }, { status: 200 })
  }

  const { email } = parsed.data

  const { data } = await adminSupabase
    .from('users')
    .select('id, is_active')
    .eq('email', email.toLowerCase().trim())
    .single()

  // No row → email not registered
  if (!data) {
    return Response.json({ allowed: false, reason: 'not_registered' })
  }

  // Row exists but deactivated
  if (!data.is_active) {
    return Response.json({ allowed: false, reason: 'deactivated' })
  }

  return Response.json({ allowed: true })
}
