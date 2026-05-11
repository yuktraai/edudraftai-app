'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { TopicPicker } from '@/components/syllabus/TopicPicker'
import { DiagramViewer } from '@/components/generation/DiagramViewer'

const DIAGRAM_TYPES = [
  {
    value:       'block_diagram',
    label:       'Block Diagram',
    description: 'Components & signal flow',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    value:       'flowchart',
    label:       'Flowchart',
    description: 'Algorithms & process flow',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    value:       'system_overview',
    label:       'System Overview',
    description: 'Architecture & layers',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
      </svg>
    ),
  },
]

export default function DiagramGeneratePage() {
  const viewerRef = useRef(null)

  // Topic picker state
  const [subjectId,   setSubjectId]   = useState(null)
  const [chunkId,     setChunkId]     = useState(null)
  const [topicLabel,  setTopicLabel]  = useState('')

  // Form params
  const [diagramType,       setDiagramType]       = useState('block_diagram')
  const [complexity,        setComplexity]        = useState('simple')
  const [orientation,       setOrientation]       = useState('LR')
  const [focusDescription,  setFocusDescription]  = useState('')

  // Credits
  const [credits, setCredits] = useState(null)

  // Generation state
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [result,     setResult]     = useState(null)   // { generation_id, mermaid_code, diagram_type }

  useEffect(() => {
    async function fetchCredits() {
      try {
        const res  = await fetch('/api/credits/balance')
        const data = await res.json()
        setCredits(data.balance ?? 0)
      } catch { setCredits(0) }
    }
    fetchCredits()
  }, [])

  async function handleGenerate() {
    if (!subjectId) { setError('Please select a subject first.'); return }
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const res = await fetch('/api/generate/diagram', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id:        subjectId,
          chunk_id:          chunkId ?? null,
          diagram_type:      diagramType,
          orientation:       diagramType === 'flowchart' ? 'TD' : orientation,
          complexity,
          focus_description: focusDescription.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (res.status === 402) {
        setError('out_of_credits')
        setLoading(false)
        return
      }
      if (res.status === 422) {
        setError(data?.error ?? 'Could not generate a valid diagram. Try a simpler description.')
        setLoading(false)
        return
      }
      if (!res.ok) {
        setError(data?.error ?? 'Generation failed. Please try again.')
        setLoading(false)
        return
      }

      setResult(data)
      setCredits(c => (c !== null ? c - 1 : c))
      setTimeout(() => {
        viewerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const charCount = focusDescription.length

  return (
    <div className="p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/generate" className="text-sm text-muted hover:text-navy transition-colors">
              ← Generate
            </Link>
            <span className="text-muted text-sm">/</span>
            <span className="text-sm text-navy font-medium">Diagram</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-navy">Generate Diagram</h1>
          <p className="text-muted text-sm mt-1">Block diagrams, flowcharts & system overviews. Renders instantly — export as SVG or PNG.</p>
        </div>

        {/* Credit balance */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold shrink-0 ${
          credits === null ? 'bg-bg border-border text-muted' :
          credits > 0 ? 'bg-teal-light border-teal text-teal' : 'bg-red-50 border-red-200 text-error'
        }`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {credits === null ? '…' : `${credits} credit${credits !== 1 ? 's' : ''} remaining`}
        </div>
      </div>

      {/* Out of credits banner */}
      {error === 'out_of_credits' && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <svg className="w-5 h-5 text-error shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-error">Out of credits</p>
            <p className="text-xs text-red-600 mt-0.5">
              Contact your college admin to request more, or{' '}
              <Link href="/credits/buy" className="underline">purchase personal credits</Link>.
            </p>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: TopicPicker */}
        <div className="lg:col-span-2">
          <TopicPicker
            singleSubtopic={true}
            onChange={(selection) => {
              if (!selection) {
                setSubjectId(null)
                setChunkId(null)
                setTopicLabel('')
                return
              }
              setSubjectId(selection.subject_id ?? null)
              setChunkId(selection.chunk_id ?? null)
              setTopicLabel(selection.topic ?? selection.subject_name ?? '')
              setResult(null)
              setError(null)
            }}
          />
        </div>

        {/* Right: Params */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-5">

            {/* Diagram type selector */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-3">Diagram Type</label>
              <div className="grid grid-cols-3 gap-3">
                {DIAGRAM_TYPES.map(dt => (
                  <button
                    key={dt.value}
                    type="button"
                    onClick={() => setDiagramType(dt.value)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                      diagramType === dt.value
                        ? 'border-teal bg-teal-light text-teal'
                        : 'border-border bg-bg text-muted hover:border-teal hover:text-teal'
                    }`}
                  >
                    <span className={diagramType === dt.value ? 'text-teal' : 'text-muted'}>{dt.icon}</span>
                    <span className="text-xs font-semibold leading-tight">{dt.label}</span>
                    <span className="text-xs text-muted leading-tight">{dt.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Focus description */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                What should the diagram show?
                <span className="normal-case font-normal ml-1">(optional)</span>
              </label>
              <textarea
                value={focusDescription}
                onChange={e => setFocusDescription(e.target.value.slice(0, 200))}
                rows={2}
                placeholder="e.g. All stages of a superheterodyne AM radio receiver"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none resize-none"
              />
              <p className="text-xs text-muted mt-1 text-right">
                {charCount}/200 · Leave blank to use the selected topic automatically
              </p>
            </div>

            {/* Complexity */}
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Complexity</label>
              <div className="flex gap-2">
                {[
                  { value: 'simple',   label: 'Simple',   sub: '≤10 nodes' },
                  { value: 'detailed', label: 'Detailed', sub: '≤20 nodes' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setComplexity(opt.value)}
                    className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      complexity === opt.value
                        ? 'border-teal bg-teal-light text-teal'
                        : 'border-border bg-bg text-muted hover:border-teal hover:text-teal'
                    }`}
                  >
                    {opt.label}
                    <span className="text-xs font-normal ml-1.5 opacity-70">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation (hidden for flowchart — always TD) */}
            {diagramType !== 'flowchart' && (
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-2">Orientation</label>
                <div className="flex gap-2">
                  {[
                    { value: 'LR', label: '→ Left to Right' },
                    { value: 'TD', label: '↓ Top to Bottom' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setOrientation(opt.value)}
                      className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        orientation === opt.value
                          ? 'border-teal bg-teal-light text-teal'
                          : 'border-border bg-bg text-muted hover:border-teal hover:text-teal'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && error !== 'out_of_credits' && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-error">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.5-12.996a2.25 2.25 0 013.796 0l7.5 12.996z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !subjectId}
              className="w-full py-3 bg-teal text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Generating diagram…
                </span>
              ) : 'Generate Diagram →'}
            </button>
            {!subjectId && !loading && (
              <p className="text-xs text-muted text-center">
                ← Select a subject and topic on the left to enable generation
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Diagram viewer */}
      {result && (
        <div ref={viewerRef} className="space-y-2">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
            Generated Diagram
            {topicLabel && <span className="normal-case font-normal ml-2 text-navy">— {topicLabel}</span>}
          </h2>
          <DiagramViewer
            mermaidCode={result.mermaid_code}
            generationId={result.generation_id}
            diagramType={result.diagram_type}
          />
        </div>
      )}
    </div>
  )
}
