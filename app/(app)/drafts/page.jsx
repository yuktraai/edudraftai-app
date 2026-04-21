'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { DraftCard } from '@/components/generation/DraftCard'

const CONTENT_TYPES = [
  { value: '',               label: 'All Types' },
  { value: 'lesson_notes',   label: 'Lesson Notes' },
  { value: 'mcq_bank',       label: 'MCQ Bank' },
  { value: 'question_bank',  label: 'Question Bank' },
  { value: 'test_plan',      label: 'Internal Test' },
  { value: 'exam_paper',     label: 'Exam Paper' },
]

const selectCls =
  'px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text ' +
  'focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

// ── Folder Panel ──────────────────────────────────────────────────────────────

function FolderPanel({ folders, unfolderedCount, selectedFolder, onSelect, onFolderCreated, onFolderRenamed, onFolderDeleted }) {
  const [showNew,      setShowNew]      = useState(false)
  const [newName,      setNewName]      = useState('')
  const [creating,     setCreating]     = useState(false)
  const [editingId,    setEditingId]    = useState(null)
  const [editName,     setEditName]     = useState('')
  const [folderErr,    setFolderErr]    = useState('')
  const newInputRef  = useRef(null)
  const editInputRef = useRef(null)

  useEffect(() => { if (showNew) newInputRef.current?.focus() }, [showNew])
  useEffect(() => { if (editingId) editInputRef.current?.focus() }, [editingId])

  async function handleCreate(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    setFolderErr('')
    try {
      const res  = await fetch('/api/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
      const json = await res.json()
      if (!res.ok) { setFolderErr(json.error ?? 'Failed to create'); return }
      onFolderCreated(json.folder)
      setNewName('')
      setShowNew(false)
    } finally {
      setCreating(false)
    }
  }

  async function handleRename(id) {
    const name = editName.trim()
    if (!name) return
    setFolderErr('')
    try {
      const res  = await fetch(`/api/folders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
      const json = await res.json()
      if (!res.ok) { setFolderErr(json.error ?? 'Failed to rename'); return }
      onFolderRenamed(json.folder)
      setEditingId(null)
    } catch { setFolderErr('Network error') }
  }

  async function handleDelete(id, folderName) {
    if (!confirm(`Delete folder "${folderName}"? Drafts inside will move to All Drafts.`)) return
    try {
      await fetch(`/api/folders/${id}`, { method: 'DELETE' })
      onFolderDeleted(id)
      if (selectedFolder === id) onSelect('all')
    } catch { /* non-fatal */ }
  }

  const totalCount = unfolderedCount + folders.reduce((s, f) => s + (f.draft_count ?? 0), 0)

  return (
    <div className="flex flex-col h-full">
      {/* "All Drafts" row */}
      <button
        onClick={() => onSelect('all')}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
          selectedFolder === 'all' ? 'bg-teal text-white' : 'text-text hover:bg-bg'
        }`}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          All Drafts
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedFolder === 'all' ? 'bg-white/20 text-white' : 'bg-bg text-muted'}`}>
          {totalCount}
        </span>
      </button>

      {/* Unfoldered row */}
      {unfolderedCount > 0 && (
        <button
          onClick={() => onSelect('none')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
            selectedFolder === 'none' ? 'bg-teal text-white' : 'text-muted hover:bg-bg hover:text-text'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586M5.25 6h.008v.008H5.25V6zm0 3h.008v.008H5.25V9zm0 3h.008v.008H5.25V12z" />
            </svg>
            Unsorted
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedFolder === 'none' ? 'bg-white/20 text-white' : 'bg-bg text-muted'}`}>
            {unfolderedCount}
          </span>
        </button>
      )}

      {/* Divider */}
      {folders.length > 0 && <div className="my-2 border-t border-border" />}

      {/* Folder list */}
      <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
        {folders.map(folder => (
          <div key={folder.id} className="group relative">
            {editingId === folder.id ? (
              <form
                onSubmit={(e) => { e.preventDefault(); handleRename(folder.id) }}
                className="flex items-center gap-1 px-2 py-1.5"
              >
                <input
                  ref={editInputRef}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') setEditingId(null) }}
                  onBlur={() => setTimeout(() => setEditingId(null), 150)}
                  className="flex-1 text-sm px-2 py-1 rounded border border-teal outline-none bg-surface"
                  maxLength={80}
                />
                <button type="submit" className="p-1 text-teal hover:text-navy">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="p-1 text-muted hover:text-error">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </form>
            ) : (
              <button
                onClick={() => onSelect(folder.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedFolder === folder.id ? 'bg-teal text-white' : 'text-text hover:bg-bg'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                  <span className="truncate">{folder.name}</span>
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${selectedFolder === folder.id ? 'bg-white/20 text-white' : 'bg-bg text-muted'}`}>
                  {folder.draft_count ?? 0}
                </span>
              </button>
            )}

            {/* Edit/Delete buttons — appear on hover */}
            {editingId !== folder.id && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-surface border border-border rounded-md shadow-sm">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingId(folder.id); setEditName(folder.name); setFolderErr('') }}
                  className="p-1 text-muted hover:text-navy transition-colors"
                  title="Rename folder"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, folder.name) }}
                  className="p-1 text-muted hover:text-error transition-colors"
                  title="Delete folder"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {folderErr && (
        <p className="text-xs text-error px-2 py-1 mt-1">{folderErr}</p>
      )}

      {/* New folder form */}
      {showNew ? (
        <form onSubmit={handleCreate} className="mt-3 flex items-center gap-1">
          <input
            ref={newInputRef}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setShowNew(false); setNewName('') } }}
            onBlur={() => setTimeout(() => { if (!creating) { setShowNew(false); setNewName('') } }, 150)}
            placeholder="Folder name…"
            className="flex-1 text-sm px-2 py-1.5 rounded-lg border border-teal outline-none bg-surface"
            maxLength={80}
            disabled={creating}
          />
          <button type="submit" disabled={creating || !newName.trim()} className="p-1.5 text-teal hover:text-navy disabled:opacity-40">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </button>
          <button type="button" onClick={() => { setShowNew(false); setNewName('') }} className="p-1.5 text-muted hover:text-error">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted border border-dashed border-border hover:border-teal hover:text-teal transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Folder
        </button>
      )}
    </div>
  )
}

// ── Move-to-folder dropdown ───────────────────────────────────────────────────

function MoveDraftDropdown({ draftId, folders, currentFolderId, onMoved }) {
  const [open,    setOpen]    = useState(false)
  const [moving,  setMoving]  = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function moveTo(folderId) {
    setMoving(true)
    setOpen(false)
    try {
      const res = await fetch(`/api/drafts/${draftId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId }),
      })
      if (res.ok) onMoved(draftId, folderId)
    } finally { setMoving(false) }
  }

  return (
    <div ref={ref} className="relative" onClick={e => e.preventDefault()}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={moving}
        className="p-1 text-muted hover:text-navy transition-colors rounded"
        title="Move to folder"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-surface border border-border rounded-xl shadow-lg py-1 text-sm">
          {currentFolderId && (
            <button
              onClick={() => moveTo(null)}
              className="w-full text-left px-3 py-2 hover:bg-bg text-muted"
            >
              Remove from folder
            </button>
          )}
          {folders.map(f => (
            <button
              key={f.id}
              onClick={() => moveTo(f.id)}
              disabled={f.id === currentFolderId}
              className="w-full text-left px-3 py-2 hover:bg-bg text-text disabled:text-muted disabled:cursor-default flex items-center justify-between"
            >
              <span className="truncate">{f.name}</span>
              {f.id === currentFolderId && (
                <svg className="w-3.5 h-3.5 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
          {folders.length === 0 && (
            <p className="px-3 py-2 text-muted text-xs">No folders yet</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Draft Card with move button ───────────────────────────────────────────────

function DraftCardWithActions({ draft, folders, folderMap, onMoved }) {
  const folderName = draft.folder_id ? (folderMap[draft.folder_id] ?? null) : null
  return (
    <div className="relative">
      <DraftCard draft={draft} folderName={folderName} />
      {/* Move button overlaid in bottom-right of card */}
      <div className="absolute bottom-3 right-[4.5rem]">
        <MoveDraftDropdown
          draftId={draft.id}
          folders={folders}
          currentFolderId={draft.folder_id}
          onMoved={onMoved}
        />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DraftsPage() {
  const [data,           setData]           = useState([])
  const [total,          setTotal]          = useState(0)
  const [subjects,       setSubjects]       = useState([])
  const [folders,        setFolders]        = useState([])
  const [unfolderedCount,setUnfolderedCount]= useState(0)
  const [page,           setPage]           = useState(1)
  const [contentType,    setContentType]    = useState('')
  const [subjectId,      setSubjectId]      = useState('')
  const [selectedFolder, setSelectedFolder] = useState('all')  // 'all' | 'none' | uuid
  const [q,              setQ]              = useState('')
  const [debouncedQ,     setDebouncedQ]     = useState('')
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [foldersLoaded,  setFoldersLoaded]  = useState(false)

  const PAGE_SIZE = 20

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [q])

  // Load folders once on mount
  useEffect(() => {
    fetch('/api/folders')
      .then(r => r.json())
      .then(json => {
        setFolders(json.folders ?? [])
        setUnfolderedCount(json.unfoldered_count ?? 0)
        setFoldersLoaded(true)
      })
      .catch(() => setFoldersLoaded(true))
  }, [])

  const folderMap = Object.fromEntries(folders.map(f => [f.id, f.name]))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page })
      if (contentType)                         params.set('content_type', contentType)
      if (subjectId)                           params.set('subject_id', subjectId)
      if (selectedFolder !== 'all')            params.set('folder_id', selectedFolder)
      if (debouncedQ)                          params.set('q', debouncedQ)

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
  }, [page, contentType, subjectId, selectedFolder, debouncedQ])

  useEffect(() => { load() }, [load])

  function handleFolderSelect(id) {
    setSelectedFolder(id)
    setPage(1)
  }

  function handleContentTypeChange(e) { setContentType(e.target.value); setPage(1) }
  function handleSubjectChange(e)     { setSubjectId(e.target.value);   setPage(1) }

  function handleFolderCreated(folder) {
    setFolders(prev => [...prev, { ...folder, draft_count: 0 }].sort((a, b) => a.name.localeCompare(b.name)))
  }

  function handleFolderRenamed(updated) {
    setFolders(prev => prev.map(f => f.id === updated.id ? { ...f, name: updated.name } : f).sort((a, b) => a.name.localeCompare(b.name)))
  }

  function handleFolderDeleted(id) {
    setFolders(prev => prev.filter(f => f.id !== id))
    // Drafts that were in this folder are now unfoldered — refresh
    load()
    fetch('/api/folders').then(r => r.json()).then(json => {
      setFolders(json.folders ?? [])
      setUnfolderedCount(json.unfoldered_count ?? 0)
    })
  }

  function handleDraftMoved(draftId, newFolderId) {
    // Update the draft in local state immediately
    setData(prev => prev.map(d => d.id === draftId ? { ...d, folder_id: newFolderId } : d))
    // Refresh folder counts
    fetch('/api/folders').then(r => r.json()).then(json => {
      setFolders(json.folders ?? [])
      setUnfolderedCount(json.unfoldered_count ?? 0)
    })
    // If we're viewing a specific folder or "none", re-fetch to remove this draft from view
    if (selectedFolder !== 'all') {
      setTimeout(load, 300)
    }
  }

  const totalPages   = Math.ceil(total / PAGE_SIZE)
  const hasFilters   = contentType || subjectId || debouncedQ || selectedFolder !== 'all'

  return (
    <div className="flex min-h-screen">
      {/* ── Left: Folder Panel ─────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-border bg-surface flex flex-col px-3 py-6 sticky top-0 self-start" style={{ minHeight: '100vh' }}>
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-1">Folders</p>
        {foldersLoaded ? (
          <FolderPanel
            folders={folders}
            unfolderedCount={unfolderedCount}
            selectedFolder={selectedFolder}
            onSelect={handleFolderSelect}
            onFolderCreated={handleFolderCreated}
            onFolderRenamed={handleFolderRenamed}
            onFolderDeleted={handleFolderDeleted}
          />
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 rounded-lg bg-border animate-pulse" />
            ))}
          </div>
        )}
      </aside>

      {/* ── Right: Draft List ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-5xl space-y-5">
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
              className="flex items-center gap-2 px-4 py-2 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-2 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New
            </a>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search by topic…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-sm text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
              {q && (
                <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <select value={contentType} onChange={handleContentTypeChange} className={selectCls}>
              {CONTENT_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select value={subjectId} onChange={handleSubjectChange} className={selectCls} disabled={subjects.length === 0}>
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.label ?? s.name}</option>
              ))}
            </select>

            {hasFilters && (
              <button
                onClick={() => { setContentType(''); setSubjectId(''); setQ(''); setSelectedFolder('all'); setPage(1) }}
                className="px-3 py-2 text-xs font-medium text-muted border border-border rounded-lg hover:border-text hover:text-text transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}

            <span className="ml-auto text-xs text-muted shrink-0">
              {loading ? 'Loading…' : `${total} result${total !== 1 ? 's' : ''}`}
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
                {hasFilters ? 'No drafts match your filters' : 'No drafts yet'}
              </p>
              <p className="text-xs text-muted">
                {hasFilters
                  ? 'Try clearing the filters or searching something else.'
                  : 'Generate your first piece of content to see it here.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.map((draft) => (
                  <DraftCardWithActions
                    key={draft.id}
                    draft={draft}
                    folders={folders}
                    folderMap={folderMap}
                    onMoved={handleDraftMoved}
                  />
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
      </main>
    </div>
  )
}
