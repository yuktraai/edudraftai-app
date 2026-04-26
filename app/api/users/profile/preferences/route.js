import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ preferences: {} })
  const { data } = await adminSupabase.from('users').select('preferences').eq('id', user.id).single()
  return Response.json({ preferences: data?.preferences ?? {} })
}
