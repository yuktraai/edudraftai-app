'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Chunk edits/deletes go through /api/super-admin/chunks/[id] (server-side, super_admin only).

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm ' +
  'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

// ── Parse confidence badge (Phase 10D) ────────────────────────────────────────

function ConfidenceBadge({ score }) {
  if (score == null) return null
  const pct = Math.round(score * 100)
  const { label, cls } =
    score >= 0.8 ? { label: `${pct}%`, cls: 'bg-teal-light text-teal border border-teal/20'    } :
    score >= 0.5 ? { label: `${pct}%`, cls: 'bg-amber-50 text-warning border border-amber-200'  } :
                   { label: `${pct}%`, cls: 'bg-red-50 text-error border border-red-200'         }

  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`} title="Parse confidence score">
      ⚡ {label}
    </span>
  )
}

export function ChunksEditor({ chunk, subjectId }) {
  const router = useRouter()
  const [editing,      setEditing]      = useState(false)
  const [topic,        setTopic]        = useState(chunk.topic)
  const [subtopicsText,setSubtopicsText]= useState((chunk.subtopics ?? []).join('\n'))
  const [saving,       setSaving]       = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [error,        setError]        = useState(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    const subtopics = subtopicsText.split('\n').map(s => s.trim()).filter(Boolean)
    const res = await fetch(`/api/super-admin/chunks/${chunk.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ topic, subtopics }),
    })
    setSaving(false)
    if (!res.ok) {
      const json = await res.json()
      setError(json.error ?? 'Failed to save')
      return
    }
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Delete this chunk? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/super-admin/chunks/${chunk.id}`, { method: 'DELETE' })
    setDeleting(false)
    router.refresh()
  }

  const rawPreview = chunk.raw_text
    ? chunk.raw_text.slice(0, 200) + (chunk.raw_text.length > 200 ? '…' : '')
    : null

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      {editing ? (
        <div className="space-y-3">
          {error && <p className="text-error text-sm">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Topic</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              Subtopics (one per line)
            </label>
            <textarea
              rows={4}
              value={subtopicsText}
              onChange={e => setSubtopicsText(e.target.value)}
              className={`${inputCls} resize-y`}
              placeholder="Each subtopic on its own line"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 bg-teal text-white text-xs font-semibold rounded-lg hover:bg-teal-2 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setError(null) }}
              className="px-3 py-1.5 bg-bg text-muted text-xs font-semibold rounded-lg hover:text-text border border-border transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-medium text-text text-sm">{chunk.topic}</p>
              <ConfidenceBadge score={chunk.parse_confidence} />
            </div>
            {chunk.subtopics && chunk.subtopics.length > 0 && (
              <ul className="mt-1.5 space-y-0.5">
                {chunk.subtopics.map((st, i) => (
                  <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                    <span className="text-teal mt-0.5">•</span>
                    {st}
                  </li>
                ))}
              </ul>
            )}
            {rawPreview && (
              <p className="mt-2 text-xs text-muted font-mono leading-relaxed border-t border-border pt-2">
                {rawPreview}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-teal hover:underline font-medium"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-error hover:underline font-medium disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
