'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const SEVERITY_META = {
  info:    { label: 'Info',    cls: 'bg-bg text-muted border-border' },
  warning: { label: 'Warning', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  error:   { label: 'Error',   cls: 'bg-red-50 text-error border-red-200' },
}

const EVENT_TYPES = [
  { value: '',                  label: 'All Events' },
  { value: 'syllabus_parse',   label: 'Syllabus Parse' },
  { value: 'generation_error', label: 'Generation Error' },
  { value: 'auth_error',       label: 'Auth Error' },
  { value: 'credit_error',     label: 'Credit Error' },
  { value: 'api_error',        label: 'API Error' },
  { value: 'admin_action',     label: 'Admin Action' },
]

const SEVERITIES = [
  { value: '',        label: 'All Severities' },
  { value: 'info',    label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'error',   label: 'Error' },
]

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

// ── Expandable metadata cell ──────────────────────────────────────────────────
function MetaCell({ metadata }) {
  const [open, setOpen] = useState(false)
  if (!metadata || Object.keys(metadata).length === 0)
    return <span className="text-muted text-xs">—</span>

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-teal hover:underline"
      >
        {open ? 'Hide ↑' : 'View JSON ↓'}
      </button>
      {open && (
        <pre className="mt-1.5 text-[10px] bg-bg border border-border rounded-lg p-2 max-w-xs overflow-auto max-h-32 text-muted">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SuperAdminLogsPage() {
  const [logs,       setLogs]       = useState([])
  const [colleges,   setColleges]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  // Filters
  const [collegeId,  setCollegeId]  = useState('')
  const [severity,   setSeverity]   = useState('')
  const [eventType,  setEventType]  = useState('')
  const [dateFrom,   setDateFrom]   = useState('')

  const intervalRef = useRef(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (collegeId) params.set('college_id', collegeId)
      if (severity)  params.set('severity', severity)
      if (eventType) params.set('event_type', eventType)
      if (dateFrom)  params.set('date_from', dateFrom)

      const res  = await fetch(`/api/super-admin/logs?${params}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to load'); return }
      setLogs(json.data ?? [])
      setLastRefresh(new Date())
    } catch {
      setError('Network error.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [collegeId, severity, eventType, dateFrom])

  // Load colleges for filter dropdown
  useEffect(() => {
    fetch('/api/super-admin/colleges-list')
      .then(r => r.json())
      .then(({ data }) => setColleges(data ?? []))
      .catch(() => {})
  }, [])

  // Initial load + auto-refresh every 30s
  useEffect(() => {
    load()
    intervalRef.current = setInterval(() => load(true), 30_000)
    return () => clearInterval(intervalRef.current)
  }, [load])

  const selectCls = 'px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

  const errorCount   = logs.filter(l => l.severity === 'error').length
  const warningCount = logs.filter(l => l.severity === 'warning').length

  return (
    <div className="p-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">System Logs</h1>
          <p className="text-muted text-sm mt-1">
            All system events across all colleges. Auto-refreshes every 30 seconds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-muted">
              Last refresh: {lastRefresh.toLocaleTimeString('en-IN')}
            </span>
          )}
          <button
            onClick={() => load()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-lg text-muted hover:border-teal hover:text-teal transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Summary badges */}
      {!loading && logs.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-bg border border-border text-muted">
            {logs.length} total
          </span>
          {errorCount > 0 && (
            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-error">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <select value={collegeId} onChange={e => setCollegeId(e.target.value)} className={selectCls}>
          <option value="">All Colleges</option>
          {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={severity} onChange={e => setSeverity(e.target.value)} className={selectCls}>
          {SEVERITIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>

        <select value={eventType} onChange={e => setEventType(e.target.value)} className={selectCls}>
          {EVENT_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className={selectCls}
        />

        {(collegeId || severity || eventType || dateFrom) && (
          <button
            onClick={() => { setCollegeId(''); setSeverity(''); setEventType(''); setDateFrom('') }}
            className="px-3 py-2 text-xs font-medium text-muted border border-border rounded-lg hover:border-text hover:text-text transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* Logs table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-border rounded animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="px-5 py-6 text-sm text-error">{error}</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <svg className="w-10 h-10 text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-sm text-muted">No logs match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">College</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map(log => {
                  const sev = SEVERITY_META[log.severity] ?? SEVERITY_META.info
                  return (
                    <tr key={log.id} className={`hover:bg-bg transition-colors ${log.severity === 'error' ? 'bg-red-50/30' : log.severity === 'warning' ? 'bg-amber-50/20' : ''}`}>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap font-mono">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${sev.cls}`}>
                          {sev.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-bg border border-border rounded px-2 py-0.5 font-mono text-muted whitespace-nowrap">
                          {log.event_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted max-w-[140px] truncate">
                        {log.colleges?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-text max-w-[280px]">
                        <p className="line-clamp-2">{log.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        <MetaCell metadata={log.metadata} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
