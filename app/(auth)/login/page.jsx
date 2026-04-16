'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ERROR_MESSAGES = {
  deactivated: 'Your account has been deactivated. Please contact your college admin.',
  auth_error:  'Authentication failed. Please try again.',
}

// Reads ?error= from the URL — must be inside <Suspense>
function LoginForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(urlError ? (ERROR_MESSAGES[urlError] ?? urlError) : null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (otpError) {
      setError(otpError.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-teal-light flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="font-heading text-xl font-bold text-navy">Check your email</h2>
        <p className="text-muted text-sm">
          We sent a magic link to{' '}
          <span className="font-medium text-text">{email}</span>.
          Click it to sign in — no password needed.
        </p>
        <button
          onClick={() => { setSent(false); setEmail('') }}
          className="text-teal text-sm hover:underline mt-2 inline-block"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="font-heading text-2xl font-bold text-navy">Sign in</h2>
        <p className="text-muted text-sm mt-1">
          Enter your college email — we&apos;ll send you a magic link.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-error text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-text">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="lecturer@college.edu.in"
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text
                     placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal
                     focus:border-transparent text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="w-full bg-teal hover:bg-teal-2 disabled:opacity-50 disabled:cursor-not-allowed
                   text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
      >
        {loading ? 'Sending magic link…' : 'Send magic link'}
      </button>

      <p className="text-center text-xs text-muted">
        Only verified college emails can access EduDraftAI.
        <br />
        Contact{' '}
        <a href="mailto:info@yuktraai.com" className="text-teal hover:underline">
          info@yuktraai.com
        </a>{' '}
        for access.
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-muted text-sm">Loading…</div>}>
      <LoginForm />
    </Suspense>
  )
}
