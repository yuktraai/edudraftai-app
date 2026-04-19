'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * ClearSyllabusButton
 *
 * Shows a danger button that, when clicked, opens a confirmation modal and
 * then calls DELETE /api/super-admin/syllabus/[subjectId].
 *
 * Props:
 *   subjectId    — UUID of the subject to clear
 *   subjectName  — Human-readable name shown in the confirmation modal
 *   onCleared    — Optional callback called after successful clear (before router.refresh)
 *   redirectTo   — Optional path to push to after clear (e.g. '/super-admin/syllabus')
 *   size         — 'sm' (inline table button) | 'md' (standalone button)
 */
export function ClearSyllabusButton({
  subjectId,
  subjectName,
  onCleared,
  redirectTo,
  size = 'md',
}) {
  const router = useRouter()
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/super-admin/syllabus/${subjectId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Clear failed')
        setLoading(false)
        return
      }
      setOpen(false)
      onCleared?.()
      if (redirectTo) {
        router.push(redirectTo)
      } else {
        router.refresh()
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  // ── Trigger button (size variants) ────────────────────────────────────────
  const triggerBtn = size === 'sm' ? (
    <button
      onClick={() => setOpen(true)}
      className="text-xs text-error hover:underline font-medium"
    >
      Clear
    </button>
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-error text-sm font-semibold rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
      </svg>
      Clear Syllabus
    </button>
  )

  return (
    <>
      {triggerBtn}

      {/* ── Confirmation modal ──────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">

            {/* Icon + title */}
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading font-bold text-navy text-base">Clear syllabus data?</h3>
                <p className="text-sm text-muted mt-1">
                  This will permanently delete all chunks, uploaded files and storage objects for:
                </p>
                <p className="text-sm font-semibold text-text mt-1">"{subjectName}"</p>
              </div>
            </div>

            {/* What gets deleted checklist */}
            <ul className="space-y-1.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-error">
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                All syllabus chunks (topics + subtopics)
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                All uploaded PDF records
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                PDF files from storage
              </li>
            </ul>

            <p className="text-xs text-muted">
              Generated drafts are <strong>not affected</strong>. You can re-upload a fresh PDF after clearing.
            </p>

            {error && (
              <p className="text-xs text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setOpen(false); setError(null) }}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-muted border border-border rounded-xl hover:border-text hover:text-text transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-error text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Clearing…
                  </>
                ) : (
                  'Yes, clear syllabus'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
