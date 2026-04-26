'use client'

import { useState } from 'react'

const DIFFICULTY_OPTIONS = [
  { value: 'easy',   label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard',   label: 'Hard' },
]

export function GenerationDefaults({ initialPreferences }) {
  const prefs = initialPreferences ?? {}

  const [difficulty, setDifficulty]     = useState(prefs.default_difficulty    ?? 'medium')
  const [mcqCount, setMcqCount]         = useState(prefs.default_mcq_count     ?? 20)
  const [questionCount, setQuestionCount] = useState(prefs.default_question_count ?? 10)
  const [saving, setSaving]             = useState(false)
  const [status, setStatus]             = useState(null) // 'success' | 'error'
  const [errorMsg, setErrorMsg]         = useState('')

  async function handleSave() {
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch('/api/users/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            default_difficulty:     difficulty,
            default_mcq_count:      Number(mcqCount),
            default_question_count: Number(questionCount),
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(json.error ?? 'Save failed')
      } else {
        setStatus('success')
        setTimeout(() => setStatus(null), 2000)
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-semibold text-text">Generation Defaults</h2>

      {/* Default Difficulty */}
      <div>
        <label className="block text-xs font-medium text-muted mb-2">Default Difficulty</label>
        <div className="flex gap-2">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDifficulty(opt.value)}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-colors ${
                difficulty === opt.value
                  ? 'bg-teal text-white border-teal'
                  : 'bg-bg border-border text-muted hover:border-teal hover:text-teal'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Default MCQ Count */}
      <div>
        <label className="block text-xs font-medium text-muted mb-1.5">
          Default number of questions in MCQ bank
        </label>
        <input
          type="number"
          min={5}
          max={50}
          value={mcqCount}
          onChange={(e) => setMcqCount(Math.min(50, Math.max(5, Number(e.target.value))))}
          className="w-32 px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none min-h-[44px]"
        />
      </div>

      {/* Default Question Count */}
      <div>
        <label className="block text-xs font-medium text-muted mb-1.5">
          Default number of questions in Question Bank
        </label>
        <input
          type="number"
          min={5}
          max={50}
          value={questionCount}
          onChange={(e) => setQuestionCount(Math.min(50, Math.max(5, Number(e.target.value))))}
          className="w-32 px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none min-h-[44px]"
        />
      </div>

      {/* Save button + feedback */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-teal text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Defaults'}
        </button>
        {status === 'success' && (
          <span className="text-sm font-medium text-success">Saved!</span>
        )}
        {status === 'error' && (
          <span className="text-sm text-error">{errorMsg}</span>
        )}
      </div>
    </div>
  )
}
