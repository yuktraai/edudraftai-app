import Link from 'next/link'

const TYPE_META = {
  lesson_notes:  { label: 'Lesson Notes',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  mcq_bank:      { label: 'MCQ Bank',        color: 'bg-purple-50 text-purple-700 border-purple-200' },
  question_bank: { label: 'Question Bank',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
  test_plan:     { label: 'Internal Test',   color: 'bg-teal-light text-teal border-teal' },
  exam_paper:    { label: 'Exam Paper',      color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
}

const MODEL_LABELS = {
  'gpt-4o':                    'GPT-4o',
  'claude-3-5-sonnet-20241022':'Claude 3.5',
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function estimateWords(text) {
  if (!text) return 0
  return Math.round(text.trim().split(/\s+/).length)
}

// Friendly display labels for auto-tags
const TAG_LABELS = {
  lesson_notes:  'Lesson Notes',
  mcq_bank:      'MCQ Bank',
  question_bank: 'Question Bank',
  test_plan:     'Internal Test',
  exam_paper:    'Exam Paper',
}

export function DraftCard({ draft, folderName = null, footerActions = null }) {
  const meta        = TYPE_META[draft.content_type] ?? { label: draft.content_type, color: 'bg-bg text-muted border-border' }
  const topic       = draft.prompt_params?.topic ?? '—'
  const parentTopic = draft.prompt_params?.parent_topic
  const subject     = draft.subjects?.name ?? 'Unknown Subject'
  const semester    = draft.subjects?.semester
  const words       = estimateWords(draft.raw_output)
  const model       = MODEL_LABELS[draft.ai_model] ?? draft.ai_model ?? '—'

  // Tags: filter out the content_type tag (shown as the type badge) and subject name (shown in subject line)
  const displayTags = (draft.tags ?? []).filter(
    t => !Object.keys(TYPE_META).includes(t) && t !== subject
  )

  return (
    <Link href={`/drafts/${draft.id}`} className="block group">
      <div className="bg-surface border border-border rounded-xl p-5 hover:border-teal hover:shadow-sm transition-all duration-150">
        {/* Top row: type badge + date + overflow indicator */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.color}`}>
            {meta.label}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-muted">{formatDate(draft.created_at)}</span>
            <span className="text-xs text-muted/50 tracking-widest select-none">···</span>
          </div>
        </div>

        {/* Subject */}
        <p className="text-xs text-muted mb-1">
          {subject}{semester ? ` · Sem ${semester}` : ''}
        </p>

        {/* Topic */}
        <p className="text-sm font-semibold text-text leading-snug group-hover:text-teal transition-colors line-clamp-2">
          {parentTopic ? (
            <span>
              <span className="font-normal text-muted">{parentTopic} › </span>
              {topic}
            </span>
          ) : topic}
        </p>

        {/* Tags + folder badge */}
        {(folderName || displayTags.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {folderName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-navy/5 text-navy text-xs font-medium border border-navy/10">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                {folderName}
              </span>
            )}
            {displayTags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-md bg-bg text-muted text-xs border border-border">
                {TAG_LABELS[tag] ?? tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer: word count + model + optional actions + view */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
          <span className="flex items-center gap-1 text-xs text-muted">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            {words.toLocaleString()} words
          </span>
          <span className="flex items-center gap-1 text-xs text-muted">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            {model}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {footerActions}
            <span className="flex items-center gap-1 text-xs text-muted">
              <svg className="w-3.5 h-3.5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              View
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
