'use client'
import { useState } from 'react'

export function RegistrationForm({ webinarId, webinarSlug }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'lecturer',
    college: '',
    city: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    setError(null)
    if (!form.name || !form.email || !form.college) {
      setError('Please fill in all required fields.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/webinar/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, webinarId, webinarSlug }),
      })
      const data = await res.json()
      if (res.status === 409) {
        setError('You\'re already registered for this event.')
        setLoading(false)
        return
      }
      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      setSuccess(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-16 h-16 rounded-full bg-teal-light flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-navy">You're registered!</h3>
        <p className="text-muted text-sm">A confirmation email is on its way. The Google Meet link will be sent 1 hour before the event.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">
      <h2 className="font-heading text-xl font-bold text-navy mb-1">Register for Free</h2>
      <p className="text-sm text-muted mb-6">Seats are limited. Reserve yours now.</p>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-error">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Email Address *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
              placeholder="your@email.com"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Your Role *</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
            >
              <option value="lecturer">Lecturer</option>
              <option value="hod">Head of Department</option>
              <option value="principal">Principal</option>
              <option value="student">Student</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">College / Institution *</label>
            <input
              type="text"
              value={form.college}
              onChange={e => setForm(f => ({ ...f, college: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
              placeholder="College name"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">
            City <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
            placeholder="e.g. Bhubaneswar"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-teal text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
        >
          {loading ? 'Registering…' : 'Register for Free →'}
        </button>

        <p className="text-xs text-muted text-center">
          By registering you agree to receive event-related emails from Yuktra AI.
        </p>
      </div>
    </div>
  )
}
