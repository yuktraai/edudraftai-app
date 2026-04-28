'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STATUS_STYLES = {
  open:        'bg-amber-100 text-amber-800 border border-amber-200',
  in_progress: 'bg-blue-100 text-blue-800 border border-blue-200',
  resolved:    'bg-teal-light text-teal border border-teal/30',
  closed:      'bg-gray-100 text-gray-500 border border-gray-200',
}
const STATUS_LABELS = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
}
const CATEGORY_LABELS = {
  bug: 'Bug', content_quality: 'Content Quality', billing: 'Billing',
  feature_request: 'Feature Request', access: 'Access', other: 'Other',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MyTicketsPage() {
  const [tickets, setTickets]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetch('/api/support/tickets')
      .then(r => r.json())
      .then(({ tickets }) => { setTickets(tickets ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">My Support Tickets</h1>
          <p className="text-muted text-sm mt-1">Track and view your submitted support requests.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-bg border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="w-12 h-12 text-border mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          <p className="text-muted text-sm font-medium">No tickets yet</p>
          <p className="text-muted text-xs mt-1">Use the <strong>?</strong> button (bottom-right) to raise a ticket.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Ticket #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Subject</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map(t => (
                <tr
                  key={t.id}
                  className="hover:bg-bg transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/help/tickets/${t.id}`}
                >
                  <td className="px-5 py-3 font-mono text-xs text-muted whitespace-nowrap">{t.ticket_number}</td>
                  <td className="px-5 py-3 font-medium text-text max-w-xs">
                    <p className="truncate">{t.subject}</p>
                  </td>
                  <td className="px-5 py-3 text-muted hidden sm:table-cell">
                    {CATEGORY_LABELS[t.category] ?? t.category}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[t.status] ?? ''}`}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted hidden md:table-cell whitespace-nowrap">
                    {formatDate(t.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
