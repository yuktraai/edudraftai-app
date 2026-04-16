import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        // Server Components are read-only — set/remove are handled by middleware.
        // The try/catch prevents errors when this client is used in a Server Component.
        set: (name, value, options) => {
          try { cookieStore.set({ name, value, ...options }) } catch { /* noop */ }
        },
        remove: (name, options) => {
          try { cookieStore.set({ name, value: '', ...options }) } catch { /* noop */ }
        },
      },
    }
  )
}
