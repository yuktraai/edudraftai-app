import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  // Collect cookies that Supabase writes during session exchange
  const newCookies = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => newCookies.push({ name, value, options }),
        remove: (name, options) => newCookies.push({ name, value: '', options }),
      },
    }
  )

  // 1. Exchange the auth code for a session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  // 2. Read the authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  // 3. Fetch the user's profile row from public.users
  const { data: profile } = await supabase
    .from('users')
    .select('role, college_id, is_active, name')
    .eq('id', user.id)
    .single()

  // 4. No profile row → first login → onboarding
  if (!profile) {
    const response = NextResponse.redirect(`${origin}/onboarding`)
    newCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options ?? {})
    )
    return response
  }

  // 5. Deactivated account → sign out + error
  if (!profile.is_active) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=deactivated`)
  }

  // 6. Resolve destination by role
  const destination =
    profile.role === 'super_admin'   ? `${origin}/super-admin/colleges` :
    profile.role === 'college_admin' ? `${origin}/admin/dashboard` :
                                       `${origin}/dashboard`

  const response = NextResponse.redirect(destination)

  // Copy Supabase session cookies
  newCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options ?? {})
  )

  // Set role + college_id cookies for middleware to read (httpOnly, never exposed to JS)
  response.cookies.set('user_role', profile.role, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  response.cookies.set('college_id', profile.college_id ?? '', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
