'use client'

import { useState } from 'react'

const CONTENT_TYPE_LABELS = {
  lesson_notes:  'Lesson Notes',
  mcq_bank:      'MCQ Bank',
  question_bank: 'Question Bank',
  test_plan:     'Internal Test',
  exam_paper:    'Exam Paper',
}

const CONTENT_TYPE_ORDER = ['lesson_notes', 'mcq_bank', 'question_bank', 'test_plan', 'exam_paper']

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function TemplateManager({ initialTemplates }) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [deletingId, setDeletingId] = useState(null)

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id))
      }
    } finally {
      setDeletingId(null)
    }
  }

  if (templates.length === 0) {
    return (
      <p className="text-sm text-muted">No saved templates yet.</p>
    )
  }

  // Group by content_type
  const grouped = {}
  for (const t of templates) {
    if (!grouped[t.content_type]) grouped[t.content_type] = []
    grouped[t.content_type].push(t)
  }

  return (
    <div className="space-y-5">
      {CONTENT_TYPE_ORDER.filter(ct => grouped[ct]).map(ct => (
        <div key={ct}>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
            {CONTENT_TYPE_LABELS[ct]}
          </h3>
          <div className="space-y-2">
            {grouped[ct].map(t => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-bg border border-border"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm font-medium text-text truncate">{t.name}</span>
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-light text-teal border border-teal/20">
                    {CONTENT_TYPE_LABELS[t.content_type]}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted">{formatDate(t.created_at)}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    disabled={deletingId === t.id}
                    title="Delete template"
                    className="text-muted hover:text-error transition-colors disabled:opacity-40"
                  >
                    {deletingId === t.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
