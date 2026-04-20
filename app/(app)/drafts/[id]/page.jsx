'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MathContent } from '@/components/ui/MathContent'
import { FeedbackBar } from '@/components/generation/FeedbackBar'
import { splitAnswerKey } from '@/lib/export/parseAnswerKey'

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
  const [draft,      setDraft]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [copied,     setCopied]     = useState(false)
  const [feedback,   setFeedback]   = useState(null) // { rating, feedback_text }
  const [showDelete, setShowDelete] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [showKey,    setShowKey]    = useState(true)  // teacher view: answer key visible by default

  useEffect(() => {
    if (!id) return
    Promise.all([
      fetch(`/api/drafts/${id}`).then(r => r.json()),
      fetch(`/api/feedback?generation_id=${id}`).then(r => r.json()).catch(() => ({ data: null })),
    ]).then(([draftRes, feedbackRes]) => {
      if (draftRes.error || !draftRes.data) setError(draftRes.error ?? 'Draft not found')
      else {
        setDraft(draftRes.data)
        setFeedback(feedbackRes.data ?? null)
      }
    }).catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false))
  }, [id])

  // Parse answer key — memoised so it only re-runs when raw_output changes
  const { content: questionsOnly, answerKey } = useMemo(
    () => splitAnswerKey(draft?.raw_output ?? ''),
    [draft?.raw_output]
  )
  const hasAnswerKey      = !!answerKey
  const displayContent    = showKey ? (draft?.raw_output ?? '') : questionsOnly
  const isDemoGeneration  = draft?.metadata?.is_demo === true

  async function handleCopy() {
    await navigator.clipboard.writeText(displayContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleExportTxt() {
    const topic    = draft.prompt_params?.topic ?? 'draft'
    const type     = draft.content_type ?? 'content'
    const date     = new Date(draft.created_at).toISOString().slice(0, 10)
    const keySuffix = hasAnswerKey ? (showKey ? '_with_key' : '_questions_only') : ''
    const filename = `${type}_${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${date}${keySuffix}.txt`
    const blob     = new Blob([displayContent], { type: 'text/plain;charset=utf-8' })
    const url      = URL.createObjectURL(blob)
    const a        = document.createElement('a')
    a.href         = url
    a.download     = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function handlePrint(withKey = true) {
    const keyParam = hasAnswerKey ? `&key=${withKey ? '1' : '0'}` : ''
    window.open(`/print/${id}?autoprint=1${keyParam}`, '_blank')
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
            <div className="flex items-center gap-2 no-print shrink-0 flex-wrap">
              {/* Answer key toggle — only for MCQ / Question Bank */}
              {hasAnswerKey && (
                <button
                  onClick={() => setShowKey(p => !p)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    showKey
                      ? 'bg-teal text-white border-teal hover:bg-teal-2'
                      : 'text-muted border-border hover:border-teal hover:text-teal'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {showKey
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      : <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    }
                  </svg>
                  {showKey ? 'Answer Key: ON' : 'Answer Key: OFF'}
                </button>
              )}

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

              {/* Print buttons — split into two when answer key exists */}
              {hasAnswerKey ? (
                <>
                  <button
                    onClick={() => handlePrint(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted border border-border rounded-lg hover:border-teal hover:text-teal transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                    </svg>
                    Print w/ Key
                  </button>
                  <button
                    onClick={() => handlePrint(false)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted border border-border rounded-lg hover:border-teal hover:text-teal transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                    </svg>
                    Print w/o Key
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handlePrint()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted border border-border rounded-lg hover:border-teal hover:text-teal transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                  </svg>
                  Print / PDF
                </button>
              )}

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
            {isDemoGeneration && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-xs font-medium text-warning">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0l6.354 10.748z" />
                </svg>
                Demo
              </span>
            )}
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
          <div className="px-5 py-3 border-b border-border bg-bg flex items-center justify-between print-toolbar">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-muted">Generated content</span>
            </div>
            {hasAnswerKey && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                showKey ? 'bg-teal-light text-teal border-teal' : 'bg-bg text-muted border-border'
              }`}>
                {showKey ? 'Teacher View (with answers)' : 'Student View (questions only)'}
              </span>
            )}
          </div>
          <div className="p-6 print-article">
            {isDemoGeneration && (
              <div className="mb-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 no-print">
                <svg className="w-4 h-4 text-warning shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-warning">Demo Output</p>
                  <p className="text-xs text-amber-700 mt-0.5">This was generated using one of your 3 free demo credits. Ask your college admin to allocate credits for full access.</p>
                </div>
              </div>
            )}
            <div className="relative">
              {isDemoGeneration && (
                <div
                  aria-hidden="true"
                  className="no-print"
                  style={{
                    position: 'absolute', inset: 0, zIndex: 1,
                    backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 60px, rgba(0,0,0,0.03) 60px, rgba(0,0,0,0.03) 120px)',
                    pointerEvents: 'none',
                    overflow: 'hidden',
                  }}
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      top: `${i * 14}%`,
                      left: '-20%',
                      width: '140%',
                      textAlign: 'center',
                      transform: 'rotate(-30deg)',
                      fontSize: 28,
                      fontWeight: 700,
                      color: 'rgba(0,0,0,0.04)',
                      letterSpacing: '0.1em',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}>
                      EduDraftAI Demo &nbsp;&nbsp;&nbsp; EduDraftAI Demo &nbsp;&nbsp;&nbsp; EduDraftAI Demo
                    </div>
                  ))}
                </div>
              )}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <MathContent content={displayContent} />
              </div>
            </div>
            <FeedbackBar
              generationId={id}
              initialRating={feedback?.rating ?? null}
              initialFeedback={feedback?.feedback_text ?? ''}
            />
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
