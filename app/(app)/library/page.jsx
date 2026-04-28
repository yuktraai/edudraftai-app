'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { LibraryCard } from '@/components/library/LibraryCard'

const CONTENT_TYPES = [
  { value: '',               label: 'All Types' },
  { value: 'lesson_notes',  label: 'Lesson Notes' },
  { value: 'mcq_bank',      label: 'MCQ Bank' },
  { value: 'question_bank', label: 'Question Bank' },
  { value: 'test_plan',     label: 'Test Plan' },
]

export default function LibraryPage() {
  const router = useRouter()
  const [drafts,       setDrafts]       = useState([])
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(1)
  const [loading,      setLoading]      = useState(true)
  const [contentType,  setContentType]  = useState('')
  const [cloningId,    setCloningId]    = useState(null)
  const [cloneMsg,     setCloneMsg]     = useState(null) // { type: 'success'|'error', text, draftId }

  const pageSize = 20

  const fetchDrafts = useCallback(async (pg = 1, ct = contentType) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: pg })
      if (ct) params.set('content_type', ct)
      const res  = await fetch(`/api/library?${params}`)
      const json = await res.json()
      setDrafts(json.drafts ?? [])
      setTotal(json.total ?? 0)
      setPage(pg)
    } catch {}
    setLoading(false)
  }, [contentType])

  useEffect(() => { fetchDrafts(1, contentType) }, [contentType]) // eslint-disable-line

  async function handleClone(draftId) {
    setCloningId(draftId)
    setCloneMsg(null)
    try {
      const res  = await fetch('/api/library/clone', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ source_draft_id: draftId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setCloneMsg({ type: 'error', text: json.error ?? 'Clone failed' })
      } else {
        setCloneMsg({ type: 'success', text: 'Draft cloned!', draftId: json.cloned_draft_id })
        // Refresh clone count
        fetchDrafts(page, contentType)
      }
    } catch {
      setCloneMsg({ type: 'error', text: 'Network error' })
    }
    setCloningId(null)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-6 md:p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Department Library</h1>
          <p className="text-muted text-sm mt-1">Browse and clone published content shared by colleagues in your college.</p>
        </div>
      </div>

      {/* Clone success banner */}
      {cloneMsg?.type === 'success' && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-teal/10 border border-teal/20">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-sm font-medium text-teal">{cloneMsg.text}</span>
          </div>
          <button
            onClick={() => router.push(`/drafts/${cloneMsg.draftId}`)}
            className="text-xs font-semibold text-teal underline hover:text-teal-2 transition-colors shrink-0"
          >
            View Draft →
          </button>
        </div>
      )}
      {cloneMsg?.type === 'error' && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-error">
          {cloneMsg.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {CONTENT_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setContentType(value)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              contentType === value
                ? 'bg-navy text-white border-navy'
                : 'bg-surface text-text border-border hover:border-navy/30'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="text-xs text-muted ml-auto">{total} result{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-bg border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="w-12 h-12 text-border mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="text-muted text-sm font-medium">No published content yet</p>
          <p className="text-muted text-xs mt-1 max-w-xs">
            When colleagues publish their drafts to the library, they&apos;ll appear here for you to clone.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.map((draft) => (
              <LibraryCard
                key={draft.id}
                draft={draft}
                onClone={handleClone}
                cloning={cloningId === draft.id}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => fetchDrafts(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm border border-border text-text hover:bg-bg disabled:opacity-40 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm text-muted">Page {page} of {totalPages}</span>
              <button
                onClick={() => fetchDrafts(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-sm border border-border text-text hover:bg-bg disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
