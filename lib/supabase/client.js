import { createBrowserClient } from '@supabase/ssr'

/**
 * Call this inside components/event handlers — never at module level.
 * createBrowserClient must not run during module initialisation
 * or webpack chunk evaluation will crash.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
