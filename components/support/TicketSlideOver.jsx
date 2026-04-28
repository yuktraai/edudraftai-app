'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'bug',             label: 'Bug / Something broken' },
  { value: 'content_quality', label: 'Content Quality Issue' },
  { value: 'billing',         label: 'Billing / Credits' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'access',          label: 'Access / Login Problem' },
  { value: 'other',           label: 'Other' },
]

const PRIORITIES = [
  { value: 'low',      label: 'Low — not urgent' },
  { value: 'medium',   label: 'Medium — affecting my work' },
  { value: 'high',     label: 'High — blocking me' },
  { value: 'critical', label: 'Critical — data loss / no access' },
]

const STATUS_STYLES = {
  open:        'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved:    'bg-teal-light text-teal',
  closed:      'bg-border text-muted',
}
const STATUS_LABELS = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function TicketSlideOver({ isOpen, onClose }) {
  const [subject,     setSubject]     = useState('')
  const [description, setDescription] = useState('')
  const [category,    setCategory]    = useState('bug')
  const [priority,    setPriority]    = useState('medium')
  const [submitting,  setSubmitting]  = useState(false)
  const [success,     setSuccess]     = useState(null)   // { ticketNumber }
  const [error,       setError]       = useState(null)
  const [recentTickets, setRecentTickets] = useState([])

  const firstInputRef = useRef(null)

  // Fetch user's recent tickets when panel opens
  useEffect(() => {
    if (!isOpen) return
    setTimeout(() => firstInputRef.current?.focus(), 100)
    fetch('/api/support/tickets?limit=3')
      .then(r => r.json())
      .then(({ tickets }) => setRecentTickets(tickets ?? []))
      .catch(() => {})
  }, [isOpen])

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSubject(''); setDescription(''); setCategory('bug'); setPriority('medium')
        setSuccess(null); setError(null)
      }, 300)
    }
  }, [isOpen])

  async function handleSubmit(e) {
    e.preventDefault()
    if (description.trim().length < 20) {
      setError('Please provide at least 20 characters in the description.')
      return
    }
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), description: description.trim(), category, priority }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error?.fieldErrors ? 'Please check the form.' : (json.error ?? 'Failed to submit.')); return }
      setSuccess({ ticketNumber: json.ticketNumber })
      // Refresh recent tickets
      fetch('/api/support/tickets?limit=3').then(r => r.json()).then(({ tickets }) => setRecentTickets(tickets ?? [])).catch(() => {})
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'
  const selectCls = inputCls + ' cursor-pointer'

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-surface shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-heading text-lg font-bold text-navy">Get Help</h2>
            <p className="text-xs text-muted mt-0.5">We respond within 24 hours on working days.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-bg transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Success state */}
          {success ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-14 h-14 rounded-full bg-teal-light flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-semibold text-navy text-lg">Ticket raised!</h3>
                <p className="text-sm text-muted mt-1">
                  Your ticket <span className="font-mono font-semibold text-navy">{success.ticketNumber}</span> has been submitted.
                </p>
                <p className="text-xs text-muted mt-2">We'll respond within 24 hours on working days.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSuccess(null)}
                  className="flex-1 py-2 rounded-lg border border-border text-sm text-text hover:bg-bg transition-colors"
                >
                  Raise Another
                </button>
                <Link
                  href="/help/tickets"
                  onClick={onClose}
                  className="flex-1 py-2 rounded-lg bg-navy text-white text-sm font-semibold text-center hover:bg-navy-2 transition-colors"
                >
                  My Tickets
                </Link>
              </div>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">Subject <span className="text-error">*</span></label>
                <input
                  ref={firstInputRef}
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  maxLength={200}
                  required
                  placeholder="Brief summary of your issue"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text">Category <span className="text-error">*</span></label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className={selectCls} required>
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text">Priority <span className="text-error">*</span></label>
                  <select value={priority} onChange={e => setPriority(e.target.value)} className={selectCls} required>
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text">
                  Description <span className="text-error">*</span>
                  <span className="text-muted font-normal ml-1">(min 20 chars)</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  maxLength={5000}
                  required
                  placeholder="Describe the issue in detail — include steps to reproduce, what you expected, and what actually happened."
                  className={inputCls + ' resize-none'}
                />
                <p className="text-[10px] text-muted text-right">{description.length} / 5000</p>
              </div>

              {error && (
                <p className="text-xs text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !subject.trim() || description.trim().length < 20}
                className="w-full py-2.5 rounded-lg bg-teal text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting…
                  </>
                ) : 'Submit Ticket'}
              </button>
            </form>
          )}

          {/* Recent tickets */}
          {recentTickets.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">Your recent tickets</p>
                <Link href="/help/tickets" onClick={onClose} className="text-xs text-teal hover:underline">View all</Link>
              </div>
              <div className="space-y-2">
                {recentTickets.map(t => (
                  <Link
                    key={t.id}
                    href={`/help/tickets/${t.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between bg-bg border border-border rounded-lg px-3 py-2.5 hover:border-teal/40 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-muted">{t.ticket_number}</p>
                      <p className="text-sm text-text truncate group-hover:text-navy">{t.subject}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 ${STATUS_STYLES[t.status] ?? ''}`}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
