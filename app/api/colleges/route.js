import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const schema = z.object({
  name:     z.string().min(3).max(200),
  code:     z.string().min(2).max(30).toUpperCase(),
  district: z.string().min(2).max(100).optional(),
  address:  z.string().max(300).optional(),
})

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin')
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await adminSupabase
      .from('colleges')
      .select(`
        id, name, code, district, address, is_active, created_at,
        users(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return Response.json({ data })
  } catch (error) {
    logger.error('[GET /api/colleges]', error)
    return Response.json({ error: 'Internal server error', code: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin')
      return Response.json({ error: 'Forbidden', code: 'NOT_SUPER_ADMIN' }, { status: 403 })

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('colleges')
      .insert(parsed.data)
      .select()
      .single()

    if (error) {
      if (error.code === '23505')
        return Response.json({ error: 'A college with that code already exists', code: 'DUPLICATE_CODE' }, { status: 409 })
      throw error
    }

    return Response.json({ data }, { status: 201 })
  } catch (error) {
    logger.error('[POST /api/colleges]', error)
    return Response.json({ error: 'Internal server error', code: error.message }, { status: 500 })
  }
}
