'use client'

import { useState, useEffect, useCallback } from 'react'

const ROLE_LABELS = {
  principal:     'Principal / HOD',
  lecturer:      'Lecturer',
  college_admin: 'College Admin',
  other:         'Other',
}

export default function WaitlistPage() {
  const [entries,  setEntries]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [search,   setSearch]   = useState('')

  const limit = 50

  const fetchData = useCallback(async (pg) => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/waitlist?page=${pg}`)
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      setEntries(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(page) }, [fetchData, page])

  function exportCsv() {
    if (!entries.length) return
    const rows = [
      ['Name', 'Email', 'College', 'Role', 'Signed Up'],
      ...entries.map(e => [
        e.name,
        e.email,
        e.college_name ?? '—',
        ROLE_LABELS[e.role] ?? e.role ?? '—',
        new Date(e.created_at).toLocaleDateString('en-IN'),
      ]),
    ]
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `waitlist-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = entries.filter(e => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      e.name?.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.college_name?.toLowerCase().includes(q) ||
      e.role?.toLowerCase().includes(q)
    )
  })

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Waitlist</h1>
          <p className="text-muted text-sm mt-1">
            {total} sign-up{total !== 1 ? 's' : ''} on the EduDraftAI waitlist.
          </p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!entries.length}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-border rounded-lg text-muted hover:border-teal hover:text-teal transition-colors disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-wide">Total Sign-ups</p>
          <p className="text-3xl font-bold text-navy mt-1">{total}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-wide">With College</p>
          <p className="text-3xl font-bold text-navy mt-1">
            {entries.filter(e => e.college_name).length}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-wide">Today</p>
          <p className="text-3xl font-bold text-navy mt-1">
            {entries.filter(e => {
              const d = new Date(e.created_at)
              const today = new Date()
              return d.toDateString() === today.toDateString()
            }).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-text">Sign-ups</h2>
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 text-xs border border-border rounded-lg bg-bg text-text focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent w-48"
          />
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-10 bg-border rounded animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="px-5 py-6 text-sm text-error">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted">
            {total === 0 ? 'No sign-ups yet.' : 'No results match your search.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                {['Name', 'Email', 'College', 'Role', 'Signed Up'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-bg transition-colors">
                  <td className="px-5 py-3.5 font-medium text-text">{e.name}</td>
                  <td className="px-5 py-3.5 text-muted">{e.email}</td>
                  <td className="px-5 py-3.5 text-muted">{e.college_name ?? <span className="text-border">—</span>}</td>
                  <td className="px-5 py-3.5">
                    {e.role ? (
                      <span className="text-xs bg-bg border border-border rounded-full px-2.5 py-1">
                        {ROLE_LABELS[e.role] ?? e.role}
                      </span>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-muted text-xs whitespace-nowrap">
                    {new Date(e.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted">
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-border rounded-lg text-muted hover:border-teal hover:text-teal transition-colors disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-border rounded-lg text-muted hover:border-teal hover:text-teal transition-colors disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
