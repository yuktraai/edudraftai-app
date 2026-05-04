'use client'

/**
 * Phase 51.7 — /super-admin/canonical-docs
 *
 * Super admin UI for managing canonical reference documents.
 * Documents are indexed per SCTEVT subject code (e.g. TH2) and shared
 * across ALL colleges teaching that subject.
 */

import { useState, useEffect, useRef } from 'react'

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
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  )
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function CanonicalDocsPage() {
  // ── Subject codes ──────────────────────────────────────────────────────────
  const [codes,        setCodes]        = useState([])
  const [selectedCode, setSelectedCode] = useState('')
  const [codesLoading, setCodesLoading] = useState(true)

  // ── Documents for selected code ────────────────────────────────────────────
  const [docs,         setDocs]         = useState([])
  const [docsLoading,  setDocsLoading]  = useState(false)

  // ── Upload form ────────────────────────────────────────────────────────────
  const [title,        setTitle]        = useState('')
  const [docType,      setDocType]      = useState('textbook')
  const [file,         setFile]         = useState(null)
  const [uploading,    setUploading]    = useState(false)
  const [uploadMsg,    setUploadMsg]    = useState(null)   // { type: 'success'|'error', text }
  const fileInputRef = useRef(null)

  // ── Delete modal ───────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState(null)   // doc object or null
  const [deleting,     setDeleting]     = useState(false)
  const [deleteMsg,    setDeleteMsg]    = useState(null)

  // ── Load subject codes ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/super-admin/canonical-rag/subject-codes')
      .then(r => r.json())
      .then(d => {
        setCodes(d.codes ?? [])
        if (d.codes?.length > 0) setSelectedCode(d.codes[0].code)
      })
      .catch(() => setCodes([]))
      .finally(() => setCodesLoading(false))
  }, [])

  // ── Load docs when code changes ────────────────────────────────────────────
  useEffect(() => {
    if (!selectedCode) return
    loadDocs(selectedCode)
  }, [selectedCode])

  async function loadDocs(code) {
    setDocsLoading(true)
    try {
      const res  = await fetch(`/api/super-admin/canonical-rag/docs?code=${encodeURIComponent(code)}`)
      const data = await res.json()
      setDocs(data.docs ?? [])
    } catch {
      setDocs([])
    } finally {
      setDocsLoading(false)
    }
  }

  // ── Upload handler ─────────────────────────────────────────────────────────
  async function handleUpload(e) {
    e.preventDefault()
    if (!selectedCode || !title.trim() || !file) {
      setUploadMsg({ type: 'error', text: 'Please fill in all fields and select a PDF.' })
      return
    }

    setUploading(true)
    setUploadMsg(null)

    // Optimistically add an indexing row
    const optimisticDoc = {
      id:           `optimistic-${Date.now()}`,
      subject_code: selectedCode,
      title:        title.trim(),
      doc_type:     docType,
      index_status: 'indexing',
      chunk_count:  null,
      created_at:   new Date().toISOString(),
    }
    setDocs(prev => [optimisticDoc, ...prev])

    try {
      const fd = new FormData()
      fd.append('file',         file)
      fd.append('subject_code', selectedCode)
      fd.append('doc_type',     docType)
      fd.append('title',        title.trim())

      const res  = await fetch('/api/super-admin/canonical-rag/index', { method: 'POST', body: fd })
      const data = await res.json()

      if (!res.ok) {
        // Remove optimistic row
        setDocs(prev => prev.filter(d => d.id !== optimisticDoc.id))
        setUploadMsg({ type: 'error', text: data.error ?? 'Upload failed.' })
        return
      }

      setUploadMsg({ type: 'success', text: data.message ?? 'Document indexed successfully.' })
      setTitle('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      // Reload docs to get real record
      await loadDocs(selectedCode)
    } catch {
      setDocs(prev => prev.filter(d => d.id !== optimisticDoc.id))
      setUploadMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  // ── Delete handler ─────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteMsg(null)
    try {
      const res  = await fetch(`/api/super-admin/canonical-rag/${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setDeleteMsg(data.error ?? 'Delete failed.')
        return
      }
      setDocs(prev => prev.filter(d => d.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      setDeleteMsg('Network error.')
    } finally {
      setDeleting(false)
    }
  }

  // ── Selected code name ─────────────────────────────────────────────────────
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
            <h1 className="font-heading text-2xl font-bold text-navy">Canonical Reference Documents</h1>
            <p className="text-sm text-muted mt-0.5">Upload reference material shared across <span className="font-semibold text-navy">all colleges</span> by SCTEVT subject code.</p>
          </div>
        </div>
      </div>

      {/* Subject Code Selector */}
      <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
        <label className="block text-sm font-semibold text-navy mb-2">Subject Code</label>
        {codesLoading ? (
          <div className="h-10 bg-bg rounded-lg animate-pulse w-64" />
        ) : codes.length === 0 ? (
          <p className="text-sm text-muted">No subject codes found. Add subjects to colleges first.</p>
        ) : (
          <select
            value={selectedCode}
            onChange={e => setSelectedCode(e.target.value)}
            className="w-full max-w-xs border border-border rounded-lg px-3 py-2 text-sm text-navy bg-surface focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            {codes.map(c => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedCode && (
        <>
          {/* Upload Form */}
          <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
            <h2 className="font-heading text-base font-bold text-navy mb-4">Upload Reference Document</h2>

            {/* Warning banner */}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
              <svg className="w-4 h-4 text-warning shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-xs text-warning font-medium leading-snug">
                This document will be used for <span className="font-bold">all colleges teaching {selectedCode}</span> with RAG enabled. Deletion affects all of them.
              </p>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Applied Physics-I — H.C. Verma Vol.1"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-navy bg-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">Document Type</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm text-navy bg-surface focus:outline-none focus:ring-2 focus:ring-teal/30"
                >
                  {Object.entries(DOC_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">PDF File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={e => setFile(e.target.files[0] ?? null)}
                  className="w-full text-sm text-navy file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal file:text-white hover:file:bg-teal-2 file:cursor-pointer"
                  required
                />
                <p className="text-xs text-muted mt-1">Must be a text-based PDF. Maximum 20 MB.</p>
              </div>

              {uploadMsg && (
                <div className={`text-sm px-4 py-3 rounded-lg font-medium ${
                  uploadMsg.type === 'success'
                    ? 'bg-teal-light text-teal'
                    : 'bg-red-50 text-error border border-red-200'
                }`}>
                  {uploadMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={uploading || !title.trim() || !file}
                className="inline-flex items-center gap-2 bg-teal text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-teal-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Indexing…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Upload &amp; Index
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Indexed Documents List */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h2 className="font-heading text-base font-bold text-navy mb-4">
              Indexed Documents for {selectedCode}
              {docs.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted">({docs.length})</span>
              )}
            </h2>

            {docsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-14 bg-bg rounded-xl animate-pulse" />
                ))}
              </div>
            ) : docs.length === 0 ? (
              <div className="text-center py-8 text-muted">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-sm">No documents indexed for {selectedCode} yet.</p>
                <p className="text-xs mt-1">Upload a reference PDF above to get started.</p>
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
                        {doc.chunk_count != null && (
                          <><span>·</span><span>{doc.chunk_count} chunks</span></>
                        )}
                        <span>·</span>
                        <span>{formatDate(doc.indexed_at ?? doc.created_at)}</span>
                      </div>
                      {doc.error_message && (
                        <p className="text-xs text-error mt-1">{doc.error_message}</p>
                      )}
                    </div>

                    <button
                      onClick={() => { setDeleteTarget(doc); setDeleteMsg(null) }}
                      disabled={doc.id.startsWith('optimistic-')}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-error hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Delete document"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { if (!deleting) setDeleteTarget(null) }} />
          <div className="relative bg-surface rounded-2xl border border-border shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-navy">Delete Canonical Document?</h3>
                <p className="text-xs text-muted mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-text mb-2">
              You're about to delete <span className="font-semibold">"{deleteTarget.title}"</span>.
            </p>
            <p className="text-sm text-warning bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
              This will remove RAG context for <span className="font-bold">all colleges teaching {deleteTarget.subject_code}</span> with RAG enabled.
            </p>

            {deleteMsg && (
              <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{deleteMsg}</p>
            )}

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteMsg(null) }}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-muted hover:text-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2 bg-error text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Deleting…
                  </>
                ) : 'Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
