'use client'

/**
 * Phase 51.7 + Phase 52.3 — /super-admin/canonical-docs
 *
 * Manages all canonical content per SCTEVT subject code in one place:
 *   - RAG reference documents (indexed into Pinecone)
 *   - Reference books (metadata injected into AI prompts)
 */

import { useState, useEffect, useRef } from 'react'

// ── Constants ──────────────────────────────────────────────────────────────────
const DOC_TYPE_LABELS = {
  textbook:         'Textbook',
  past_paper:       'Past Paper',
  model_answer:     'Model Answer',
  reference_notes:  'Reference Notes',
}

const STATUS_CONFIG = {
  indexed:  { label: 'Indexed',   cls: 'bg-teal-light text-teal' },
  indexing: { label: 'Indexing…', cls: 'bg-amber-50 text-warning' },
  pending:  { label: 'Pending',   cls: 'bg-gray-100 text-muted' },
  failed:   { label: 'Failed',    cls: 'bg-red-50 text-error' },
}

function StatusBadge({ status }) {
  const { label, cls } = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Empty book form state ──────────────────────────────────────────────────────
const EMPTY_BOOK = { title: '', author: '', edition: '', publisher: '', chapter_hint: '', is_primary: false }

export default function CanonicalDocsPage() {

  // ── Subject codes + combobox search ──────────────────────────────────────
  const [codes,          setCodes]          = useState([])
  const [selectedCode,   setSelectedCode]   = useState('')
  const [codesLoading,   setCodesLoading]   = useState(true)
  const [codeSearch,     setCodeSearch]     = useState('')
  const [showCodeDrop,   setShowCodeDrop]   = useState(false)
  const comboRef = useRef(null)

  // ── RAG Documents ─────────────────────────────────────────────────────────
  const [docs,         setDocs]         = useState([])
  const [docsLoading,  setDocsLoading]  = useState(false)
  const [ragTitle,     setRagTitle]     = useState('')
  const [docType,      setDocType]      = useState('textbook')
  const [file,         setFile]         = useState(null)
  const [uploading,    setUploading]    = useState(false)
  const [uploadMsg,    setUploadMsg]    = useState(null)
  const fileInputRef = useRef(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)
  const [deleteMsg,    setDeleteMsg]    = useState(null)

  // ── Reference Books ───────────────────────────────────────────────────────
  const [books,        setBooks]        = useState([])
  const [booksLoading, setBooksLoading] = useState(false)
  const [showBookForm, setShowBookForm] = useState(false)
  const [bookForm,     setBookForm]     = useState(EMPTY_BOOK)
  const [editBookId,   setEditBookId]   = useState(null)   // null = adding new
  const [savingBook,   setSavingBook]   = useState(false)
  const [bookMsg,      setBookMsg]      = useState(null)
  const [deletingBook, setDeletingBook] = useState(null)   // book id being deleted

  // ── Load subject codes on mount ───────────────────────────────────────────
  useEffect(() => {
    fetch('/api/super-admin/canonical-rag/subject-codes')
      .then(r => r.json())
      .then(d => {
        setCodes(d.codes ?? [])
        if (d.codes?.length > 0) {
          setSelectedCode(d.codes[0].code)
          setCodeSearch(`${d.codes[0].code} — ${d.codes[0].name}`)
        }
      })
      .catch(() => setCodes([]))
      .finally(() => setCodesLoading(false))
  }, [])

  // ── Close combobox dropdown on outside click ──────────────────────────────
  useEffect(() => {
    function handleOutsideClick(e) {
      if (comboRef.current && !comboRef.current.contains(e.target)) {
        setShowCodeDrop(false)
        // Restore display text to selected code if search was abandoned
        const sel = codes.find(c => c.code === selectedCode)
        if (sel) setCodeSearch(`${sel.code} — ${sel.name}`)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [codes, selectedCode])

  // ── Load docs + books when selected code changes ──────────────────────────
  useEffect(() => {
    if (!selectedCode) return
    loadDocs(selectedCode)
    loadBooks(selectedCode)
    setShowBookForm(false)
    setBookMsg(null)
    setUploadMsg(null)
  }, [selectedCode])

  async function loadDocs(code) {
    setDocsLoading(true)
    try {
      const res  = await fetch(`/api/super-admin/canonical-rag/docs?code=${encodeURIComponent(code)}`)
      const data = await res.json()
      setDocs(data.docs ?? [])
    } catch { setDocs([]) }
    finally  { setDocsLoading(false) }
  }

  async function loadBooks(code) {
    setBooksLoading(true)
    try {
      const res  = await fetch(`/api/super-admin/canonical-ref-books?code=${encodeURIComponent(code)}`)
      const data = await res.json()
      setBooks(data.books ?? [])
    } catch { setBooks([]) }
    finally  { setBooksLoading(false) }
  }

  // ── RAG Upload ────────────────────────────────────────────────────────────
  async function handleUpload(e) {
    e.preventDefault()
    if (!selectedCode || !ragTitle.trim() || !file) {
      setUploadMsg({ type: 'error', text: 'Please fill in all fields and select a PDF.' })
      return
    }
    setUploading(true)
    setUploadMsg(null)

    const optimistic = { id: `opt-${Date.now()}`, subject_code: selectedCode, title: ragTitle.trim(), doc_type: docType, index_status: 'indexing', chunk_count: null, created_at: new Date().toISOString() }
    setDocs(prev => [optimistic, ...prev])

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('subject_code', selectedCode)
      fd.append('doc_type', docType)
      fd.append('title', ragTitle.trim())

      const res  = await fetch('/api/super-admin/canonical-rag/index', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setDocs(prev => prev.filter(d => d.id !== optimistic.id))
        setUploadMsg({ type: 'error', text: data.error ?? 'Upload failed.' })
        return
      }
      setUploadMsg({ type: 'success', text: data.message ?? 'Document indexed successfully.' })
      setRagTitle('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadDocs(selectedCode)
    } catch {
      setDocs(prev => prev.filter(d => d.id !== optimistic.id))
      setUploadMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally { setUploading(false) }
  }

  // ── RAG Delete ────────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteMsg(null)
    try {
      const res  = await fetch(`/api/super-admin/canonical-rag/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setDeleteMsg(data.error ?? 'Delete failed.'); return }
      setDocs(prev => prev.filter(d => d.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch { setDeleteMsg('Network error.') }
    finally  { setDeleting(false) }
  }

  // ── Reference Book Save (add or edit) ────────────────────────────────────
  async function handleSaveBook(e) {
    e.preventDefault()
    if (!bookForm.title.trim() || !bookForm.author.trim()) {
      setBookMsg({ type: 'error', text: 'Title and author are required.' })
      return
    }
    setSavingBook(true)
    setBookMsg(null)

    try {
      const isEdit = !!editBookId
      const url    = isEdit ? `/api/super-admin/canonical-ref-books/${editBookId}` : '/api/super-admin/canonical-ref-books'
      const method = isEdit ? 'PATCH' : 'POST'
      const body   = isEdit ? bookForm : { ...bookForm, subject_code: selectedCode }

      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()

      if (!res.ok) {
        setBookMsg({ type: 'error', text: data.error ?? 'Save failed.' })
        return
      }

      setBookMsg({ type: 'success', text: isEdit ? 'Book updated.' : 'Book added.' })
      setBookForm(EMPTY_BOOK)
      setEditBookId(null)
      setShowBookForm(false)
      await loadBooks(selectedCode)
    } catch {
      setBookMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally { setSavingBook(false) }
  }

  function startEditBook(book) {
    setEditBookId(book.id)
    setBookForm({ title: book.title, author: book.author, edition: book.edition ?? '', publisher: book.publisher ?? '', chapter_hint: book.chapter_hint ?? '', is_primary: book.is_primary })
    setShowBookForm(true)
    setBookMsg(null)
  }

  function cancelBookForm() {
    setShowBookForm(false)
    setEditBookId(null)
    setBookForm(EMPTY_BOOK)
    setBookMsg(null)
  }

  async function handleDeleteBook(bookId) {
    setDeletingBook(bookId)
    try {
      const res = await fetch(`/api/super-admin/canonical-ref-books/${bookId}`, { method: 'DELETE' })
      if (res.ok) setBooks(prev => prev.filter(b => b.id !== bookId))
    } catch {}
    finally { setDeletingBook(null) }
  }

  const selectedName = codes.find(c => c.code === selectedCode)?.name ?? ''

  return (
    <div className="p-6 lg:p-8 max-w-3xl">

      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-navy">Canonical Reference Docs</h1>
            <p className="text-sm text-muted mt-0.5">Manage RAG documents and reference books per SCTEVT subject code — shared across <span className="font-semibold text-navy">all colleges</span>.</p>
          </div>
        </div>
      </div>

      {/* Subject Code Selector — searchable combobox */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
        <label className="block text-sm font-semibold text-navy mb-2">Subject Code</label>
        {codesLoading ? (
          <div className="h-10 bg-bg rounded-lg animate-pulse w-72" />
        ) : codes.length === 0 ? (
          <p className="text-sm text-muted">No subject codes found. Add subjects to colleges first.</p>
        ) : (
          <div ref={comboRef} className="relative w-full max-w-sm">
            <div className="relative">
              <input
                type="text"
                value={codeSearch}
                onChange={e => {
                  setCodeSearch(e.target.value)
                  setShowCodeDrop(true)
                }}
                onFocus={() => setShowCodeDrop(true)}
                placeholder="Search subject code or name…"
                className="w-full border border-border rounded-lg pl-3 pr-9 py-2.5 text-sm text-navy bg-surface focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>

            {showCodeDrop && (() => {
              const q = codeSearch.toLowerCase().trim()
              const filtered = q
                ? codes.filter(c =>
                    c.code.toLowerCase().includes(q) ||
                    c.name.toLowerCase().includes(q)
                  )
                : codes
              return filtered.length > 0 ? (
                <ul className="absolute z-20 mt-1 w-full bg-surface border border-border rounded-xl shadow-lg max-h-64 overflow-y-auto">
                  {filtered.map(c => (
                    <li
                      key={c.code}
                      onMouseDown={e => {
                        e.preventDefault()
                        setSelectedCode(c.code)
                        setCodeSearch(`${c.code} — ${c.name}`)
                        setShowCodeDrop(false)
                      }}
                      className={`px-4 py-2.5 cursor-pointer text-sm flex items-center justify-between gap-3 hover:bg-bg transition-colors ${
                        c.code === selectedCode ? 'bg-teal-light text-teal font-semibold' : 'text-text'
                      }`}
                    >
                      <span>
                        <span className="font-mono font-bold">{c.code}</span>
                        <span className="text-muted ml-2 font-normal">{c.name}</span>
                      </span>
                      {c.code === selectedCode && (
                        <svg className="w-4 h-4 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="absolute z-20 mt-1 w-full bg-surface border border-border rounded-xl shadow-lg px-4 py-3">
                  <p className="text-sm text-muted">No subject codes match &ldquo;{codeSearch}&rdquo;</p>
                </div>
              )
            })()}
          </div>
        )}
        {selectedCode && !codesLoading && (
          <p className="text-xs text-muted mt-2">
            Showing content for <span className="font-mono font-semibold text-navy">{selectedCode}</span>
          </p>
        )}
      </div>

      {selectedCode && (
        <>
          {/* ═══ SECTION 1: RAG DOCUMENTS ═══════════════════════════════════════ */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
              <h2 className="text-xs font-bold text-muted uppercase tracking-widest">RAG Reference Documents</h2>
            </div>

            {/* Upload Form */}
            <div className="bg-surface border border-border rounded-2xl p-5 mb-3">
              <h3 className="font-heading text-sm font-bold text-navy mb-4">Upload Reference Document</h3>

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
                <svg className="w-4 h-4 text-warning shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="text-xs text-warning font-medium leading-snug">
                  This PDF will be indexed for <span className="font-bold">all colleges teaching {selectedCode}</span> with RAG enabled.
                </p>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Title</label>
                  <input type="text" value={ragTitle} onChange={e => setRagTitle(e.target.value)}
                    placeholder="e.g. Applied Physics-I — H.C. Verma Vol.1"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-navy bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/30" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Document Type</label>
                  <select value={docType} onChange={e => setDocType(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm text-navy bg-surface focus:outline-none focus:ring-2 focus:ring-teal/30">
                    {Object.entries(DOC_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">PDF File</label>
                  <input ref={fileInputRef} type="file" accept="application/pdf"
                    onChange={e => setFile(e.target.files[0] ?? null)}
                    className="w-full text-sm text-navy file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal file:text-white hover:file:bg-teal-2 file:cursor-pointer" required />
                  <p className="text-xs text-muted mt-1">Text-based PDF only. Max 20 MB.</p>
                </div>

                {uploadMsg && (
                  <div className={`text-sm px-4 py-3 rounded-lg font-medium ${uploadMsg.type === 'success' ? 'bg-teal-light text-teal' : 'bg-red-50 text-error border border-red-200'}`}>
                    {uploadMsg.text}
                  </div>
                )}

                <button type="submit" disabled={uploading || !ragTitle.trim() || !file}
                  className="inline-flex items-center gap-2 bg-teal text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {uploading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Indexing…</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>Upload &amp; Index</>
                  )}
                </button>
              </form>
            </div>

            {/* Indexed docs list */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <h3 className="font-heading text-sm font-bold text-navy mb-4">
                Indexed Documents for {selectedCode}
                {docs.length > 0 && <span className="ml-2 text-sm font-normal text-muted">({docs.length})</span>}
              </h3>

              {docsLoading ? (
                <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-14 bg-bg rounded-xl animate-pulse"/>)}</div>
              ) : docs.length === 0 ? (
                <div className="text-center py-6 text-muted">
                  <p className="text-sm">No documents indexed for {selectedCode} yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {docs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-navy truncate">{doc.title}</span>
                          <StatusBadge status={doc.index_status} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                          <span>{DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}</span>
                          {doc.chunk_count != null && <><span>·</span><span>{doc.chunk_count} chunks</span></>}
                          <span>·</span><span>{formatDate(doc.indexed_at ?? doc.created_at)}</span>
                        </div>
                        {doc.error_message && <p className="text-xs text-error mt-1">{doc.error_message}</p>}
                      </div>
                      <button onClick={() => { setDeleteTarget(doc); setDeleteMsg(null) }}
                        disabled={doc.id.startsWith('opt-')}
                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-error hover:bg-red-50 transition-colors disabled:opacity-30">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ═══ SECTION 2: REFERENCE BOOKS ════════════════════════════════════ */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
              </svg>
              <h2 className="text-xs font-bold text-muted uppercase tracking-widest">Reference Books</h2>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-heading text-sm font-bold text-navy">
                    Reference Books for {selectedCode}
                    {books.length > 0 && <span className="ml-2 text-sm font-normal text-muted">({books.length})</span>}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">Injected into every AI prompt for this subject code.</p>
                </div>
                {!showBookForm && (
                  <button onClick={() => { setShowBookForm(true); setEditBookId(null); setBookForm(EMPTY_BOOK); setBookMsg(null) }}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:text-teal-2 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                    </svg>
                    Add Book
                  </button>
                )}
              </div>

              {/* Book list */}
              {booksLoading ? (
                <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 bg-bg rounded-lg animate-pulse"/>)}</div>
              ) : books.length === 0 && !showBookForm ? (
                <div className="text-center py-6 text-muted">
                  <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
                  </svg>
                  <p className="text-sm">No reference books for {selectedCode} yet.</p>
                  <button onClick={() => setShowBookForm(true)} className="mt-2 text-sm font-semibold text-teal hover:underline">+ Add the first one</button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {books.map(book => (
                    <div key={book.id} className="py-3">
                      {editBookId === book.id ? null : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {book.is_primary && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-teal-light text-teal">★ Primary</span>
                              )}
                              <span className="text-sm font-semibold text-navy">{book.title}</span>
                            </div>
                            <p className="text-xs text-muted mt-0.5">
                              {book.author}
                              {book.edition   && <span> · {book.edition}</span>}
                              {book.publisher && <span> · {book.publisher}</span>}
                            </p>
                            {book.chapter_hint && <p className="text-xs text-muted italic mt-0.5">{book.chapter_hint}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => startEditBook(book)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-navy hover:bg-bg transition-colors" title="Edit">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/>
                              </svg>
                            </button>
                            <button onClick={() => handleDeleteBook(book.id)}
                              disabled={deletingBook === book.id}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-error hover:bg-red-50 transition-colors disabled:opacity-40" title="Delete">
                              {deletingBook === book.id ? (
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add / Edit book form */}
              {showBookForm && (
                <div className="mt-4 border-t border-border pt-4">
                  <h4 className="text-sm font-bold text-navy mb-3">{editBookId ? 'Edit Book' : 'Add Reference Book'}</h4>
                  <form onSubmit={handleSaveBook} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted mb-1">Title *</label>
                        <input type="text" value={bookForm.title} onChange={e => setBookForm(f => ({...f, title: e.target.value}))}
                          placeholder="Applied Physics-I Vol.1"
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm text-navy bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/30" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted mb-1">Author *</label>
                        <input type="text" value={bookForm.author} onChange={e => setBookForm(f => ({...f, author: e.target.value}))}
                          placeholder="H.C. Verma"
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm text-navy bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/30" required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted mb-1">Edition</label>
                        <input type="text" value={bookForm.edition} onChange={e => setBookForm(f => ({...f, edition: e.target.value}))}
                          placeholder="2nd Edition"
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm text-navy bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/30" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted mb-1">Publisher</label>
                        <input type="text" value={bookForm.publisher} onChange={e => setBookForm(f => ({...f, publisher: e.target.value}))}
                          placeholder="Concepts of Physics"
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm text-navy bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/30" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted mb-1">Chapter Hint</label>
                      <input type="text" value={bookForm.chapter_hint} onChange={e => setBookForm(f => ({...f, chapter_hint: e.target.value}))}
                        placeholder="Chapters 1–4 for Unit 1"
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm text-navy bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/30" />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={bookForm.is_primary} onChange={e => setBookForm(f => ({...f, is_primary: e.target.checked}))}
                        className="w-4 h-4 rounded border-border text-teal focus:ring-teal/30" />
                      <span className="text-sm text-navy">Set as primary reference book</span>
                    </label>

                    {bookMsg && (
                      <div className={`text-sm px-3 py-2 rounded-lg font-medium ${bookMsg.type === 'success' ? 'bg-teal-light text-teal' : 'bg-red-50 text-error border border-red-200'}`}>
                        {bookMsg.text}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button type="submit" disabled={savingBook}
                        className="inline-flex items-center gap-2 bg-teal text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-teal-2 transition-colors disabled:opacity-50">
                        {savingBook ? 'Saving…' : (editBookId ? 'Save Changes' : 'Add Book')}
                      </button>
                      <button type="button" onClick={cancelBookForm}
                        className="text-sm font-semibold text-muted hover:text-text transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* RAG Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!deleting) setDeleteTarget(null) }} />
          <div className="relative bg-surface rounded-2xl border border-border shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-navy">Delete Canonical Document?</h3>
                <p className="text-xs text-muted mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-text mb-2">You're about to delete <span className="font-semibold">"{deleteTarget.title}"</span>.</p>
            <p className="text-sm text-warning bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
              This will remove RAG context for <span className="font-bold">all colleges teaching {deleteTarget.subject_code}</span> with RAG enabled.
            </p>
            {deleteMsg && <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{deleteMsg}</p>}
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => { setDeleteTarget(null); setDeleteMsg(null) }} disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-muted hover:text-text transition-colors">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-error text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
