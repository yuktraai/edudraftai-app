'use client'

const TYPE_LABELS = {
  lesson_notes:  'Lesson Notes',
  mcq_bank:      'MCQ Bank',
  question_bank: 'Question Bank',
  test_plan:     'Test Plan',
}

const TYPE_COLORS = {
  lesson_notes:  'bg-blue-50 text-blue-700 border-blue-200',
  mcq_bank:      'bg-purple-50 text-purple-700 border-purple-200',
  question_bank: 'bg-amber-50 text-amber-700 border-amber-200',
  test_plan:     'bg-teal/10 text-teal border-teal/20',
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function LibraryCard({ draft, onClone, cloning }) {
  const subject  = draft.subjects
  const author   = draft.users
  const topic    = draft.prompt_params?.topic ?? '—'
  const typeColor = TYPE_COLORS[draft.content_type] ?? 'bg-bg text-muted border-border'

  return (
    <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3 hover:border-teal/30 transition-colors">
      {/* Top row: type badge + date */}
      <div className="flex items-start justify-between gap-2">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${typeColor}`}>
          {TYPE_LABELS[draft.content_type] ?? draft.content_type}
        </span>
        <span className="text-xs text-muted shrink-0">{formatDate(draft.published_at)}</span>
      </div>

      {/* Topic */}
      <div>
        <p className="text-sm font-semibold text-text line-clamp-2">{topic}</p>
        {subject && (
          <p className="text-xs text-muted mt-0.5">
            {subject.name} {subject.code ? `(${subject.code})` : ''}
            {subject.departments?.name ? ` · ${subject.departments.name}` : ''}
          </p>
        )}
      </div>

      {/* Footer: author + clone count + button */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-border">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center text-[9px] text-white font-bold shrink-0">
            {author?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="text-xs text-muted truncate">{author?.name ?? 'Unknown'}</span>
          {draft.clone_count > 0 && (
            <span className="text-xs text-muted shrink-0">· {draft.clone_count} clone{draft.clone_count !== 1 ? 's' : ''}</span>
          )}
        </div>
        <button
          onClick={() => onClone(draft.id)}
          disabled={cloning}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal text-white hover:bg-teal-2 transition-colors disabled:opacity-50 shrink-0"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
          </svg>
          {cloning ? 'Cloning…' : 'Clone'}
        </button>
      </div>
    </div>
  )
}
