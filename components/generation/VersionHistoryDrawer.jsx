'use client'

import { useState, useEffect } from 'react'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-IN', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

/**
 * VersionHistoryDrawer
 * Right-side slide-over showing all versions of a draft.
 * Allows previewing and restoring any previous version.
 *
 * Props:
 *   draftId       — UUID of the draft
 *   isOpen        — boolean
 *   onClose       — () => void
 *   onRestored    — () => void  called after a successful restore (parent should reload)
 */
export function VersionHistoryDrawer({ draftId, isOpen, onClose, onRestored }) {
  const [versions, setVersions]     = useState([])
  const [loading, setLoading]       = useState(false)
  const [selected, setSelected]     = useState(null)   // version object with content
  const [loadingContent, setLoadingContent] = useState(false)
  const [restoring, setRestoring]   = useState(false)
  const [error, setError]           = useState(null)

  useEffect(() => {
    if (!isOpen || !draftId) return
    fetchVersions()
  }, [isOpen, draftId])

  async function fetchVersions() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/drafts/${draftId}/versions`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load versions')
      setVersions(data.versions ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectVersion(version) {
    if (selected?.id === version.id) {
      setSelected(null)
      return
    }
    setLoadingContent(true)
    try {
      // Fetch full content for this version
      const res  = await fetch(`/api/drafts/${draftId}/versions/${version.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load version content')
      setSelected({ ...version, content: data.content })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingContent(false)
    }
  }

  async function handleRestore(version) {
    if (!confirm(`Restore to version ${version.version_number}? The current content will be saved as a new version.`)) return
    setRestoring(true)
    setError(null)
    try {
      const res  = await fetch(`/api/drafts/${draftId}/restore`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ versionId: version.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Restore failed')
      onClose()
      onRestored?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setRestoring(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface border-l border-border shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="font-bold text-navy text-base">Version History</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="mx-4 mt-4 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
              {error}
            </div>
          )}

          {!loading && !error && versions.length === 0 && (
            <div className="text-center py-16 text-muted text-sm">
              No versions found for this draft.
            </div>
          )}

          {!loading && versions.length > 0 && (
            <div className="divide-y divide-border">
              {[...versions].reverse().map((v) => {
                const isCurrent  = v.version_number === Math.max(...versions.map(x => x.version_number))
                const isSelected = selected?.id === v.id

                return (
                  <div key={v.id} className={`p-4 transition-colors ${isSelected ? 'bg-teal-light' : 'hover:bg-bg'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <button
                        className="flex-1 text-left"
                        onClick={() => handleSelectVersion(v)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-bold ${isSelected ? 'text-teal' : 'text-navy'}`}>
                            Version {v.version_number}
                          </span>
                          {isCurrent && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-teal text-white font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted">{formatDate(v.created_at)}</p>
                        {v.instruction && (
                          <p className="text-xs text-muted mt-1 italic">"{v.instruction}"</p>
                        )}
                      </button>

                      {/* Restore button — only for non-current versions */}
                      {!isCurrent && (
                        <button
                          onClick={() => handleRestore(v)}
                          disabled={restoring}
                          className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-border bg-bg text-text hover:border-teal hover:text-teal transition-colors disabled:opacity-50"
                        >
                          {restoring ? '…' : 'Restore'}
                        </button>
                      )}
                    </div>

                    {/* Version content preview */}
                    {isSelected && (
                      <div className="mt-3 rounded-lg border border-border bg-surface p-3 max-h-64 overflow-y-auto">
                        {loadingContent ? (
                          <div className="flex justify-center py-4">
                            <div className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : (
                          <pre className="text-xs text-text whitespace-pre-wrap font-mono leading-relaxed">
                            {selected?.content?.slice(0, 1200)}
                            {(selected?.content?.length ?? 0) > 1200 && (
                              <span className="text-muted">…{selected.content.length - 1200} more characters</span>
                            )}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-border bg-bg">
          <p className="text-xs text-muted text-center">
            Restoring a version creates a new version — nothing is permanently lost.
          </p>
        </div>
      </div>
    </>
  )
}
