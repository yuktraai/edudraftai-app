'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Phase 11E — Reference Docs Tab
 *
 * Lists uploaded RAG reference documents for a subject.
 * Allows uploading new PDFs, toggling RAG on/off, and deleting documents.
 */

const DOC_TYPE_LABELS = {
  textbook:         { label: 'Textbook',       cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  past_paper:       { label: 'Past Paper',      cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  model_answer:     { label: 'Model Answer',    cls: 'bg-teal-light text-teal border-teal/20' },
  reference_notes:  { label: 'Reference Notes', cls: 'bg-amber-50 text-warning border-amber-200' },
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',   cls: 'bg-bg text-muted border-border' },
  indexing: { label: 'Indexing…', cls: 'bg-blue-50 text-blue-700 border-blue-200', pulse: true },
  indexed:  { label: 'Indexed',   cls: 'bg-teal-light text-teal border-teal/20' },
  failed:   { label: 'Failed',    cls: 'bg-red-50 text-error border-red-200' },
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Upload form ───────────────────────────────────────────────────────────────

function UploadForm({ subjectId, onSuccess }) {
  const [title,   setTitle]   = useState('')
  const [docType, setDocType] = useState('textbook')
  const [file,    setFile]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [msg,     setMsg]     = useState(null)
  const fileRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setError('Select a PDF file'); return }
    if (!title.trim()) { setError('Title is required'); return }

    setLoading(true); setError(null); setMsg(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('subject_id', subjectId)
    fd.append('doc_type', docType)
    fd.append('title', title.trim())

    try {
      const res  = await fetch('/api/rag/index-document', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Upload failed'); return }

      setMsg('Document accepted — indexing in background (may take ~30s for large PDFs)')
      setTitle(''); setDocType('textbook'); setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-5 space-y-4">
      <h3 className="font-heading text-sm font-bold text-navy">Upload Reference Document</h3>

      {error && <p className="text-error text-xs">{error}</p>}
      {msg   && <p className="text-teal  text-xs">{msg}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-text">Document Title *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Basic Electronics – R.K. Rajput"
            className={inputCls}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-text">Document Type *</label>
          <select value={docType} onChange={e => setDocType(e.target.value)} className={inputCls}>
            <option value="textbook">Textbook</option>
            <option value="past_paper">Past Paper</option>
            <option value="model_answer">Model Answer</option>
            <option value="reference_notes">Reference Notes</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-text">PDF File * (max 20 MB)</label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:text-xs file:font-medium file:bg-bg file:text-text hover:file:bg-surface cursor-pointer"
        />
        {file && (
          <p className="text-xs text-muted">{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white text-sm font-semibold rounded-lg hover:bg-teal-2 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading…
          </>
        ) : 'Upload & Index'}
      </button>
    </form>
  )
}

// ── RAG toggle ────────────────────────────────────────────────────────────────

function RagToggle({ subjectId, enabled }) {
  const [on,      setOn]      = useState(enabled)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    const res  = await fetch('/api/rag/toggle', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ subject_id: subjectId, enabled: !on }),
    })
    setLoading(false)
    if (res.ok) { setOn(p => !p); router.refresh() }
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${on ? 'bg-teal-light border-teal/20' : 'bg-bg border-border'}`}>
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${on ? 'bg-teal' : 'bg-border'}`}
        aria-label={on ? 'Disable RAG' : 'Enable RAG'}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
      <div>
        <p className={`text-sm font-semibold ${on ? 'text-teal' : 'text-text'}`}>
          RAG {on ? 'Enabled' : 'Disabled'}
        </p>
        <p className="text-xs text-muted">
          {on
            ? 'AI generation will retrieve context from reference documents below.'
            : 'Turn on to inject reference material into AI generation prompts.'}
        </p>
      </div>
    </div>
  )
}

// ── Doc row ───────────────────────────────────────────────────────────────────

function DocRow({ doc, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const typeConf   = DOC_TYPE_LABELS[doc.doc_type]  ?? { label: doc.doc_type, cls: 'bg-bg text-muted border-border' }
  const statusConf = STATUS_CONFIG[doc.index_status] ?? { label: doc.index_status, cls: 'bg-bg text-muted border-border' }

  async function handleDelete() {
    if (!confirm(`Delete "${doc.title}"? This will remove it from the AI knowledge base.`)) return
    setDeleting(true)
    const res = await fetch(`/api/rag/documents/${doc.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) onDelete(doc.id)
  }

  return (
    <tr className="hover:bg-bg transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-text">{doc.title}</p>
        <p className="text-xs text-muted mt-0.5">{formatDate(doc.indexed_at ?? doc.created_at)}</p>
      </td>
      <td className="px-4 py-3">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${typeConf.cls}`}>
          {typeConf.label}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-muted">{doc.chunk_count ?? '—'}</td>
      <td className="px-4 py-3">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusConf.cls} ${statusConf.pulse ? 'animate-pulse' : ''}`}>
          {statusConf.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-error hover:underline font-medium disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </td>
    </tr>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function RagDocsTab({ docs: initialDocs, subjectId, ragEnabled }) {
  const [docs, setDocs] = useState(initialDocs)
  const router = useRouter()

  function handleDelete(id) {
    setDocs(prev => prev.filter(d => d.id !== id))
    router.refresh()
  }

  return (
    <div className="space-y-6">

      {/* RAG toggle */}
      <RagToggle subjectId={subjectId} enabled={ragEnabled} />

      {/* Upload form */}
      <UploadForm subjectId={subjectId} onSuccess={() => router.refresh()} />

      {/* Documents table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-sm font-bold text-navy">
            Indexed Documents
            <span className="ml-2 text-xs font-normal text-muted">({docs.length})</span>
          </h3>
        </div>

        {docs.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-10 text-center">
            <p className="text-muted text-sm">No reference documents yet.</p>
            <p className="text-xs text-muted mt-1">Upload a PDF above to build the AI knowledge base for this subject.</p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Chunks</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {docs.map(doc => (
                  <DocRow key={doc.id} doc={doc} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 bg-bg border border-border rounded-xl px-4 py-3 text-xs text-muted">
        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <span>
          Uploaded PDFs are chunked into ~500-word segments, embedded with OpenAI <strong>text-embedding-3-small</strong>,
          and stored in Pinecone under namespace <code className="font-mono bg-surface px-1 rounded">{subjectId}</code>.
          When RAG is enabled, the top 5 most relevant chunks are injected into every generation prompt for this subject.
        </span>
      </div>
    </div>
  )
}
