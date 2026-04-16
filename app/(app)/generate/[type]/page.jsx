'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopicPicker } from '@/components/syllabus/TopicPicker'
import { OutputViewer } from '@/components/generation/OutputViewer'
import { Button } from '@/components/ui/Button'

const TYPE_META = {
  lesson_notes: {
    title:       'Lesson Notes',
    description: 'AI-generated structured notes based on your syllabus topic.',
  },
  mcq_bank: {
    title:       'MCQ Bank',
    description: 'Multiple choice questions with answer key.',
  },
  question_bank: {
    title:       'Question Bank',
    description: 'SCTEVT-format 2, 5, and 10-mark questions.',
  },
  test_plan: {
    title:       'Internal Test',
    description: 'Ready-to-print internal test paper.',
  },
}

const DIFFICULTY_OPTIONS = ['basic', 'intermediate', 'advanced']

// ── Per-type param forms ──────────────────────────────────────────────────────
function LessonNotesParams({ params, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-muted mb-1">Difficulty Level</label>
        <div className="flex gap-2">
          {DIFFICULTY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ ...params, difficulty: d })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                params.difficulty === d
                  ? 'bg-teal text-white border-teal'
                  : 'bg-bg border-border text-muted hover:border-teal hover:text-teal'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function McqBankParams({ params, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-muted mb-1">Number of Questions</label>
        <select
          value={params.count ?? 10}
          onChange={(e) => onChange({ ...params, count: Number(e.target.value) })}
          className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
        >
          {[5, 10, 15, 20, 25].map((n) => <option key={n} value={n}>{n} questions</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted mb-1">Difficulty</label>
        <select
          value={params.difficulty ?? 'intermediate'}
          onChange={(e) => onChange({ ...params, difficulty: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
        >
          {DIFFICULTY_OPTIONS.map((d) => <option key={d} value={d} className="capitalize">{d}</option>)}
        </select>
      </div>
    </div>
  )
}

function QuestionBankParams({ params, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { key: 'marks_2', label: '2-Mark Questions' },
        { key: 'marks_5', label: '5-Mark Questions' },
        { key: 'marks_10', label: '10-Mark Questions' },
      ].map(({ key, label }) => (
        <div key={key}>
          <label className="block text-xs font-medium text-muted mb-1">{label}</label>
          <select
            value={params[key] ?? (key === 'marks_2' ? 5 : key === 'marks_5' ? 4 : 2)}
            onChange={(e) => onChange({ ...params, [key]: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
          >
            {[2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      ))}
    </div>
  )
}

function TestPlanParams({ params, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-muted mb-1">Total Marks</label>
        <select
          value={params.total_marks ?? 30}
          onChange={(e) => onChange({ ...params, total_marks: Number(e.target.value) })}
          className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
        >
          {[20, 25, 30, 40, 50].map((n) => <option key={n} value={n}>{n} marks</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted mb-1">Duration</label>
        <select
          value={params.duration_mins ?? 60}
          onChange={(e) => onChange({ ...params, duration_mins: Number(e.target.value) })}
          className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
        >
          {[30, 45, 60, 90, 120].map((n) => <option key={n} value={n}>{n} minutes</option>)}
        </select>
      </div>
    </div>
  )
}

const PARAM_DEFAULTS = {
  lesson_notes:  { difficulty: 'intermediate' },
  mcq_bank:      { count: 10, difficulty: 'intermediate' },
  question_bank: { marks_2: 5, marks_5: 4, marks_10: 2 },
  test_plan:     { total_marks: 30, duration_mins: 60 },
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GenerateTypePage() {
  const { type } = useParams()
  const router = useRouter()
  const meta = TYPE_META[type]

  const [topic, setTopic]           = useState(null)  // from TopicPicker
  const [params, setParams]         = useState(PARAM_DEFAULTS[type] ?? {})
  const [output, setOutput]         = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError]           = useState(null)
  const [balance, setBalance]       = useState(null)
  const [generationId, setGenerationId] = useState(null)

  // Redirect if invalid type
  useEffect(() => {
    if (!meta) router.replace('/generate')
  }, [meta, router])

  // Fetch credit balance
  useEffect(() => {
    fetch('/api/credits/balance')
      .then(r => r.json())
      .then(({ balance }) => setBalance(balance ?? 0))
      .catch(() => setBalance(0))
  }, [output]) // re-fetch after each generation

  async function handleGenerate() {
    if (!topic?.subject_id) return
    setError(null)
    setOutput('')
    setGenerationId(null)
    setIsStreaming(true)

    const body = {
      content_type: type,
      subject_id:   topic.subject_id,
      chunk_id:     topic.chunk_id ?? null,
      params: {
        ...params,
        topic:        topic.topic,
        subtopics:    topic.subtopics ?? [],
        subject_name: topic.subject_name,
        semester:     topic.semester,
        // test_plan needs topics_covered array
        ...(type === 'test_plan' ? { topics_covered: topic.subtopics ?? [topic.topic] } : {}),
      },
    }

    try {
      const res = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? `Error ${res.status}`)
        setIsStreaming(false)
        return
      }

      // Capture generation ID from header
      const genId = res.headers.get('X-Generation-Id')
      if (genId) setGenerationId(genId)

      // Stream the response
      const reader  = res.body.getReader()
      const decoder = new TextDecoder()

      let accumulated = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        accumulated += text
        setOutput(accumulated)
      }

      // Check for generation error marker
      if (accumulated.includes('[GENERATION_ERROR]:')) {
        const msg = accumulated.split('[GENERATION_ERROR]:')[1].trim()
        setError(`Generation failed: ${msg}`)
      }
    } catch (err) {
      setError(`Network error: ${err.message}`)
    } finally {
      setIsStreaming(false)
    }
  }

  if (!meta) return null

  const canGenerate = topic?.subject_id && !isStreaming && (balance ?? 0) > 0

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/generate')}
          className="text-muted hover:text-text transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">{meta.title}</h1>
          <p className="text-muted text-sm">{meta.description}</p>
        </div>
        {balance !== null && (
          <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            balance > 0
              ? 'bg-teal-light border-teal text-teal'
              : 'bg-red-50 border-red-200 text-error'
          }`}>
            {balance} credit{balance !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
        {/* Step 1: Topic */}
        <div>
          <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-navy text-white text-xs flex items-center justify-center font-bold">1</span>
            Select Topic from Syllabus
          </h2>
          <TopicPicker onChange={setTopic} />
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Step 2: Type-specific params */}
        <div>
          <h2 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-navy text-white text-xs flex items-center justify-center font-bold">2</span>
            Configure Output
          </h2>
          {type === 'lesson_notes'  && <LessonNotesParams  params={params} onChange={setParams} />}
          {type === 'mcq_bank'      && <McqBankParams      params={params} onChange={setParams} />}
          {type === 'question_bank' && <QuestionBankParams params={params} onChange={setParams} />}
          {type === 'test_plan'     && <TestPlanParams     params={params} onChange={setParams} />}
        </div>

        {/* Generate button */}
        <div className="pt-1">
          {balance === 0 ? (
            <div className="flex items-center gap-2 text-sm text-error bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              Out of credits — contact your college admin to request more.
            </div>
          ) : (
            <Button
              onClick={handleGenerate}
              loading={isStreaming}
              disabled={!canGenerate}
              className="w-full sm:w-auto px-8"
            >
              {isStreaming ? 'Generating…' : 'Generate  (1 credit)'}
            </Button>
          )}
          {!topic?.subject_id && balance > 0 && (
            <p className="text-xs text-muted mt-2">Select a topic above to enable generation.</p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-error">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* Output */}
      <OutputViewer
        content={output}
        isStreaming={isStreaming}
        generationId={generationId}
      />
    </div>
  )
}
