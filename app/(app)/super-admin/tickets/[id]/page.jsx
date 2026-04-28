'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const STATUS_STYLES = {
  open:        'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved:    'bg-teal-light text-teal',
  closed:      'bg-gray-100 text-gray-500',
}
const STATUS_LABELS   = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' }
const PRIORITY_STYLES = { low: 'text-muted', medium: 'text-warning', high: 'text-error', critical: 'text-error font-bold' }
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }
const CATEGORY_LABELS = {
  bug: 'Bug Report', content_quality: 'Content Quality', billing: 'Billing',
  feature_request: 'Feature Request', access: 'Access / Login', other: 'Other',
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function SuperAdminTicketDetailPage() {
  const { id }  = useParams()
  const [ticket,  setTicket]  = useState(null)
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  // Update form state
  const [message,   setMessage]   = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [sending,   setSending]   = useState(false)
  const [sendResult, setSendResult] = useState(null)

  function loadTicket() {
    fetch(`/api/super-admin/tickets/${id}`)
      .then(r => r.json())
      .then(({ ticket, updates }) => {
        setTicket(ticket)
        setUpdates(updates ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadTicket() }, [id])

  async function handleSendUpdate(e) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true); setSendResult(null)
    try {
      const body = { message: message.trim() }
      if (newStatus) body.new_status = newStatus
      const res = await fetch(`/api/super-admin/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setSendResult({ error: json.error ?? 'Failed to send.' }); return }
      setSendResult({ ok: true })
      setMessage(''); setNewStatus('')
      loadTicket()   // refresh timeline + status
    } catch {
      setSendResult({ error: 'Network error.' })
    } finally {
      setSending(false)
    }
  }

  if (loading) return (
    <div className="p-8 max-w-3xl space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-bg border border-border rounded-xl animate-pulse" />)}
    </div>
  )

  if (!ticket) return (
    <div className="p-8 max-w-3xl">
      <p className="text-error text-sm">Ticket not found.</p>
      <Link href="/super-admin/tickets" className="text-sm text-teal mt-2 inline-block hover:underline">← Back</Link>
    </div>
  )

  return (
    <div className="p-6 md:p-8 max-w-3xl space-y-6">
      {/* Back */}
      <Link href="/super-admin/tickets" className="text-sm text-muted hover:text-text flex items-center gap-1 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        All Tickets
      </Link>

      {/* Ticket info */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-muted mb-1">{ticket.ticket_number}</p>
            <h1 className="font-heading text-xl font-bold text-navy">{ticket.subject}</h1>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[ticket.status] ?? ''}`}>
            {STATUS_LABELS[ticket.status] ?? ticket.status}
          </span>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div>
            <p className="text-muted mb-0.5">Raised by</p>
            <p className="text-text font-medium">{ticket.users?.name ?? '—'}</p>
            <p className="text-muted">{ticket.users?.email}</p>
          </div>
          <div>
            <p className="text-muted mb-0.5">College</p>
            <p className="text-text font-medium">{ticket.colleges?.name ?? 'N/A'}</p>
            <p className="text-muted capitalize">{ticket.role}</p>
          </div>
          <div>
            <p className="text-muted mb-0.5">Category</p>
            <p className="text-text">{CATEGORY_LABELS[ticket.category] ?? ticket.category}</p>
          </div>
          <div>
            <p className="text-muted mb-0.5">Priority</p>
            <p className={`font-medium ${PRIORITY_STYLES[ticket.priority] ?? ''}`}>
              {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
            </p>
          </div>
          <div>
            <p className="text-muted mb-0.5">Submitted</p>
            <p className="text-text">{formatDateTime(ticket.created_at)}</p>
          </div>
          {ticket.resolved_at && (
            <div>
              <p className="text-muted mb-0.5">Resolved</p>
              <p className="text-teal">{formatDateTime(ticket.resolved_at)}</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Description</p>
          <div className="bg-bg border border-border rounded-lg p-4 text-sm text-text leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </div>
        </div>
      </div>

      {/* Updates timeline */}
      <div>
        <h2 className="font-semibold text-text mb-4">
          Conversation <span className="text-muted font-normal text-sm">({updates.length} update{updates.length !== 1 ? 's' : ''})</span>
        </h2>
        {updates.length === 0 ? (
          <p className="text-muted text-sm mb-4">No updates yet. Send the first reply below.</p>
        ) : (
          <div className="space-y-3 mb-6">
            {updates.map((u, i) => (
              <div key={u.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  {i < updates.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                </div>
                <div className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 mb-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-navy">{u.users?.name ?? 'Support Team'}</span>
                    <span className="text-[10px] text-muted">{formatDateTime(u.created_at)}</span>
                    {u.new_status && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[u.new_status] ?? ''}`}>
                        → {STATUS_LABELS[u.new_status] ?? u.new_status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">{u.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply form */}
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-text text-sm">Add Reply / Update Status</h3>
          <form onSubmit={handleSendUpdate} className="space-y-3">
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Write your reply to the user…"
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
              required
            />

            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              >
                <option value="">Keep current status ({STATUS_LABELS[ticket.status]})</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v} disabled={v === ticket.status}>{l}</option>
                ))}
              </select>

              {sendResult?.ok && (
                <span className="text-xs text-teal font-medium">✓ Reply sent — user notified by email.</span>
              )}
              {sendResult?.error && (
                <span className="text-xs text-error">{sendResult.error}</span>
              )}

              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="ml-auto px-5 py-2 rounded-lg bg-navy text-white text-sm font-semibold hover:bg-navy-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending…
                  </>
                ) : 'Send Reply'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
