'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

/**
 * BulkProgressBar
 * Polls /api/generate/bulk/status every 3 seconds until the parent
 * generation is no longer 'generating', then calls onComplete().
 *
 * Props:
 *   parentId   {string}   — UUID of the parent generation row
 *   topicCount {number}   — total topics expected (for initial render before first poll)
 *   onComplete {function} — called once when generation finishes (completed or failed)
 */
export function BulkProgressBar({ parentId, topicCount, onComplete }) {
  const [state, setState] = useState({
    completed: 0,
    failed:    0,
    total:     topicCount,
    status:    'generating',
  })
  const intervalRef = useRef(null)
  const doneRef     = useRef(false)

  useEffect(() => {
    if (!parentId) return

    async function poll() {
      try {
        const res  = await fetch(`/api/generate/bulk/status?parent_id=${parentId}`)
        if (!res.ok) return
        const data = await res.json()

        setState({
          completed: data.completed ?? 0,
          failed:    data.failed    ?? 0,
          total:     data.total     ?? topicCount,
          status:    data.status    ?? 'generating',
        })

        if (data.status !== 'generating' && !doneRef.current) {
          doneRef.current = true
          clearInterval(intervalRef.current)
          onComplete?.()
        }
      } catch {
        // Non-fatal polling error — keep trying
      }
    }

    // Poll immediately, then every 3 seconds
    poll()
    intervalRef.current = setInterval(poll, 3000)

    return () => clearInterval(intervalRef.current)
  }, [parentId]) // eslint-disable-line react-hooks/exhaustive-deps

  const { completed, failed, total, status } = state
  const isGenerating = status === 'generating'
  const pct          = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="rounded-xl bg-bg border border-border p-4 space-y-3 mt-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isGenerating ? (
            <svg
              className="w-4 h-4 text-teal animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className="text-sm font-semibold text-text">
            {isGenerating
              ? `Generating ${completed} of ${total} topics\u2026`
              : `\u2713 ${completed} draft${completed !== 1 ? 's' : ''} ready!${failed > 0 ? ` (${failed} failed)` : ''}`}
          </span>
        </div>

        <span className="text-xs font-semibold text-teal tabular-nums">
          {pct}%
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-teal rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted">
          {completed > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              {completed} completed
            </span>
          )}
          {failed > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-error inline-block" />
              {failed} failed
            </span>
          )}
          {isGenerating && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-border inline-block" />
              {total - completed - failed} pending
            </span>
          )}
        </div>

        {!isGenerating && completed > 0 && (
          <Link
            href="/drafts"
            className="text-xs font-medium text-teal hover:text-teal-2 transition-colors underline underline-offset-2"
          >
            View drafts &rarr;
          </Link>
        )}
      </div>
    </div>
  )
}
