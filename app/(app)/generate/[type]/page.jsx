'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { TopicPicker } from '@/components/syllabus/TopicPicker'
import { OutputViewer } from '@/components/generation/OutputViewer'
import { Button } from '@/components/ui/Button'
import { BulkProgressBar } from '@/components/generation/BulkProgressBar'

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
  exam_paper: {
    title:       'Exam Paper',
    description: 'SCTE&VT-pattern examination paper with Group A, B, C.',
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

function ExamPaperParams({ params, onChange }) {
  const EXAM_TYPES = [
    { value: 'mid_semester',  label: 'Mid-Semester',  marks: 50,  duration: 90,  pattern: '10×1M + 5×4M + 1×10M = 50 Marks' },
    { value: 'end_semester',  label: 'End-Semester',  marks: 100, duration: 180, pattern: '10×1M + 5×6M + 2×10M = 100 Marks' },
  ]

  function setExamType(et) {
    const found = EXAM_TYPES.find(x => x.value === et)
    onChange({
      ...params,
      exam_type:     et,
      total_marks:   found?.marks    ?? 100,
      duration_mins: found?.duration ?? 180,
    })
  }

  const selected = EXAM_TYPES.find(x => x.value === (params.exam_type ?? 'end_semester'))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-muted mb-2">Exam Type</label>
        <div className="grid grid-cols-2 gap-3">
          {EXAM_TYPES.map(et => (
            <button
              key={et.value}
              type="button"
              onClick={() => setExamType(et.value)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-colors ${
                (params.exam_type ?? 'end_semester') === et.value
                  ? 'bg-teal text-white border-teal'
                  : 'bg-bg border-border text-text hover:border-teal'
              }`}
            >
              <span className="text-sm font-semibold">{et.label}</span>
              <span className={`text-xs mt-0.5 ${(params.exam_type ?? 'end_semester') === et.value ? 'text-white/80' : 'text-muted'}`}>
                {et.pattern}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Total Marks</label>
          <input
            type="number"
            value={params.total_marks ?? selected?.marks ?? 100}
            onChange={e => onChange({ ...params, total_marks: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1">Duration (minutes)</label>
          <input
            type="number"
            value={params.duration_mins ?? selected?.duration ?? 180}
            onChange={e => onChange({ ...params, duration_mins: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
          />
        </div>
      </div>
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
  exam_paper:    { exam_type: 'end_semester', total_marks: 100, duration_mins: 180 },
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

  const [regenParentId, setRegenParentId]   = useState(null)

  const [bulkParentId, setBulkParentId]     = useState(null)
  const [bulkTopicCount, setBulkTopicCount] = useState(0)
  const [isBulking, setIsBulking]           = useState(false)

  const [templates, setTemplates]           = useState([])
  const [showSaveModal, setShowSaveModal]   = useState(false)
  const [templateName, setTemplateName]     = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateMsg, setTemplateMsg]       = useState(null)

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

  // Fetch saved templates for this content type
  useEffect(() => {
    if (!type) return
    fetch(`/api/templates?content_type=${type}`)
      .then(r => r.json())
      .then(({ templates }) => setTemplates(templates ?? []))
      .catch(() => {})
  }, [type])

  async function handleGenerate({ regenerationInstruction, parentGenerationId } = {}) {
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
      ...(parentGenerationId ? { parent_generation_id: parentGenerationId, regeneration_instruction: regenerationInstruction } : {}),
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

  async function handleRegenerate(instruction) {
    if (!generationId) return
    setRegenParentId(generationId)
    await handleGenerate({ regenerationInstruction: instruction, parentGenerationId: generationId })
  }

  async function handleBulkGenerate() {
    if (!topic?.subject_id || !topic?.unit_number) return
    setError(null)
    setBulkParentId(null)
    setIsBulking(true)
    try {
      const res = await fetch('/api/generate/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_number: topic.unit_number,
          subject_id:  topic.subject_id,
          content_type: type,
          params,
        }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error ?? 'Bulk generation failed'); setIsBulking(false); return }
      setBulkParentId(j.parent_id)
      setBulkTopicCount(j.topic_count)
    } catch (err) {
      setError(err.message)
      setIsBulking(false)
    }
  }

  async function handleSaveTemplate() {
    if (!templateName.trim()) return
    setSavingTemplate(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: templateName.trim(), content_type: type, params }),
      })
      const j = await res.json()
      if (!res.ok) {
        setTemplateMsg({ type: 'error', text: j.error ?? 'Failed to save template' })
      } else {
        setTemplates(prev => [j.template, ...prev])
        setShowSaveModal(false)
        setTemplateName('')
        setTemplateMsg({ type: 'success', text: `Template "${j.template.name}" saved!` })
        setTimeout(() => setTemplateMsg(null), 3000)
      }
    } finally {
      setSavingTemplate(false)
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
        {/* My Templates — hidden for lesson notes (only 1 param, not worth templating) */}
        {type !== 'lesson_notes' && templates.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pb-4 border-b border-border -mt-2">
            <span className="text-xs font-medium text-muted shrink-0">My Templates:</span>
            {templates.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setParams(t.params)}
                title={`Load template: ${t.name}`}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-bg border border-border text-text hover:border-teal hover:text-teal transition-colors"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

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
          {type === 'exam_paper'    && <ExamPaperParams    params={params} onChange={setParams} />}
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

          {/* Bulk generation */}
          {topic?.unit_number && !bulkParentId && (
            <button
              type="button"
              onClick={handleBulkGenerate}
              disabled={isBulking || (balance ?? 0) === 0}
              className="flex items-center gap-2 text-sm font-medium text-navy border border-navy/20 rounded-xl px-4 py-2.5 bg-navy/5 hover:bg-navy/10 transition-colors disabled:opacity-50 mt-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
              {isBulking ? 'Starting bulk generation\u2026' : 'Generate for Entire Unit (uses multiple credits)'}
            </button>
          )}
          {bulkParentId && (
            <BulkProgressBar
              parentId={bulkParentId}
              topicCount={bulkTopicCount}
              onComplete={() => setIsBulking(false)}
            />
          )}

          {/* Save as Template — hidden for lesson notes */}
          {type !== 'lesson_notes' && (
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-teal transition-colors mt-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              Save current settings as template
            </button>
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
        onRegenerate={handleRegenerate}
      />

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
            <h3 className="font-semibold text-text">Save as Template</h3>
            <p className="text-xs text-muted">Name this set of settings so you can load it next time.</p>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
              placeholder="e.g. My MCQ Defaults"
              maxLength={60}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowSaveModal(false); setTemplateName('') }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-muted border border-border rounded-xl hover:border-text transition-colors"
              >Cancel</button>
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !templateName.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-teal text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savingTemplate ? 'Saving\u2026' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template feedback toast */}
      {templateMsg && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          templateMsg.type === 'success' ? 'bg-teal text-white' : 'bg-error text-white'
        }`}>
          {templateMsg.text}
        </div>
      )}
    </div>
  )
}
