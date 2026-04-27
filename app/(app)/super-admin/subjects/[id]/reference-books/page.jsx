'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-navy text-base">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const EMPTY_FORM = { title: '', author: '', edition: '', publisher: '', chapter_hint: '', is_primary: false }

export default function ReferenceBooksPage() {
  const { id: subjectId } = useParams()
  const router = useRouter()

  const [books,       setBooks]       = useState([])
  const [subject,     setSubject]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [showModal,   setShowModal]   = useState(false)
  const [editBook,    setEditBook]    = useState(null)   // null = new, object = edit
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)
  const [formError,   setFormError]   = useState(null)
  const [deleting,    setDeleting]    = useState(null)  // bookId being deleted

  useEffect(() => {
    if (!subjectId) return
    loadData()
    // Fetch subject name from super-admin subject endpoint
    fetch(`/api/super-admin/subject-by-id?id=${subjectId}`)
      .then(r => r.json())
      .then(d => setSubject(d.data))
      .catch(() => {})
  }, [subjectId])

  async function loadData() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/super-admin/subjects/${subjectId}/reference-books`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setBooks(data.data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditBook(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowModal(true)
  }

  function openEdit(book) {
    setEditBook(book)
    setForm({
      title:        book.title,
      author:       book.author,
      edition:      book.edition ?? '',
      publisher:    book.publisher ?? '',
      chapter_hint: book.chapter_hint ?? '',
      is_primary:   book.is_primary,
    })
    setFormError(null)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.author.trim()) {
      setFormError('Title and Author are required.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      const isEdit = !!editBook
      const url    = isEdit
        ? `/api/super-admin/subjects/${subjectId}/reference-books/${editBook.id}`
        : `/api/super-admin/subjects/${subjectId}/reference-books`

      const res  = await fetch(url, {
        method:  isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:        form.title.trim(),
          author:       form.author.trim(),
          edition:      form.edition.trim() || null,
          publisher:    form.publisher.trim() || null,
          chapter_hint: form.chapter_hint.trim() || null,
          is_primary:   form.is_primary,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setShowModal(false)
      loadData()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(bookId) {
    if (!confirm('Delete this reference book?')) return
    setDeleting(bookId)
    try {
      const res = await fetch(`/api/super-admin/subjects/${subjectId}/reference-books/${bookId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const d = await res.json()
        alert(d.error ?? 'Delete failed')
        return
      }
      setBooks(prev => prev.filter(b => b.id !== bookId))
    } catch {
      alert('Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  async function handleTogglePrimary(book) {
    const newVal = !book.is_primary
    try {
      await fetch(`/api/super-admin/subjects/${subjectId}/reference-books/${book.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ is_primary: newVal }),
      })
      loadData()
    } catch {}
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl space-y-6">
      {/* Back */}
      <Link
        href="/super-admin/subjects"
        className="text-sm text-muted hover:text-text flex items-center gap-1 w-fit transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Subjects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold text-navy">Reference Books</h1>
          {subject && (
            <p className="text-sm text-muted mt-1">{subject.name} · {subject.code}</p>
          )}
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-2 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Book
        </button>
      </div>

      {/* Info callout */}
      <div className="bg-teal-light border border-teal/20 rounded-xl px-4 py-3 text-sm text-teal">
        Reference books are injected into AI prompts when generating content for this subject, grounding the output in the prescribed curriculum materials.
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm">{error}</div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 bg-border rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && books.length === 0 && (
        <div className="text-center py-16 text-muted text-sm">
          No reference books added yet. Click "Add Book" to add the first one.
        </div>
      )}

      {!loading && books.length > 0 && (
        <div className="space-y-3">
          {books.map(book => (
            <div
              key={book.id}
              className={`bg-surface border rounded-xl p-5 flex items-start gap-4 ${
                book.is_primary ? 'border-teal' : 'border-border'
              }`}
            >
              {/* Book icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                book.is_primary ? 'bg-teal text-white' : 'bg-bg text-muted'
              }`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-text text-sm">{book.title}</p>
                  {book.is_primary && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal text-white font-medium">Primary</span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">by {book.author}
                  {book.edition ? ` · ${book.edition}` : ''}
                  {book.publisher ? ` · ${book.publisher}` : ''}
                </p>
                {book.chapter_hint && (
                  <p className="text-xs text-muted mt-1 italic">"{book.chapter_hint}"</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleTogglePrimary(book)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                    book.is_primary
                      ? 'border-teal text-teal hover:bg-teal hover:text-white'
                      : 'border-border text-muted hover:border-teal hover:text-teal'
                  }`}
                  title={book.is_primary ? 'Remove primary' : 'Mark as primary'}
                >
                  {book.is_primary ? '★ Primary' : '☆ Set Primary'}
                </button>
                <button
                  onClick={() => openEdit(book)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:border-navy hover:text-navy transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(book.id)}
                  disabled={deleting === book.id}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted hover:border-error hover:text-error transition-colors disabled:opacity-50"
                >
                  {deleting === book.id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <Modal title={editBook ? 'Edit Reference Book' : 'Add Reference Book'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-bg text-text focus:ring-2 focus:ring-teal focus:outline-none"
                  placeholder="e.g. Engineering Drawing"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Author *</label>
                <input
                  value={form.author}
                  onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-bg text-text focus:ring-2 focus:ring-teal focus:outline-none"
                  placeholder="e.g. N.D. Bhatt"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Edition</label>
                <input
                  value={form.edition}
                  onChange={e => setForm(f => ({ ...f, edition: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-bg text-text focus:ring-2 focus:ring-teal focus:outline-none"
                  placeholder="e.g. 53rd Edition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Publisher</label>
                <input
                  value={form.publisher}
                  onChange={e => setForm(f => ({ ...f, publisher: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-bg text-text focus:ring-2 focus:ring-teal focus:outline-none"
                  placeholder="e.g. Charotar Publishing"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Chapter Guidance</label>
              <textarea
                value={form.chapter_hint}
                onChange={e => setForm(f => ({ ...f, chapter_hint: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-bg text-text focus:ring-2 focus:ring-teal focus:outline-none resize-none"
                placeholder="e.g. Chapters 3–5 cover Unit 2 topics on isometric projections"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_primary}
                onChange={e => setForm(f => ({ ...f, is_primary: e.target.checked }))}
                className="w-4 h-4 rounded border-border text-teal focus:ring-teal"
              />
              <span className="text-sm text-text">Mark as primary reference (gets stronger weighting in AI prompts)</span>
            </label>

            {formError && (
              <p className="text-sm text-error">{formError}</p>
            )}

            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted hover:text-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-2 transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving…' : editBook ? 'Save Changes' : 'Add Book'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
