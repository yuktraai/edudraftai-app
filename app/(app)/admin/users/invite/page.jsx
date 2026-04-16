'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function InviteLecturerPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error ?? 'Failed to send invite')
      return
    }

    setSuccess(true)
    setEmail('')
  }

  return (
    <div className="p-8 max-w-xl">
      <a href="/admin/users" className="text-teal text-sm hover:underline">← Back to Lecturers</a>

      <h1 className="font-heading text-2xl font-bold text-navy mt-4 mb-1">Invite Lecturer</h1>
      <p className="text-muted text-sm mb-8">
        Enter the lecturer&apos;s email. They&apos;ll receive a magic link to sign in — no password needed.
      </p>

      {success && (
        <div className="bg-teal-light border border-teal text-success text-sm rounded-lg px-4 py-3 mb-6">
          ✓ Invite sent! The lecturer will receive an email with a sign-in link.
          <button onClick={() => setSuccess(false)} className="ml-3 text-teal hover:underline text-xs">
            Invite another
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-error text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-text">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="lecturer@college.edu.in"
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text text-sm
                       placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal
                       focus:border-transparent"
          />
        </div>

        <Button type="submit" loading={loading} disabled={!email.trim()} className="w-full">
          Send Invite
        </Button>
      </form>

      <div className="mt-8 bg-bg border border-border rounded-xl p-4 text-xs text-muted space-y-1">
        <p className="font-medium text-text">What happens next?</p>
        <p>1. The lecturer receives an invite email from EduDraftAI.</p>
        <p>2. They click the link and are signed in automatically.</p>
        <p>3. They appear in your Lecturers list and can start generating content.</p>
      </div>
    </div>
  )
}
