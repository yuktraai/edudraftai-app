'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const STATUS_OPTIONS = [
  { value: 'new',       label: 'New',       color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'contacted', label: 'Contacted', color: 'bg-amber-50 text-warning border-amber-200' },
  { value: 'onboarded', label: 'Onboarded', color: 'bg-teal-light text-teal border-teal/25' },
  { value: 'rejected',  label: 'Rejected',  color: 'bg-red-50 text-error border-red-200' },
]

function statusStyle(status) {
  return STATUS_OPTIONS.find(o => o.value === status)?.color ?? 'bg-slate-100 text-muted border-border'
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function NotesCell({ id, initial, onSaved }) {
  const [notes,  setNotes]  = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const prevRef = useRef(initial ?? '')

  async function handleBlur() {
    if (notes === prevRef.current) return
    setSaving(true)
    try {
      const res = await fetch(`/api/super-admin/college-pilot/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (res.ok) { prevRef.current = notes; onSaved?.() }
      else setNotes(prevRef.current)
    } catch { setNotes(prevRef.current) }
    finally { setSaving(false) }
  }

  return (
    <div className="relative">
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        onBlur={handleBlur}
        rows={2}
        placeholder="Add notes…"
        className="w-full px-3 py-2 rounded-lg border border-border bg-white text-xs text-text resize-none focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-colors placeholder:text-slate-400 min-w-[160px]"
      />
      {saving && <span className="absolute bottom-1.5 right-2 text-[10px] text-muted animate-pulse">saving…</span>}
    </div>
  )
}

function LogoButton({ id, collegeName }) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/super-admin/college-pilot/${id}/logo`)
      const json = await res.json()
      if (!res.ok) { alert(json.error ?? 'Failed to load logo'); return }
      window.open(json.signedUrl, '_blank', 'noopener,noreferrer')
    } catch { alert('Network error.') }
    finally { setLoading(false) }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted hover:border-teal hover:text-teal transition-colors disabled:opacity-50"
      title={`Download logo for ${collegeName}`}
    >
      {loading ? (
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
        </svg>
      )}
      Logo
    </button>
  )
}

function StatusSelect({ id, currentStatus, onChange }) {
  const [status, setStatus]   = useState(currentStatus)
  const [saving, setSaving]   = useState(false)

  async function handleChange(e) {
    const next = e.target.value
    setSaving(true)
    try {
      const res = await fetch(`/api/super-admin/college-pilot/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (res.ok) { setStatus(next); onChange?.(next) }
    } catch {}
    finally { setSaving(false) }
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={saving}
      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none disabled:opacity-60 transition-colors ${statusStyle(status)}`}
    >
      {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// Expandable departments list
function DeptsList({ departments }) {
  const [open, setOpen] = useState(false)
  if (!departments?.length) return <span className="text-xs text-muted italic">—</span>
  const preview = departments.slice(0, 2)
  const rest    = departments.slice(2)
  return (
    <div className="text-xs text-muted">
      {preview.map((d, i) => <div key={i} className="truncate max-w-[160px]">{d}</div>)}
      {rest.length > 0 && (
        <>
          {open && rest.map((d, i) => <div key={i} className="truncate max-w-[160px]">{d}</div>)}
          <button
            onClick={() => setOpen(v => !v)}
            className="text-teal font-medium hover:underline mt-0.5"
          >
            {open ? 'show less' : `+${rest.length} more`}
          </button>
        </>
      )}
    </div>
  )
}

export default function CollegePilotAdminPage() {
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [filter,   setFilter]   = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch('/api/super-admin/college-pilot')
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to load'); return }
      setRequests(json.data ?? [])
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const counts = requests.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc }, {})
  const filtered = filter ? requests.filter(r => r.status === filter) : requests

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">College Pilot Requests</h1>
          <p className="text-sm text-muted mt-0.5">{requests.length} total submissions</p>
        </div>
        <a
          href="/college-pilot"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted hover:border-teal hover:text-teal transition-colors self-start"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
          </svg>
          View Public Form
        </a>
      </div>

      {/* Status pills */}
      {!loading && requests.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setFilter('')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              !filter ? 'bg-navy text-white border-navy' : 'bg-white text-muted border-border hover:border-navy hover:text-navy'
            }`}
          >
            All ({requests.length})
          </button>
          {STATUS_OPTIONS.map(o => counts[o.value] > 0 ? (
            <button key={o.value} onClick={() => setFilter(filter === o.value ? '' : o.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filter === o.value ? o.color : 'bg-white text-muted border-border hover:border-navy hover:text-navy'
              }`}
            >
              {o.label} ({counts[o.value]})
            </button>
          ) : null)}
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-error">{error}</div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-border/40 rounded-2xl animate-pulse"/>)}
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="text-center py-20 bg-surface border border-border rounded-2xl">
          <div className="text-4xl mb-3">🏫</div>
          <p className="text-navy font-semibold mb-1">No pilot requests yet</p>
          <p className="text-sm text-muted">Requests submitted via the public form will appear here.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="border-b border-border bg-bg text-xs font-semibold text-muted uppercase tracking-wide">
                <th className="px-5 py-3 text-left">College</th>
                <th className="px-4 py-3 text-left">Principal</th>
                <th className="px-4 py-3 text-left">Departments</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">District</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Logo</th>
                <th className="px-4 py-3 text-left">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(req => (
                <tr key={req.id} className="hover:bg-bg/40 transition-colors align-top">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-navy">{req.college_name}</p>
                    <p className="text-xs text-muted mt-0.5 truncate max-w-[180px]">{req.address}</p>
                    <p className="text-xs text-muted mt-0.5">{req.phone}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-xs font-medium text-navy">{req.principal_name}</p>
                    <a href={`mailto:${req.principal_email}`} className="text-xs text-teal hover:underline">
                      {req.principal_email}
                    </a>
                  </td>
                  <td className="px-4 py-4">
                    <DeptsList departments={req.departments} />
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <span className="text-xs text-muted">{req.district ?? '—'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-muted">{formatDate(req.submitted_at)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusSelect
                      id={req.id}
                      currentStatus={req.status}
                      onChange={next => setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: next } : r))}
                    />
                  </td>
                  <td className="px-4 py-4">
                    {req.logo_path
                      ? <LogoButton id={req.id} collegeName={req.college_name} />
                      : <span className="text-xs text-muted italic">No logo</span>}
                  </td>
                  <td className="px-4 py-4 min-w-[200px]">
                    <NotesCell id={req.id} initial={req.notes} />
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
