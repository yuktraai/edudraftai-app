'use client'

import { useState } from 'react'

export function WaitlistSection() {
  const [form,    setForm]    = useState({ name: '', email: '', college_name: '', role: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return

    setLoading(true)
    setError('')

    try {
      const res  = await fetch('/api/waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="lp-section lp-waitlist-section" id="waitlist">
      <div className="lp-wrap">
        <div className="lp-waitlist-inner">
          <div className="lp-waitlist-copy">
            <div className="lp-kicker">Early Access</div>
            <h2>Be first in when we launch.</h2>
            <p>
              EduDraftAI launches <strong>July 7, 2026</strong> for SCTE & VT Odisha diploma colleges.
              Join the waitlist for early access, launch discounts, and setup support.
            </p>
            <ul className="lp-waitlist-perks">
              {[
                'Priority onboarding for your college',
                '30-day free trial at launch',
                'Dedicated setup call with the Yuktra AI team',
                'Lock in early-adopter pricing',
              ].map(p => (
                <li key={p}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00B4A6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="lp-waitlist-form-wrap">
            {success ? (
              <div className="lp-waitlist-success">
                <div className="lp-waitlist-success-icon">🎉</div>
                <h3>You&rsquo;re on the list!</h3>
                <p>
                  We&rsquo;ve sent a confirmation to <strong>{form.email}</strong>.
                  We&rsquo;ll reach out with your early-access invite closer to launch.
                </p>
              </div>
            ) : (
              <form className="lp-waitlist-form" onSubmit={handleSubmit} noValidate>
                <h3>Join the Waitlist</h3>

                <div className="lp-wf-group">
                  <label htmlFor="wl-name">Your Name *</label>
                  <input
                    id="wl-name"
                    name="name"
                    type="text"
                    placeholder="Dr. Priya Pattnaik"
                    value={form.name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="lp-wf-group">
                  <label htmlFor="wl-email">Work Email *</label>
                  <input
                    id="wl-email"
                    name="email"
                    type="email"
                    placeholder="lecturer@yourcollegename.ac.in"
                    value={form.email}
                    onChange={handleChange}
                    required
                    maxLength={254}
                  />
                </div>

                <div className="lp-wf-group">
                  <label htmlFor="wl-college">College Name</label>
                  <input
                    id="wl-college"
                    name="college_name"
                    type="text"
                    placeholder="Govt. Polytechnic, Bhubaneswar"
                    value={form.college_name}
                    onChange={handleChange}
                    maxLength={200}
                  />
                </div>

                <div className="lp-wf-group">
                  <label htmlFor="wl-role">Your Role</label>
                  <select
                    id="wl-role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                  >
                    <option value="">Select a role</option>
                    <option value="principal">Principal / HOD</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="college_admin">College Admin</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {error && (
                  <p className="lp-wf-error">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !form.name.trim() || !form.email.trim()}
                  className="lp-wf-submit"
                >
                  {loading ? 'Joining…' : 'Join the Waitlist →'}
                </button>

                <p className="lp-wf-note">
                  No spam. Unsubscribe anytime.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
