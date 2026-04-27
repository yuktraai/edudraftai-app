import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const origin     = requestUrl.origin

  const code       = requestUrl.searchParams.get('code')
  const tokenHash  = requestUrl.searchParams.get('token_hash')
  const type       = requestUrl.searchParams.get('type')   // 'invite' | 'magiclink' | 'recovery' etc.

  // Neither a code nor a token_hash — nothing to exchange
  if (!code && !tokenHash) {
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  // Collect cookies that Supabase writes during session exchange
  const newCookies = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get:    (name)                 => request.cookies.get(name)?.value,
        set:    (name, value, options) => newCookies.push({ name, value, options }),
        remove: (name, options)        => newCookies.push({ name, value: '', options }),
      },
    }
  )

  // ── Exchange for a session ──────────────────────────────────────────────────
  let exchangeError

  if (code) {
    // Magic link / OAuth PKCE flow
    ;({ error: exchangeError } = await supabase.auth.exchangeCodeForSession(code))
  } else {
    // Invite / OTP token flow (token_hash + type params)
    ;({ error: exchangeError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type:       type ?? 'invite',
    }))
  }

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  // ── Read the authenticated user ─────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth_error`)
  }

  // ── Fetch profile from public.users ────────────────────────────────────────
  const { data: profile } = await supabase
    .from('users')
    .select('role, college_id, is_active, name')
    .eq('id', user.id)
    .single()

  // No profile row yet → onboarding (shouldn't happen for invited users but handle gracefully)
  if (!profile) {
    const response = NextResponse.redirect(`${origin}/onboarding`)
    newCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options ?? {})
    )
    return response
  }

  // Deactivated account → sign out + error
  if (!profile.is_active) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login?error=deactivated`)
  }

  // ── Resolve destination by role ─────────────────────────────────────────────
  const destination =
    profile.role === 'super_admin'   ? `${origin}/super-admin/colleges` :
    profile.role === 'college_admin' ? `${origin}/admin/dashboard` :
                                       `${origin}/dashboard`

  const response = NextResponse.redirect(destination)

  // Copy Supabase session cookies
  newCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options ?? {})
  )

  // Role + college_id cookies for middleware
  response.cookies.set('user_role', profile.role, {
    httpOnly: true,
    path:     '/',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
  })
  response.cookies.set('college_id', profile.college_id ?? '', {
    httpOnly: true,
    path:     '/',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
  })

  return response
}
