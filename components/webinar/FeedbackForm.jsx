'use client'
import { useState } from 'react'

function YesNo({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {[true, false].map(v => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`px-5 py-2 rounded-xl text-sm font-medium border transition-colors ${
            value === v
              ? 'bg-teal text-white border-teal'
              : 'bg-bg border-border text-muted hover:border-teal'
          }`}
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  )
}

export function FeedbackForm({ registrationId, webinarId, token }) {
  const [rating, setRating] = useState(0)
  const [foundUseful, setFoundUseful] = useState(null)
  const [wouldRecommend, setWouldRecommend] = useState(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (rating === 0) {
      setError('Please select a star rating.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/webinar/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId, webinarId, token, rating, foundUseful, wouldRecommend, comment }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      setSuccess(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="text-4xl">🙏</div>
        <h3 className="text-lg font-bold text-navy">Thank you for your feedback!</h3>
        <p className="text-muted text-sm max-w-sm mx-auto">
          Your feedback helps us build better tools for lecturers across India.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-6">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-error">
          {error}
        </div>
      )}

      {/* Star rating */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-navy">Overall rating *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-3xl transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-200'} hover:text-yellow-400`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Found useful */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-navy">Did you find this webinar useful?</label>
        <YesNo value={foundUseful} onChange={setFoundUseful} />
      </div>

      {/* Would recommend */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-navy">Would you recommend EduDraftAI to a colleague?</label>
        <YesNo value={wouldRecommend} onChange={setWouldRecommend} />
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-navy">
          Any comments? <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none resize-none"
          placeholder="Share your thoughts about the demo, content, or anything else…"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-teal text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
      >
        {loading ? 'Submitting…' : 'Submit Feedback →'}
      </button>
    </form>
  )
}
