'use client'

import { useState } from 'react'

export function FeedbackBar({ generationId, initialRating = null, initialFeedback = '' }) {
  const [rating,      setRating]      = useState(initialRating)
  const [feedbackText, setFeedbackText] = useState(initialFeedback ?? '')
  const [showInput,   setShowInput]   = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [toast,       setToast]       = useState(false)

  if (!generationId) return null

  async function submitRating(newRating) {
    const toggled = rating === newRating ? null : newRating
    setRating(toggled)
    setShowInput(toggled !== null)
    setSaving(true)
    try {
      await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ generation_id: generationId, rating: toggled, feedback_text: feedbackText }),
      })
    } finally {
      setSaving(false)
    }
  }

  async function submitText() {
    if (!feedbackText.trim()) return
    setSaving(true)
    try {
      await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ generation_id: generationId, rating, feedback_text: feedbackText }),
      })
      setShowInput(false)
      setToast(true)
      setTimeout(() => setToast(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-sm text-muted font-medium">Was this helpful?</span>

        <div className="flex items-center gap-2">
          {/* Thumbs Up */}
          <button
            onClick={() => submitRating('thumbs_up')}
            disabled={saving}
            title="Helpful"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              rating === 'thumbs_up'
                ? 'bg-teal-light border-teal text-teal'
                : 'border-border text-muted hover:border-teal hover:text-teal'
            }`}
          >
            <svg className="w-4 h-4" fill={rating === 'thumbs_up' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
            </svg>
            Yes
          </button>

          {/* Thumbs Down */}
          <button
            onClick={() => submitRating('thumbs_down')}
            disabled={saving}
            title="Not helpful"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              rating === 'thumbs_down'
                ? 'bg-red-50 border-red-300 text-error'
                : 'border-border text-muted hover:border-red-300 hover:text-error'
            }`}
          >
            <svg className="w-4 h-4" fill={rating === 'thumbs_down' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 00.303-.54m.023-8.25H16.48a4.5 4.5 0 01-1.423-.23l-3.114-1.04a4.5 4.5 0 00-1.423-.23H6.504c-.618 0-1.217.247-1.605.729A11.95 11.95 0 002.25 12c0 .434.023.863.068 1.285C2.427 14.306 3.346 15 4.372 15h3.126c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.5a2.25 2.25 0 002.25 2.25.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384" />
            </svg>
            No
          </button>
        </div>

        {toast && (
          <span className="text-xs text-success font-medium animate-fade-in">
            ✓ Thanks for your feedback!
          </span>
        )}
      </div>

      {/* Optional text note */}
      {showInput && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            maxLength={150}
            placeholder="Add a note (optional, 150 chars)"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-border rounded-lg bg-bg text-text focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
          />
          <button
            onClick={submitText}
            disabled={saving || !feedbackText.trim()}
            className="px-4 py-2 text-sm font-medium bg-teal text-white rounded-lg hover:bg-teal-2 disabled:opacity-50 transition-colors"
          >
            {saving ? '…' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  )
}
