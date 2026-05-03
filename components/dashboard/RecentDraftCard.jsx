import Link from 'next/link'

const TYPE_META = {
  lesson_notes:  { label: 'Lesson Notes',  accent: '#3B82F6' },
  mcq_bank:      { label: 'MCQ Bank',      accent: '#8B5CF6' },
  question_bank: { label: 'Question Bank', accent: '#F59E0B' },
  test_plan:     { label: 'Internal Test', accent: '#00B4A6' },
  exam_paper:    { label: 'Exam Paper',    accent: '#6366F1' },
}

function relativeTime(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function firstSentence(text, maxChars = 120) {
  if (!text) return ''
  const clean = text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*{1,2}(.+?)\*{1,2}/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
  return clean.length > maxChars ? clean.slice(0, maxChars).trimEnd() + '…' : clean
}

export function RecentDraftCard({ draft }) {
  const meta    = TYPE_META[draft.content_type] ?? { label: draft.content_type, accent: '#718096' }
  const topic   = draft.prompt_params?.topic ?? '—'
  const subject = draft.subjects?.name ?? ''
  const sem     = draft.subjects?.semester
  const preview = firstSentence(draft.raw_output ?? '')

  return (
    <Link href={`/drafts/${draft.id}`} className="group block">
      <div
        className="bg-surface border border-border rounded-xl p-4 hover:border-teal hover:shadow-sm transition-all duration-150 h-full relative overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        {/* Left accent border */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-r-sm"
          style={{ background: meta.accent }}
        />

        <div className="pl-3">
          {/* Top row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wide">
              {meta.label}
            </span>
            <span className="text-[10px] text-muted shrink-0">{relativeTime(draft.created_at)}</span>
          </div>

          {/* Topic */}
          <p className="text-sm font-bold text-text group-hover:text-teal transition-colors line-clamp-1 leading-snug mb-1">
            {topic}
          </p>

          {/* Meta */}
          {subject && (
            <p className="text-xs text-muted truncate mb-2">
              {subject}{sem ? ` · Sem ${sem}` : ''}
            </p>
          )}

          {/* Preview */}
          {preview && (
            <p className="text-xs text-muted italic line-clamp-2 leading-relaxed">
              {preview}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
