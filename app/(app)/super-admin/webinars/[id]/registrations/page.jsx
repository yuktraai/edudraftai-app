'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function WebinarRegistrationsPage() {
  const params = useParams()
  const slug   = params.id  // Note: this is actually the webinar ID, we fetch by ID then get slug

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')

  // First get the webinar slug from the list
  const [webinar, setWebinar] = useState(null)

  useEffect(() => {
    fetch('/api/super-admin/webinars')
      .then(r => r.json())
      .then(json => {
        const w = json.webinars?.find(x => x.id === slug)
        if (!w) { setError('Webinar not found'); setLoading(false); return }
        setWebinar(w)
        return fetch(`/api/webinar/${w.slug}/registrations`)
      })
      .then(r => r?.json())
      .then(json => {
        if (json) setData(json.registrations ?? [])
        setLoading(false)
      })
      .catch(() => { setError('Failed to load'); setLoading(false) })
  }, [slug])

  function handleCsvExport() {
    if (!webinar) return
    window.open(`/api/webinar/${webinar.slug}/registrations?format=csv`, '_blank')
  }

  const filtered = (data ?? []).filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) ||
           r.college?.toLowerCase().includes(q) || r.city?.toLowerCase().includes(q)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-teal border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <p className="text-error font-medium">{error}</p>
        <Link href="/super-admin/webinars" className="text-teal hover:underline text-sm mt-2 inline-block">← Back</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/super-admin/webinars/${slug}`} className="text-muted hover:text-navy transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-navy font-heading">Registrants</h1>
          {webinar && <p className="text-sm text-muted mt-0.5">{webinar.title}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">{filtered.length} shown / {data?.length ?? 0} total</span>
          <button
            onClick={handleCsvExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-border text-sm font-semibold text-muted hover:text-navy hover:border-navy rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Registered',  value: data.length },
            { label: 'Meet Link Sent',    value: data.filter(r => r.meet_link_sent).length },
            { label: 'Feedback Received', value: data.filter(r => r.feedback_submitted).length },
            {
              label: 'Avg Rating',
              value: data.filter(r => r.feedback_rating).length > 0
                ? (data.reduce((s, r) => s + (r.feedback_rating ?? 0), 0) / data.filter(r => r.feedback_rating).length).toFixed(1) + ' ★'
                : '—',
            },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-4">
              <p className="text-2xl font-bold text-navy">{value}</p>
              <p className="text-xs text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, college or city…"
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm bg-surface focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <p className="text-muted">{search ? 'No registrants match your search.' : 'No registrants yet.'}</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Name / Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">College</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">City</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wide">Meet</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wide">Feedback</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                  <td className="px-5 py-3.5 text-muted text-xs">{i + 1}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-navy">{r.name}</p>
                    <p className="text-xs text-muted">{r.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-muted capitalize">{r.role}</td>
                  <td className="px-4 py-3.5 text-text max-w-[180px] truncate">{r.college}</td>
                  <td className="px-4 py-3.5 text-muted">{r.city ?? '—'}</td>
                  <td className="px-4 py-3.5 text-center">
                    {r.meet_link_sent
                      ? <span className="text-success text-xs font-medium">✓ Sent</span>
                      : <span className="text-muted text-xs">Pending</span>
                    }
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {r.feedback_submitted
                      ? <span className="text-success text-xs font-medium">✓ {r.feedback_rating}★</span>
                      : <span className="text-muted text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted whitespace-nowrap">
                    {new Date(r.registered_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
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
