'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

function StarRating({ rating }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <svg key={n} className={`w-4 h-4 ${n <= rating ? 'text-yellow-400' : 'text-border'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

function FeedbackModal({ reg, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-lg p-6 space-y-5" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-navy">{reg.name}</h2>
            <p className="text-sm text-muted">{reg.email}</p>
            {reg.college && <p className="text-xs text-muted mt-0.5">{reg.college}{reg.city ? ` · ${reg.city}` : ''}</p>}
          </div>
          <button onClick={onClose} className="text-muted hover:text-navy transition-colors mt-0.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {reg.feedback_submitted ? (
          <div className="space-y-4">
            {/* Rating */}
            <div className="flex items-center justify-between py-3 px-4 bg-bg rounded-xl border border-border">
              <span className="text-sm font-medium text-text">Overall Rating</span>
              <div className="flex items-center gap-2">
                <StarRating rating={reg.feedback_rating} />
                <span className="text-sm font-bold text-navy">{reg.feedback_rating}/5</span>
              </div>
            </div>

            {/* Yes/No questions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="py-3 px-4 bg-bg rounded-xl border border-border text-center">
                <p className="text-xs text-muted mb-1">Found Useful?</p>
                <p className={`text-sm font-bold ${reg.feedback_found_useful ? 'text-success' : reg.feedback_found_useful === false ? 'text-error' : 'text-muted'}`}>
                  {reg.feedback_found_useful === null ? '—' : reg.feedback_found_useful ? '✓ Yes' : '✗ No'}
                </p>
              </div>
              <div className="py-3 px-4 bg-bg rounded-xl border border-border text-center">
                <p className="text-xs text-muted mb-1">Would Recommend?</p>
                <p className={`text-sm font-bold ${reg.feedback_would_recommend ? 'text-success' : reg.feedback_would_recommend === false ? 'text-error' : 'text-muted'}`}>
                  {reg.feedback_would_recommend === null ? '—' : reg.feedback_would_recommend ? '✓ Yes' : '✗ No'}
                </p>
              </div>
            </div>

            {/* Comment */}
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Comment</p>
              {reg.feedback_comment
                ? <p className="text-sm text-text bg-bg border border-border rounded-xl px-4 py-3 leading-relaxed">{reg.feedback_comment}</p>
                : <p className="text-sm text-muted italic">No comment left.</p>
              }
            </div>

            {/* Submitted at */}
            {reg.feedback_at && (
              <p className="text-xs text-muted text-right">
                Submitted {new Date(reg.feedback_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted text-sm">This participant has not submitted feedback yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WebinarRegistrationsPage() {
  const params = useParams()
  const slug   = params.id

  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [search,     setSearch]     = useState('')
  const [webinar,    setWebinar]    = useState(null)
  const [selected,   setSelected]   = useState(null)   // reg opened in modal

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
            { label: 'Meeting Link Sent',  value: data.filter(r => r.meet_link_sent).length },
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
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors cursor-pointer"
                >
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
                    {r.feedback_submitted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <StarRating rating={r.feedback_rating} />
                        <span>{r.feedback_rating}★</span>
                      </span>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
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
          <p className="text-xs text-muted text-center py-3 border-t border-border">
            Click any row to view participant details and feedback
          </p>
        </div>
      )}

      {/* Feedback detail modal */}
      {selected && <FeedbackModal reg={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
