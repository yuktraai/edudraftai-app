'use client'

import { useState, useEffect, useCallback } from 'react'
import { DraftCard } from '@/components/generation/DraftCard'

const CONTENT_TYPES = [
  { value: '',               label: 'All Types' },
  { value: 'lesson_notes',   label: 'Lesson Notes' },
  { value: 'mcq_bank',       label: 'MCQ Bank' },
  { value: 'question_bank',  label: 'Question Bank' },
  { value: 'test_plan',      label: 'Internal Test' },
]

const selectCls =
  'px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text ' +
  'focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

export default function DraftsPage() {
  const [data,        setData]        = useState([])
  const [total,       setTotal]       = useState(0)
  const [subjects,    setSubjects]    = useState([])
  const [page,        setPage]        = useState(1)
  const [contentType, setContentType] = useState('')
  const [subjectId,   setSubjectId]   = useState('')
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)

  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page })
      if (contentType) params.set('content_type', contentType)
      if (subjectId)   params.set('subject_id', subjectId)

      const res  = await fetch(`/api/drafts?${params}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to load'); setLoading(false); return }

      setData(json.data ?? [])
      setTotal(json.total ?? 0)
      if (json.subjects?.length) setSubjects(json.subjects)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, contentType, subjectId])

  useEffect(() => { load() }, [load])

  // Reset page when filters change
  function handleContentTypeChange(e) { setContentType(e.target.value); setPage(1) }
  function handleSubjectChange(e)     { setSubjectId(e.target.value);   setPage(1) }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">My Drafts</h1>
          <p className="text-muted text-sm mt-1">
            {total > 0 ? `${total} generation${total !== 1 ? 's' : ''} saved` : 'Your generated content will appear here'}
          </p>
        </div>
        <a
          href="/generate"
          className="flex items-center gap-2 px-4 py-2 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Generation
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={contentType} onChange={handleContentTypeChange} className={selectCls}>
          {CONTENT_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select value={subjectId} onChange={handleSubjectChange} className={selectCls} disabled={subjects.length === 0}>
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {(contentType || subjectId) && (
          <button
            onClick={() => { setContentType(''); setSubjectId(''); setPage(1) }}
            className="px-3 py-2 text-xs font-medium text-muted border border-border rounded-lg hover:border-text hover:text-text transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-muted">
          {loading ? 'Loading…' : `Showing ${data.length} of ${total}`}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 bg-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-error">
          {error}
          <button onClick={load} className="ml-3 underline hover:no-underline">Retry</button>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bg flex items-center justify-center mb-4 border border-border">
            <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-text mb-1">
            {contentType || subjectId ? 'No drafts match your filters' : 'No drafts yet'}
          </p>
          <p className="text-xs text-muted">
            {contentType || subjectId
              ? 'Try clearing the filters above.'
              : 'Generate your first piece of content to see it here.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.map((draft) => (
              <DraftCard key={draft.id} draft={draft} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-sm font-medium text-muted border border-border rounded-lg hover:border-teal hover:text-teal transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-sm text-muted px-3">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 text-sm font-medium text-muted border border-border rounded-lg hover:border-teal hover:text-teal transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
