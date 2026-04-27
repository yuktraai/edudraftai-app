'use client'

import { useRouter } from 'next/navigation'

const CONTENT_TYPE_LABELS = {
  lesson_notes:  'Lesson Notes',
  mcq_bank:      'MCQ Bank',
  question_bank: 'Question Bank',
  test_plan:     'Internal Test',
  exam_paper:    'Exam Paper',
}

/**
 * DuplicateWarningModal
 * Shown when the API returns 409 duplicate for the same topic + content type within 30 days.
 * Two options: view the existing draft, or force-generate a new one (costs 1 credit).
 */
export function DuplicateWarningModal({ contentType, existingDraftId, generatedAt, onForce, onClose }) {
  const router = useRouter()

  const label = CONTENT_TYPE_LABELS[contentType] ?? contentType
  const date  = generatedAt
    ? new Date(generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'recently'

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + heading */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full bg-warning/10 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-text">Already generated recently</h2>
            <p className="text-sm text-muted mt-1 leading-relaxed">
              You already generated <strong className="text-text">{label}</strong> for this topic on{' '}
              <strong className="text-text">{date}</strong>.
            </p>
            <p className="text-sm text-muted mt-1.5">
              Generating again will use <strong className="text-text">1 credit</strong>.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            onClick={() => router.push(`/drafts/${existingDraftId}`)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-bg text-text text-sm font-semibold hover:border-teal hover:text-teal transition-colors"
          >
            View Existing Draft
          </button>
          <button
            onClick={() => { onForce(); onClose() }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-2 transition-colors"
          >
            Generate Anyway (1 credit)
          </button>
        </div>

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-text transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
