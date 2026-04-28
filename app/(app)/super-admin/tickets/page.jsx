'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const STATUS_STYLES = {
  open:        'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved:    'bg-teal-light text-teal',
  closed:      'bg-gray-100 text-gray-500',
}
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' }

const PRIORITY_STYLES = {
  low:      'bg-gray-100 text-gray-500',
  medium:   'bg-amber-50 text-amber-700',
  high:     'bg-red-100 text-red-700',
  critical: 'bg-red-200 text-red-900 font-bold',
}
const PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }

const CATEGORY_LABELS = {
  bug: 'Bug', content_quality: 'Content Quality', billing: 'Billing',
  feature_request: 'Feature Req.', access: 'Access', other: 'Other',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SuperAdminTicketsPage() {
  const [tickets,  setTickets]  = useState([])
  const [stats,    setStats]    = useState({ open: 0, in_progress: 0, resolved_week: 0 })
  const [loading,  setLoading]  = useState(true)

  const [filterStatus,   setFilterStatus]   = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const fetchTickets = useCallback(() => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (filterStatus)   qs.set('status',   filterStatus)
    if (filterCategory) qs.set('category', filterCategory)
    if (filterPriority) qs.set('priority', filterPriority)
    fetch(`/api/super-admin/tickets?${qs}`)
      .then(r => r.json())
      .then(({ tickets, stats }) => {
        setTickets(tickets ?? [])
        if (stats) setStats(stats)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filterStatus, filterCategory, filterPriority])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const selectCls = 'px-3 py-1.5 rounded-lg border border-border bg-bg text-text text-xs focus:outline-none focus:ring-2 focus:ring-teal/40'

  return (
    <div className="p-6 md:p-8 max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-navy">Support Tickets</h1>
        <p className="text-muted text-sm mt-1">Manage and respond to user support requests.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open',             value: stats.open,         color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
          { label: 'In Progress',      value: stats.in_progress,  color: 'text-blue-700',  bg: 'bg-blue-50  border-blue-200'  },
          { label: 'Resolved (7 days)',value: stats.resolved_week, color: 'text-teal',      bg: 'bg-teal-light border-teal/30' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border px-5 py-4 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectCls}>
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={selectCls}>
          <option value="">All priorities</option>
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {(filterStatus || filterCategory || filterPriority) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterCategory(''); setFilterPriority('') }}
            className="text-xs text-muted hover:text-error transition-colors"
          >
            Clear filters
          </button>
        )}
        <span className="text-xs text-muted ml-auto">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-bg border border-border rounded-xl animate-pulse" />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface border border-border rounded-2xl">
          <svg className="w-12 h-12 text-border mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-muted text-sm">No tickets found.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Ticket #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Subject</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden lg:table-cell">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden xl:table-cell">College</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Priority</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wide hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map(t => (
                <tr
                  key={t.id}
                  className="hover:bg-bg transition-colors cursor-pointer"
                  onClick={() => window.location.href = `/super-admin/tickets/${t.id}`}
                >
                  <td className="px-5 py-3 font-mono text-xs text-muted whitespace-nowrap">{t.ticket_number}</td>
                  <td className="px-5 py-3 font-medium text-text max-w-xs">
                    <p className="truncate">{t.subject}</p>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <p className="text-text text-xs font-medium truncate">{t.users?.name ?? '—'}</p>
                    <p className="text-muted text-[11px] truncate">{t.users?.email ?? ''}</p>
                  </td>
                  <td className="px-5 py-3 text-muted text-xs hidden xl:table-cell max-w-[140px]">
                    <p className="truncate">{t.colleges?.name ?? '—'}</p>
                  </td>
                  <td className="px-5 py-3 text-muted text-xs hidden md:table-cell">
                    {CATEGORY_LABELS[t.category] ?? t.category}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[t.priority] ?? ''}`}>
                      {PRIORITY_LABELS[t.priority] ?? t.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[t.status] ?? ''}`}>
                      {STATUS_LABELS[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted text-xs hidden sm:table-cell whitespace-nowrap">
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
