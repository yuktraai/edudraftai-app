'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Phase 10D — Parse Quality Tab
 *
 * Shows all syllabus_chunks for the subject in a table with:
 * - Confidence score (colour-coded green/amber/red)
 * - Subtopic count
 * - Re-parse button (triggers POST /api/parse-syllabus for the same file)
 * - Inline subtopic editing (via PATCH /api/super-admin/chunks/[id])
 */

function confidenceLabel(score) {
  if (score == null) return { label: '—',   cls: 'text-muted' }
  const pct = Math.round(score * 100)
  if (score >= 0.8) return { label: `${pct}%`, cls: 'text-teal font-semibold'   }
  if (score >= 0.5) return { label: `${pct}%`, cls: 'text-warning font-semibold' }
  return              { label: `${pct}%`, cls: 'text-error font-semibold'   }
}

function confidenceBg(score) {
  if (score == null) return ''
  if (score >= 0.8)  return 'bg-teal-light'
  if (score >= 0.5)  return 'bg-amber-50'
  return 'bg-red-50'
}

// ── Inline subtopic editor ─────────────────────────────────────────────────

function InlineEditor({ chunk, onDone }) {
  const [topic,        setTopic]        = useState(chunk.topic)
  const [subtopicsText,setSubtopicsText]= useState((chunk.subtopics ?? []).join('\n'))
  const [saving,       setSaving]       = useState(false)
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
      const j = await res.json()
      setError(j.error ?? 'Save failed')
      return
    }
    onDone()
  }

  const inputCls = 'w-full px-2 py-1.5 rounded-lg border border-border bg-bg text-text text-xs focus:outline-none focus:ring-1 focus:ring-teal'

  return (
    <div className="space-y-2 py-1">
      {error && <p className="text-error text-xs">{error}</p>}
      <input
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="Topic name"
        className={inputCls}
      />
      <textarea
        rows={3}
        value={subtopicsText}
        onChange={e => setSubtopicsText(e.target.value)}
        placeholder="One subtopic per line"
        className={`${inputCls} resize-y`}
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1 bg-teal text-white text-xs font-semibold rounded-lg hover:bg-teal-2 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={() => onDone()}
          className="px-3 py-1 bg-bg text-muted text-xs rounded-lg border border-border hover:text-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Re-parse button ────────────────────────────────────────────────────────

function ReparseButton({ subjectId, fileId }) {
  const [status, setStatus] = useState('idle')  // idle | loading | done | error
  const [msg,    setMsg]    = useState('')
  const router = useRouter()

  async function handleReparse() {
    if (!fileId) {
      setStatus('error')
      setMsg('No file to re-parse. Upload a PDF first.')
      return
    }
    if (!confirm('Re-parse this subject? Existing chunks will be replaced.')) return

    setStatus('loading')
    setMsg('')
    try {
      const res = await fetch('/api/parse-syllabus', {
        method: 'POST',
        // We send subject_id and file_id; the API will re-fetch from Storage
        body: (() => {
          const fd = new FormData()
          fd.append('subject_id', subjectId)
          fd.append('reparse_file_id', fileId)
          return fd
        })(),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMsg(json.error ?? 'Re-parse failed')
        return
      }
      setStatus('done')
      setMsg(`Done — ${json.data?.chunks_created ?? 0} chunks created, avg confidence ${((json.data?.avg_confidence ?? 0) * 100).toFixed(0)}%`)
      setTimeout(() => router.refresh(), 1200)
    } catch (err) {
      setStatus('error')
      setMsg(err.message)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleReparse}
        disabled={status === 'loading'}
        className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy/80 disabled:opacity-50 transition-colors"
      >
        {status === 'loading' ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Re-parsing…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Re-parse with AI
          </>
        )}
      </button>
      {msg && (
        <span className={`text-xs font-medium ${status === 'error' ? 'text-error' : 'text-teal'}`}>
          {msg}
        </span>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ParseQualityTab({ chunks, subjectId, latestFileId }) {
  const [editingId, setEditingId] = useState(null)
  const router = useRouter()

  if (chunks.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-10 text-center">
        <p className="text-muted text-sm">No chunks to review.</p>
        <p className="text-xs text-muted mt-1">Upload a PDF first to generate chunks.</p>
      </div>
    )
  }

  // Check if confidence data is available
  const hasConfidence = chunks.some(c => c.parse_confidence != null)

  // Overall stats
  const withConf = chunks.filter(c => c.parse_confidence != null)
  const avgConf  = withConf.length > 0
    ? withConf.reduce((s, c) => s + c.parse_confidence, 0) / withConf.length
    : null
  const highCount = withConf.filter(c => c.parse_confidence >= 0.8).length
  const midCount  = withConf.filter(c => c.parse_confidence >= 0.5 && c.parse_confidence < 0.8).length
  const lowCount  = withConf.filter(c => c.parse_confidence < 0.5).length

  return (
    <div className="space-y-6">

      {/* Summary stats */}
      {hasConfidence && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Avg Confidence</p>
            <p className={`text-2xl font-bold ${
              (avgConf ?? 0) >= 0.8 ? 'text-teal' :
              (avgConf ?? 0) >= 0.5 ? 'text-warning' : 'text-error'
            }`}>
              {avgConf != null ? `${Math.round(avgConf * 100)}%` : '—'}
            </p>
          </div>
          <div className="bg-teal-light border border-teal/20 rounded-xl p-4 text-center">
            <p className="text-xs text-teal uppercase tracking-wide mb-1">High ≥ 80%</p>
            <p className="text-2xl font-bold text-teal">{highCount}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-xs text-warning uppercase tracking-wide mb-1">Medium 50–79%</p>
            <p className="text-2xl font-bold text-warning">{midCount}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-xs text-error uppercase tracking-wide mb-1">Low &lt; 50%</p>
            <p className="text-2xl font-bold text-error">{lowCount}</p>
          </div>
        </div>
      )}

      {/* Re-parse button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-base font-bold text-navy">All Chunks</h2>
          <p className="text-xs text-muted mt-0.5">
            {chunks.length} chunks · Click "Edit" to fix subtopics manually
          </p>
        </div>
        <ReparseButton subjectId={subjectId} fileId={latestFileId} />
      </div>

      {!hasConfidence && (
        <div className="flex items-center gap-3 bg-bg border border-border rounded-xl px-5 py-3 text-sm text-muted">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          Confidence scores not available. Re-parse with AI to see quality metrics.
        </div>
      )}

      {/* Chunks table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Unit</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Topic</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Subtopics</th>
              {hasConfidence && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Confidence</th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {chunks.map(chunk => {
              const { label, cls } = confidenceLabel(chunk.parse_confidence)
              const isEditing = editingId === chunk.id
              return (
                <tr key={chunk.id} className={`transition-colors ${confidenceBg(chunk.parse_confidence)} hover:opacity-90`}>
                  <td className="px-4 py-3 text-xs text-muted font-mono shrink-0">
                    {chunk.unit_number ?? '—'}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    {isEditing ? (
                      <InlineEditor
                        chunk={chunk}
                        onDone={() => { setEditingId(null); router.refresh() }}
                      />
                    ) : (
                      <p className="text-sm font-medium text-text leading-snug">{chunk.topic}</p>
                    )}
                    {!isEditing && chunk.subtopics && chunk.subtopics.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {chunk.subtopics.slice(0, 4).map((st, i) => (
                          <li key={i} className="text-xs text-muted">• {st}</li>
                        ))}
                        {chunk.subtopics.length > 4 && (
                          <li className="text-xs text-muted italic">+{chunk.subtopics.length - 4} more…</li>
                        )}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {chunk.subtopics?.length ?? 0}
                  </td>
                  {hasConfidence && (
                    <td className={`px-4 py-3 ${cls}`}>{label}</td>
                  )}
                  <td className="px-4 py-3">
                    {!isEditing && (
                      <button
                        onClick={() => setEditingId(chunk.id)}
                        className="text-xs text-teal hover:underline font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
