import { createClient } from '@/lib/supabase/server'

/**
 * Returns the raw Supabase auth user, or null if not authenticated.
 */
export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

/**
 * Returns the public.users profile row for the currently authenticated user.
 * Returns null if not authenticated or no profile row exists.
 */
export async function getUserProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, name, email, role, college_id, is_active')
    .eq('id', user.id)
    .single()

  if (error || !profile) return null
  return profile
}
