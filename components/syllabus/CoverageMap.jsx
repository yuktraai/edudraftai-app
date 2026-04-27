'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const STATUS_CONFIG = {
  recent:    { label: 'Recent',    bg: 'bg-teal-light',  text: 'text-teal',    border: 'border-teal',    dot: 'bg-teal' },
  stale:     { label: 'Stale',     bg: 'bg-amber-50',    text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-400' },
  uncovered: { label: 'Uncovered', bg: 'bg-red-50',      text: 'text-error',   border: 'border-red-200', dot: 'bg-error' },
}

function formatDate(iso) {
  if (!iso) return 'Never'
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * CoverageMap — grouped by unit accordion with topic rows.
 * Props:
 *   chunks     — array from /api/syllabus/[subject_id]/coverage
 *   subjectId  — string UUID (for "Generate" links)
 */
export function CoverageMap({ chunks, subjectId }) {
  const [filter, setFilter]     = useState('all')    // 'all' | 'uncovered' | 'stale' | 'recent'
  const [openUnits, setOpenUnits] = useState({})     // unit_number → boolean

  // Group chunks by unit_number
  const grouped = useMemo(() => {
    const map = {}
    for (const c of chunks) {
      const u = c.unit_number ?? 0
      if (!map[u]) map[u] = []
      map[u].push(c)
    }
    return map
  }, [chunks])

  const units = Object.keys(grouped).map(Number).sort((a, b) => a - b)

  // Default: open units that have uncovered/stale topics
  useMemo(() => {
    const defaults = {}
    for (const u of units) {
      const hasIssues = grouped[u].some(c => c.coverage_status !== 'recent')
      defaults[u] = hasIssues
    }
    setOpenUnits(defaults)
  }, [chunks])

  function toggleUnit(u) {
    setOpenUnits(prev => ({ ...prev, [u]: !prev[u] }))
  }

  const FILTERS = [
    { key: 'all',       label: 'All' },
    { key: 'uncovered', label: 'Uncovered' },
    { key: 'stale',     label: 'Stale' },
    { key: 'recent',    label: 'Recent' },
  ]

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === f.key
                ? 'bg-navy text-white border-navy'
                : 'bg-bg border-border text-muted hover:border-navy hover:text-navy'
            }`}
          >
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1.5 opacity-70">
                ({chunks.filter(c => c.coverage_status === f.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Units */}
      {units.map(u => {
        const unitChunks = grouped[u]
        const visible = filter === 'all'
          ? unitChunks
          : unitChunks.filter(c => c.coverage_status === filter)

        if (visible.length === 0) return null

        const isOpen = openUnits[u] ?? true
        const recentCount    = unitChunks.filter(c => c.coverage_status === 'recent').length
        const staleCount     = unitChunks.filter(c => c.coverage_status === 'stale').length
        const uncoveredCount = unitChunks.filter(c => c.coverage_status === 'uncovered').length

        return (
          <div key={u} className="bg-surface border border-border rounded-xl overflow-hidden">
            {/* Unit header */}
            <button
              onClick={() => toggleUnit(u)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-bg transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-navy text-sm">Unit {u}</span>
                <div className="flex gap-1.5">
                  {recentCount > 0    && <span className="text-xs px-2 py-0.5 rounded-full bg-teal-light text-teal font-medium">{recentCount} recent</span>}
                  {staleCount > 0     && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">{staleCount} stale</span>}
                  {uncoveredCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-error font-medium">{uncoveredCount} uncovered</span>}
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Topic rows */}
            {isOpen && (
              <div className="divide-y divide-border border-t border-border">
                {visible.map(chunk => {
                  const cfg = STATUS_CONFIG[chunk.coverage_status]
                  return (
                    <div key={chunk.chunk_id} className="flex items-center gap-4 px-5 py-3">
                      {/* Status dot */}
                      <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />

                      {/* Topic name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{chunk.topic_name}</p>
                        {chunk.subtopics?.length > 0 && (
                          <p className="text-xs text-muted truncate mt-0.5">
                            {chunk.subtopics.slice(0, 3).join(' · ')}
                            {chunk.subtopics.length > 3 && ` +${chunk.subtopics.length - 3} more`}
                          </p>
                        )}
                      </div>

                      {/* Status badge */}
                      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {cfg.label}
                      </span>

                      {/* Last generated date */}
                      <span className="shrink-0 text-xs text-muted w-24 text-right">
                        {formatDate(chunk.last_generated_at)}
                      </span>

                      {/* Generate link */}
                      <Link
                        href={`/generate/lesson_notes?chunk_id=${chunk.chunk_id}&subject_id=${subjectId}`}
                        className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-teal text-white font-medium hover:bg-teal-2 transition-colors"
                      >
                        Generate
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {chunks.length === 0 && (
        <div className="text-center py-16 text-muted text-sm">
          No syllabus topics found for this subject.
        </div>
      )}
    </div>
  )
}
