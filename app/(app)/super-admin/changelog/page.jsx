'use client'

import { useState, useEffect } from 'react'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function SuperAdminChangelogPage() {
  const [entries,  setEntries]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [isActive,    setIsActive]    = useState(true)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState(null)
  const [success,     setSuccess]     = useState(false)

  function loadEntries() {
    fetch('/api/changelog')
      .then(r => r.json())
      .then(({ entries }) => { setEntries(entries ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadEntries() }, [])

  async function handlePost(e) {
    e.preventDefault()
    setSubmitting(true); setError(null); setSuccess(false)
    try {
      const res = await fetch('/api/changelog', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title: title.trim(), description: description.trim(), is_active: isActive }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed'); return }
      setSuccess(true)
      setTitle(''); setDescription(''); setIsActive(true)
      loadEntries()
    } catch { setError('Network error') }
    finally   { setSubmitting(false) }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-navy">What's New — Manage Entries</h1>
        <p className="text-muted text-sm mt-1">Post announcements visible to all users in the What's New section.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Post form */}
        <div className="bg-surface border border-border rounded-2xl p-6 h-fit">
          <h2 className="font-semibold text-text mb-4">Post New Announcement</h2>
          <form onSubmit={handlePost} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={200} required placeholder="e.g. Dark Mode is now live 🌙" className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} maxLength={2000} required placeholder="Describe the update or new feature…" className={inputCls + ' resize-none'} />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-10 h-5 rounded-full transition-colors relative ${isActive ? 'bg-teal' : 'bg-border'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-text">{isActive ? 'Publish immediately' : 'Save as draft (hidden)'}</span>
            </div>
            {error   && <p className="text-xs text-error">{error}</p>}
            {success && <p className="text-xs text-teal font-medium">✓ Posted successfully!</p>}
            <button type="submit" disabled={submitting || !title.trim() || !description.trim()}
              className="w-full py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? 'Posting…' : 'Post Announcement'}
            </button>
          </form>
        </div>

        {/* Entries list */}
        <div className="space-y-3">
          <h2 className="font-semibold text-text">All Entries ({entries.length})</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-bg border border-border rounded-xl animate-pulse" />)}</div>
          ) : entries.length === 0 ? (
            <p className="text-muted text-sm">No entries yet.</p>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {entries.map(e => (
                <div key={e.id} className="bg-surface border border-border rounded-xl px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-text">{e.title}</p>
                    <span className="text-[10px] text-muted shrink-0">{formatDate(e.published_at)}</span>
                  </div>
                  <p className="text-xs text-muted mt-1 line-clamp-2">{e.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
