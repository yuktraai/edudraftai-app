'use client'

import { useState, useEffect } from 'react'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isNew(iso) {
  if (!iso) return false
  return (Date.now() - new Date(iso).getTime()) < 7 * 24 * 60 * 60 * 1000
}

export default function WhatsNewPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/changelog')
      .then(r => r.json())
      .then(({ entries }) => {
        setEntries(entries ?? [])
        setLoading(false)
        // Mark all as read
        if (entries?.length) {
          fetch('/api/changelog/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entryIds: entries.map(e => e.id) }),
          }).catch(() => {})
        }
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-navy">What's New</h1>
        <p className="text-muted text-sm mt-1">Latest updates and improvements to EduDraftAI.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-bg border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-12 h-12 text-border mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
          </svg>
          <p className="text-muted text-sm">No announcements yet. Check back soon!</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-border" />

          <div className="space-y-6">
            {entries.map((entry) => (
              <div key={entry.id} className="flex gap-5">
                {/* Dot */}
                <div className="shrink-0 mt-1 w-7 h-7 rounded-full bg-teal flex items-center justify-center z-10">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {/* Card */}
                <div className="flex-1 bg-surface border border-border rounded-xl p-5 hover:border-teal/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-text">{entry.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {isNew(entry.published_at) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal text-white">NEW</span>
                      )}
                      <span className="text-xs text-muted">{formatDate(entry.published_at)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{entry.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
