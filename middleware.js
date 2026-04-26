import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Routes accessible only while logged OUT
const AUTH_ROUTES = ['/login', '/verify']

// Public routes that must never trigger the auth redirect
const PUBLIC_PREFIXES = ['/webinar']

// Route prefixes that require authentication
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/generate',
  '/drafts',
  '/syllabus',
  '/admin',
  '/super-admin',
]

// Role → home redirect map
const ROLE_HOME = {
  super_admin:   '/super-admin/colleges',
  college_admin: '/admin/dashboard',
  lecturer:      '/dashboard',
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Build a Supabase client that refreshes session cookies in place
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Always call getUser() — this refreshes the session token if needed
  const { data: { user } } = await supabase.auth.getUser()

  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isProtected = !isPublic && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  // ── 1. Unauthenticated user hitting a protected route → /login ──────────────
  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // ── 2. Authenticated user hitting a login page → their home ─────────────────
  if (user && isAuthRoute) {
    const role = request.cookies.get('user_role')?.value
    const home = ROLE_HOME[role] || '/dashboard'
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = home
    return NextResponse.redirect(homeUrl)
  }

  // ── 3. Role-based access control for authenticated users ─────────────────────
  if (user && isProtected) {
    const role = request.cookies.get('user_role')?.value

    // Lecturer must not access /admin/* or /super-admin/*
    if (
      role === 'lecturer' &&
      (pathname.startsWith('/admin') || pathname.startsWith('/super-admin'))
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // College admin must not access /super-admin/*
    if (role === 'college_admin' && pathname.startsWith('/super-admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - /auth/* (Supabase callback route — must be excluded from this guard)
     * - public assets (png, jpg, svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
