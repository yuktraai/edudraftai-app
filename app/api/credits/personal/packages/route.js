import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// GET /api/credits/personal/packages — returns active personal credit packages
// Accessible by any authenticated user (lecturer sees it on buy page)
export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data, error } = await adminSupabase
      .from('personal_credit_packages')
      .select('id, name, credits, price_paise, is_popular, sort_order')
      .eq('is_active', true)
      .order('sort_order')

    if (error) throw error
    return Response.json({ packages: data ?? [] })
  } catch (err) {
    logger.error('[GET /api/credits/personal/packages]', err)
    return Response.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}

// POST /api/credits/personal/packages — super_admin creates a new package
const createSchema = z.object({
  name:        z.string().min(2).max(100),
  credits:     z.number().int().positive(),
  price_paise: z.number().int().positive(),
  is_popular:  z.boolean().optional().default(false),
  sort_order:  z.number().int().optional().default(0),
})

export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin')
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    const body   = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { data, error } = await adminSupabase
      .from('personal_credit_packages')
      .insert(parsed.data)
      .select('*')
      .single()

    if (error) throw error
    return Response.json({ package: data }, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/credits/personal/packages]', err)
    return Response.json({ error: 'Failed to create package' }, { status: 500 })
  }
}
