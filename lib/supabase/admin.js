// Service role client — server-only. Never import in client components.
import { createClient } from '@supabase/supabase-js'

export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
