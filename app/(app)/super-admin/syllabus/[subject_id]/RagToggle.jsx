'use client'

/**
 * Phase 51 — RAG enabled toggle for a subject instance.
 *
 * Calls PATCH /api/rag/toggle to flip rag_enabled on the subjects row.
 * Shows a pill with current status — click to toggle.
 * Requires canonical docs to be indexed for the subject code first.
 */

import { useState } from 'react'

export function RagToggle({ subjectId, initialEnabled, subjectCode }) {
  const [enabled,  setEnabled]  = useState(initialEnabled ?? false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  async function handleToggle() {
    setLoading(true)
    setError(null)
    const next = !enabled
    try {
      const res  = await fetch('/api/rag/toggle', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subject_id: subjectId, enabled: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Toggle failed')
        return
      }
      setEnabled(data.data?.rag_enabled ?? next)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleToggle}
        disabled={loading}
        title={enabled ? 'Click to disable RAG for this subject' : 'Click to enable RAG for this subject'}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          enabled
            ? 'bg-teal-light text-teal border-teal/30 hover:bg-red-50 hover:text-error hover:border-red-200'
            : 'bg-bg text-muted border-border hover:bg-teal-light hover:text-teal hover:border-teal/30'
        }`}
      >
        {loading ? (
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        ) : (
          <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-teal' : 'bg-muted'}`} />
        )}
        RAG {enabled ? 'Enabled' : 'Disabled'}
      </button>
      {error && <p className="text-[10px] text-error">{error}</p>}
      {!enabled && subjectCode && (
        <p className="text-[10px] text-muted">
          Enable to use indexed docs for <span className="font-mono font-semibold">{subjectCode}</span>
        </p>
      )}
    </div>
  )
}
