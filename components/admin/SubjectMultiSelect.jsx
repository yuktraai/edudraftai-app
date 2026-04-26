'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * SubjectMultiSelect
 *
 * Props:
 *   subjects      — array of { id, name, code, semester }
 *   selectedIds   — Set or array of selected subject IDs
 *   onChange(ids) — called with new array of IDs when selection changes
 */
export function SubjectMultiSelect({ subjects = [], selectedIds = [], onChange }) {
  const [open, setOpen]       = useState(false)
  const [search, setSearch]   = useState('')
  const containerRef          = useRef(null)
  const searchRef             = useRef(null)

  // Normalise selectedIds to a Set for O(1) lookup
  const selected = selectedIds instanceof Set ? selectedIds : new Set(selectedIds)

  // Sort subjects: semester ASC, then name ASC
  const sorted = [...subjects].sort((a, b) => {
    if (a.semester !== b.semester) return a.semester - b.semester
    return a.name.localeCompare(b.name)
  })

  // Filter by search term
  const q = search.trim().toLowerCase()
  const visible = q
    ? sorted.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.code ?? '').toLowerCase().includes(q)
      )
    : sorted

  // Toggle a single subject
  const toggle = useCallback(
    (id) => {
      const next = new Set(selected)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      onChange([...next])
    },
    [selected, onChange]
  )

  // Clear all
  const clearAll = useCallback(() => {
    onChange([])
  }, [onChange])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus()
    }
  }, [open])

  const count = selected.size
  const total = subjects.length

  // Trigger button label
  const triggerLabel =
    count === 0
      ? 'All Subjects'
      : count === 1
      ? [...selected]
          .map((id) => subjects.find((s) => s.id === id)?.name ?? id)
          .join('')
      : null // rendered as badge below

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent hover:border-teal transition-colors"
      >
        {count === 0 && <span className="text-muted">All Subjects</span>}
        {count === 1 && <span>{triggerLabel}</span>}
        {count > 1 && (
          <>
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
              style={{ background: 'var(--teal)', color: '#fff' }}
            >
              {count}
            </span>
            <span>subjects selected</span>
          </>
        )}
        {/* Chevron */}
        <svg
          className={`w-4 h-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-surface border border-border rounded-xl shadow-lg min-w-[280px]">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects…"
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-bg text-sm text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
            />
          </div>

          {/* Subject list */}
          <ul className="max-h-64 overflow-y-auto py-1">
            {visible.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted text-center">No subjects found</li>
            )}
            {visible.map((s) => {
              const checked = selected.has(s.id)
              return (
                <li key={s.id}>
                  <label className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-bg transition-colors">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(s.id)}
                      className="w-4 h-4 rounded border-border"
                      style={{ accentColor: 'var(--teal)' }}
                    />
                    <span className="flex-1 text-sm text-text truncate">{s.name}</span>
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded"
                      style={{
                        background: 'var(--teal-light)',
                        color: 'var(--teal)',
                      }}
                    >
                      Sem {s.semester}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted">
            {count > 0 ? (
              <button
                type="button"
                onClick={clearAll}
                className="text-teal hover:underline focus:outline-none"
              >
                Clear all
              </button>
            ) : (
              <span />
            )}
            <span>
              {count} of {total} selected
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
