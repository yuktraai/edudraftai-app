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
const STATUS_LABELS  = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' }
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

export default function TicketDetailPage() {
  const { id } = useParams()
  const [ticket,  setTicket]  = useState(null)
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    fetch(`/api/support/tickets/${id}`)
      .then(r => r.json())
      .then(({ ticket, updates, error }) => {
        if (error) { setError(error); setLoading(false); return }
        setTicket(ticket)
        setUpdates(updates ?? [])
        setLoading(false)
      })
      .catch(() => { setError('Failed to load ticket'); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="p-8 max-w-3xl space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-bg border border-border rounded-xl animate-pulse" />)}
    </div>
  )

  if (error || !ticket) return (
    <div className="p-8 max-w-3xl">
      <p className="text-error text-sm">{error ?? 'Ticket not found.'}</p>
      <Link href="/help/tickets" className="text-sm text-teal mt-2 inline-block hover:underline">← Back to tickets</Link>
    </div>
  )

  return (
    <div className="p-6 md:p-8 max-w-3xl space-y-6">
      {/* Back */}
      <Link href="/help/tickets" className="text-sm text-muted hover:text-text flex items-center gap-1 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        My Tickets
      </Link>

      {/* Header */}
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

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
          <span>Category: <span className="text-text font-medium">{CATEGORY_LABELS[ticket.category] ?? ticket.category}</span></span>
          <span>Priority: <span className={`font-medium ${PRIORITY_STYLES[ticket.priority] ?? ''}`}>{PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</span></span>
          <span>Submitted: <span className="text-text">{formatDateTime(ticket.created_at)}</span></span>
          {ticket.resolved_at && (
            <span>Resolved: <span className="text-teal">{formatDateTime(ticket.resolved_at)}</span></span>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Description</p>
          <div className="bg-bg border border-border rounded-lg p-4 text-sm text-text leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </div>
        </div>
      </div>

      {/* Updates timeline */}
      <div>
        <h2 className="font-semibold text-text mb-4">Updates from Support</h2>
        {updates.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl px-5 py-8 text-center">
            <p className="text-muted text-sm">No updates yet. We'll respond within 24 hours on working days.</p>
          </div>
        ) : (
          <div className="space-y-3">
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
                  <div className="flex items-center gap-2 mb-1">
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
      </div>
    </div>
  )
}
