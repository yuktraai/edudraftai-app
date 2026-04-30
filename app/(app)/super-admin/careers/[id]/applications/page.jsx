'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: 'pending',     label: 'Pending',     color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'in_progress', label: 'In Progress',  color: 'bg-amber-50 text-warning border-amber-200' },
  { value: 'selected',    label: 'Selected',     color: 'bg-teal-light text-teal border-teal/25' },
  { value: 'rejected',    label: 'Rejected',     color: 'bg-red-50 text-error border-red-200' },
]

function statusStyle(status) {
  return STATUS_OPTIONS.find(o => o.value === status)?.color ?? 'bg-slate-100 text-muted border-border'
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// Inline notes textarea with save-on-blur
function NotesCell({ appId, jobId, initialNotes, onSaved }) {
  const [notes,   setNotes]   = useState(initialNotes ?? '')
  const [saving,  setSaving]  = useState(false)
  const prevRef = useRef(initialNotes ?? '')

  async function handleBlur() {
    if (notes === prevRef.current) return
    setSaving(true)
    try {
      const res  = await fetch(`/api/super-admin/careers/${jobId}/applications/${appId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notes }),
      })
      if (res.ok) {
        prevRef.current = notes
        onSaved?.()
      } else {
        setNotes(prevRef.current) // revert
      }
    } catch {
      setNotes(prevRef.current)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative">
      <textarea
        value={notes}
        onChange={e => setNotes(e.target.value)}
        onBlur={handleBlur}
        rows={2}
        placeholder="Add internal notes…"
        className="w-full px-3 py-2 rounded-lg border border-border bg-white text-xs text-text resize-none focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 transition-colors placeholder:text-slate-400 min-w-[160px]"
      />
      {saving && (
        <span className="absolute bottom-1.5 right-2 text-[10px] text-muted animate-pulse">saving…</span>
      )}
    </div>
  )
}

// Status dropdown — updates on change, no page reload
function StatusSelect({ appId, jobId, currentStatus, onChange }) {
  const [status,  setStatus]  = useState(currentStatus)
  const [saving,  setSaving]  = useState(false)

  async function handleChange(e) {
    const next = e.target.value
    setSaving(true)
    try {
      const res = await fetch(`/api/super-admin/careers/${jobId}/applications/${appId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: next }),
      })
      if (res.ok) {
        setStatus(next)
        onChange?.(next)
      }
    } catch {
      // silent — status reverts on re-render
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={saving}
      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal/30 disabled:opacity-60 transition-colors ${statusStyle(status)}`}
    >
      {STATUS_OPTIONS.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// Download resume button — fetches signed URL then opens in new tab
function ResumeButton({ appId, jobId }) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/super-admin/careers/${jobId}/applications/${appId}/resume`)
      const json = await res.json()
      if (!res.ok || !json.signedUrl) { alert(json.error ?? 'Failed to generate download link'); return }
      window.open(json.signedUrl, '_blank', 'noopener,noreferrer')
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      title="Download resume"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted hover:border-teal hover:text-teal transition-colors disabled:opacity-50"
    >
      {loading ? (
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      )}
      Resume
    </button>
  )
}

export default function ApplicationsPage() {
  const { id: jobId } = useParams()

  const [job,          setJob]          = useState(null)
  const [applications, setApplications] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [filterStatus, setFilterStatus] = useState('')

  const fetchData = useCallback(async () => {
    if (!jobId) return
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/super-admin/careers/${jobId}/applications`)
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to load applications'); return }
      setJob(json.job ?? null)
      setApplications(json.data ?? [])
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = filterStatus
    ? applications.filter(a => a.status === filterStatus)
    : applications

  // Count by status for header badges
  const counts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted mb-6 flex-wrap">
        <Link href="/super-admin/careers" className="hover:text-navy transition-colors">Careers</Link>
        <span>/</span>
        {job && (
          <>
            <span className="text-navy font-medium truncate max-w-xs">{job.title}</span>
            <span>/</span>
          </>
        )}
        <span className="text-navy font-medium">Applications</span>
      </div>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">
            {job ? `Applications — ${job.title}` : 'Applications'}
          </h1>
          <p className="text-sm text-muted mt-0.5">
            {applications.length} total · manage candidate pipeline below
          </p>
        </div>
        {job && (
          <Link
            href={`/super-admin/careers/${jobId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted hover:border-navy hover:text-navy transition-colors self-start"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Edit Job
          </Link>
        )}
      </div>

      {/* Status summary pills */}
      {!loading && applications.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              !filterStatus ? 'bg-navy text-white border-navy' : 'bg-white text-muted border-border hover:border-navy hover:text-navy'
            }`}
          >
            All ({applications.length})
          </button>
          {STATUS_OPTIONS.map(o => (
            counts[o.value] > 0 ? (
              <button
                key={o.value}
                onClick={() => setFilterStatus(filterStatus === o.value ? '' : o.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  filterStatus === o.value ? `${o.color} opacity-100` : `bg-white text-muted border-border hover:border-navy hover:text-navy`
                }`}
              >
                {o.label} ({counts[o.value]})
              </button>
            ) : null
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-error">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-border/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && applications.length === 0 && (
        <div className="text-center py-20 bg-surface border border-border rounded-2xl">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-navy font-semibold mb-1">No applications yet</p>
          <p className="text-sm text-muted">Applications submitted via the public careers page will appear here.</p>
        </div>
      )}

      {/* Applications table */}
      {!loading && !error && applications.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-bg text-xs font-semibold text-muted uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Applicant</th>
                <th className="px-4 py-3 text-left">Current Role</th>
                <th className="px-4 py-3 text-left">Applied</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Resume</th>
                <th className="px-4 py-3 text-left">Internal Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(app => (
                <tr key={app.id} className="hover:bg-bg/40 transition-colors align-top">
                  {/* Applicant */}
                  <td className="px-5 py-4">
                    <p className="font-semibold text-navy">{app.full_name}</p>
                    <a
                      href={`mailto:${app.email}`}
                      className="text-xs text-teal hover:underline"
                    >
                      {app.email}
                    </a>
                    <p className="text-xs text-muted mt-0.5">{app.phone}</p>
                  </td>
                  {/* Current Role */}
                  <td className="px-4 py-4">
                    <span className="text-xs text-muted">
                      {app.applicant_role || <span className="italic text-slate-400">—</span>}
                    </span>
                  </td>
                  {/* Applied */}
                  <td className="px-4 py-4">
                    <span className="text-xs text-muted">{formatDate(app.applied_at)}</span>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-4">
                    <StatusSelect
                      appId={app.id}
                      jobId={jobId}
                      currentStatus={app.status}
                      onChange={next => {
                        setApplications(prev =>
                          prev.map(a => a.id === app.id ? { ...a, status: next } : a)
                        )
                      }}
                    />
                  </td>
                  {/* Resume */}
                  <td className="px-4 py-4">
                    <ResumeButton appId={app.id} jobId={jobId} />
                  </td>
                  {/* Notes */}
                  <td className="px-4 py-4 min-w-[200px]">
                    <NotesCell
                      appId={app.id}
                      jobId={jobId}
                      initialNotes={app.notes}
                    />
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
