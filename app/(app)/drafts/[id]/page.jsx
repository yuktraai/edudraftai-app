'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

const TYPE_META = {
  lesson_notes:  { label: 'Lesson Notes',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  mcq_bank:      { label: 'MCQ Bank',        color: 'bg-purple-50 text-purple-700 border-purple-200' },
  question_bank: { label: 'Question Bank',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
  test_plan:     { label: 'Internal Test',   color: 'bg-teal-light text-teal border-teal' },
}

const MODEL_LABELS = {
  'gpt-4o':                    'GPT-4o',
  'claude-3-5-sonnet-20241022':'Claude 3.5 Sonnet',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function estimateWords(text) {
  if (!text) return 0
  return text.trim().split(/\s+/).length
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({ onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-text">Delete this draft?</h3>
            <p className="text-xs text-muted mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-muted border border-border rounded-xl hover:border-text hover:text-text transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-error text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DraftDetailPage() {
  const { id }   = useParams()
  const router   = useRouter()
  const [draft,    setDraft]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [copied,   setCopied]   = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/drafts/${id}`)
      .then(r => r.json())
      .then(({ data, error: e }) => {
        if (e || !data) setError(e ?? 'Draft not found')
        else setDraft(data)
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleCopy() {
    await navigator.clipboard.writeText(draft.raw_output ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleExportTxt() {
    const topic    = draft.prompt_params?.topic ?? 'draft'
    const type     = draft.content_type ?? 'content'
    const date     = new Date(draft.created_at).toISOString().slice(0, 10)
    const filename = `${type}_${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${date}.txt`
    const blob     = new Blob([draft.raw_output ?? ''], { type: 'text/plain;charset=utf-8' })
    const url      = URL.createObjectURL(blob)
    const a        = document.createElement('a')
    a.href         = url
    a.download     = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function handlePrint() {
    window.print()
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/drafts/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json()
        alert(j.error ?? 'Delete failed')
        setDeleting(false)
        return
      }
      router.push('/drafts')
    } catch {
      alert('Network error. Please try again.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl space-y-4">
        <div className="h-8 w-48 bg-border rounded animate-pulse" />
        <div className="h-4 w-96 bg-border rounded animate-pulse" />
        <div className="h-96 bg-border rounded-xl animate-pulse mt-6" />
      </div>
    )
  }

  if (error || !draft) {
    return (
      <div className="p-8 max-w-4xl">
        <p className="text-error text-sm mb-3">{error ?? 'Draft not found.'}</p>
        <button onClick={() => router.push('/drafts')} className="text-sm text-teal hover:underline">
          ← Back to drafts
        </button>
      </div>
    )
  }

  const meta       = TYPE_META[draft.content_type] ?? { label: draft.content_type, color: 'bg-bg text-muted border-border' }
  const topic      = draft.prompt_params?.topic ?? '—'
  const parentTopic = draft.prompt_params?.parent_topic
  const subject    = draft.subjects?.name ?? 'Unknown Subject'
  const semester   = draft.subjects?.semester
  const words      = estimateWords(draft.raw_output)
  const model      = MODEL_LABELS[draft.ai_model] ?? draft.ai_model ?? '—'

  return (
    <>
      {/* Print-only styles — layout reset is in globals.css; these are draft-specific */}
      <style>{`
        @media print {
          /* Full width, no padding */
          .print-content { max-width: 100% !important; padding: 0 !important; }

          /* Strip card chrome */
          .print-card { border: none !important; box-shadow: none !important; border-radius: 0 !important; background: transparent !important; }

          /* Hide toolbar bar inside content card */
          .print-toolbar { display: none !important; }

          /* Content area — no overflow clipping */
          .print-article { overflow: visible !important; max-height: none !important; height: auto !important; }

          /* Title block separator */
          .print-title-block { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #ccc !important; }

          /* Avoid splitting headings/lists across pages */
          h1, h2, h3, h4, h5, h6 { page-break-after: avoid; break-after: avoid; }
          ul, ol, table { page-break-inside: avoid; break-inside: avoid; }
          article { width: 100% !important; max-width: 100% !important; }
        }
      `}</style>

      <div className="p-8 max-w-4xl space-y-6 print-content">
        {/* Back button */}
        <button
          onClick={() => router.push('/drafts')}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors no-print"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to drafts
        </button>

        {/* Header card */}
        <div className="bg-surface border border-border rounded-xl p-6 print-card print-title-block">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2 min-w-0">
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.color}`}>
                {meta.label}
              </span>
              <div>
                <p className="text-xs text-muted">
                  {subject}{semester ? ` · Semester ${semester}` : ''}
                </p>
                <h1 className="font-heading text-xl font-bold text-navy mt-0.5 leading-snug">
                  {parentTopic ? (
                    <>
                      <span className="text-muted font-normal text-base">{parentTopic} › </span>
                      {topic}
                    </>
                  ) : topic}
                </h1>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 no-print shrink-0">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted border border-border rounded-lg hover:border-teal hover:text-teal transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                    </svg>
                    Copy
                  </>
                )}
              </button>

              <button
                onClick={handleExportTxt}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted border border-border rounded-lg hover:border-teal hover:text-teal transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export TXT
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted border border-border rounded-lg hover:border-teal hover:text-teal transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                Print / PDF
              </button>

              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-error border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Delete
              </button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {formatDate(draft.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              {model}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              {words.toLocaleString()} words
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-success">{draft.credits_used ?? 1} credit used</span>
            </span>
            {draft.generation_ms && (
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {(draft.generation_ms / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>

        {/* Content viewer */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden print-card">
          <div className="px-5 py-3 border-b border-border bg-bg flex items-center gap-2 print-toolbar">
            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-muted">Generated content</span>
          </div>
          <div className="p-6 print-article">
            <article className="prose prose-sm max-w-none prose-headings:text-navy prose-headings:font-heading prose-h2:text-lg prose-h3:text-base prose-p:text-text prose-li:text-text prose-strong:text-text prose-code:text-navy prose-code:bg-bg prose-code:rounded prose-code:px-1">
              <ReactMarkdown>
                {draft.raw_output ?? ''}
              </ReactMarkdown>
            </article>
          </div>
        </div>

        {/* Delete modal */}
        {showDelete && (
          <DeleteModal
            onConfirm={handleDelete}
            onCancel={() => setShowDelete(false)}
            deleting={deleting}
          />
        )}
      </div>
    </>
  )
}
