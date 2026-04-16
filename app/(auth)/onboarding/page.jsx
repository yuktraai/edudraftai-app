'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      // Success — go to dashboard (middleware will guard role from here)
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="font-heading text-2xl font-bold text-navy">
          Welcome to EduDraftAI
        </h2>
        <p className="text-muted text-sm mt-1">
          Let us know your name to set up your account.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-error text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium text-text">
          Full name
        </label>
        <input
          id="name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Dr. Priya Mohanty"
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text
                     placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal
                     focus:border-transparent text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full bg-teal hover:bg-teal-2 disabled:opacity-50 disabled:cursor-not-allowed
                   text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
      >
        {loading ? 'Setting up your account…' : 'Get started'}
      </button>
    </form>
  )
}
