'use client'

import { useState, useEffect } from 'react'

const SEMESTERS = [1, 2, 3, 4, 5, 6]

const selectCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent ' +
  'disabled:opacity-50 disabled:cursor-not-allowed'

/**
 * TopicPicker — 5-step cascade:
 *   Department → Semester → Subject → Topic (Unit) → Subtopic
 *
 * Props:
 *   onChange({ subject_id, chunk_id, topic, subtopics, subject_name, semester, parent_topic? })
 *
 * When a subtopic is selected:
 *   - topic = subtopic name (the focused area for generation)
 *   - subtopics = [] (no further nesting)
 *   - parent_topic = the unit-level topic (for prompt context)
 *
 * When only a unit topic is selected (no subtopic chosen):
 *   - topic = unit topic
 *   - subtopics = all subtopics (AI will cover all of them)
 *   - parent_topic = undefined
 */
export function TopicPicker({ onChange }) {
  // Data
  const [departments, setDepartments] = useState([])
  const [subjects,    setSubjects]    = useState([])
  const [chunks,      setChunks]      = useState([])

  // Selections
  const [deptId,     setDeptId]     = useState('')
  const [semester,   setSemester]   = useState('')
  const [subjectId,  setSubjectId]  = useState('')
  const [chunkId,    setChunkId]    = useState('')
  const [subtopic,   setSubtopic]   = useState('')   // '' means "cover all"

  // Loading
  const [loadingDepts,    setLoadingDepts]    = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingChunks,   setLoadingChunks]   = useState(false)

  const [error, setError] = useState(null)

  // ── Step 1: departments on mount ─────────────────────────────────────────
  useEffect(() => {
    setLoadingDepts(true)
    fetch('/api/syllabus/departments')
      .then((r) => r.json())
      .then(({ data }) => { setDepartments(data ?? []); setLoadingDepts(false) })
      .catch(() => { setError('Failed to load departments'); setLoadingDepts(false) })
  }, [])

  // ── Step 3: subjects when dept + semester chosen ──────────────────────────
  useEffect(() => {
    if (!deptId || !semester) {
      setSubjects([]); setSubjectId('')
      setChunks([]);   setChunkId(''); setSubtopic('')
      return
    }
    setLoadingSubjects(true)
    setSubjectId(''); setChunks([]); setChunkId(''); setSubtopic('')
    fetch(`/api/syllabus/subjects?department_id=${deptId}&semester=${semester}`)
      .then((r) => r.json())
      .then(({ data }) => { setSubjects(data ?? []); setLoadingSubjects(false) })
      .catch(() => { setError('Failed to load subjects'); setLoadingSubjects(false) })
  }, [deptId, semester])

  // ── Step 4: chunks when subject chosen ───────────────────────────────────
  useEffect(() => {
    if (!subjectId) { setChunks([]); setChunkId(''); setSubtopic(''); return }
    setLoadingChunks(true)
    setChunkId(''); setSubtopic('')
    fetch(`/api/syllabus/chunks?subject_id=${subjectId}`)
      .then((r) => r.json())
      .then(({ data }) => { setChunks(data ?? []); setLoadingChunks(false) })
      .catch(() => { setError('Failed to load topics'); setLoadingChunks(false) })
  }, [subjectId])

  // ── Emit helpers ─────────────────────────────────────────────────────────
  function emit(chunk, sub) {
    const subject = subjects.find((s) => s.id === subjectId)
    if (!chunk || !subject) { onChange?.(null); return }

    if (sub) {
      // Focused subtopic generation
      onChange?.({
        subject_id:   subjectId,
        chunk_id:     chunk.id,
        topic:        sub,
        subtopics:    [],
        subject_name: subject.name,
        semester:     Number(semester),
        parent_topic: chunk.topic,   // sent as context in prompt
      })
    } else {
      // Full topic (all subtopics)
      onChange?.({
        subject_id:   subjectId,
        chunk_id:     chunk.id,
        topic:        chunk.topic,
        subtopics:    chunk.subtopics ?? [],
        subject_name: subject.name,
        semester:     Number(semester),
      })
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleDeptChange(e) {
    setDeptId(e.target.value)
    setSemester(''); setSubjectId(''); setChunkId(''); setSubtopic('')
    setSubjects([]); setChunks([])
    onChange?.(null)
  }

  function handleSemesterChange(e) {
    setSemester(e.target.value)
    setSubjectId(''); setChunkId(''); setSubtopic('')
    setChunks([])
    onChange?.(null)
  }

  function handleSubjectChange(e) {
    setSubjectId(e.target.value)
    setChunkId(''); setSubtopic('')
    onChange?.(null)
  }

  function handleChunkChange(e) {
    const id = e.target.value
    setChunkId(id)
    setSubtopic('')
    if (!id) { onChange?.(null); return }
    const chunk = chunks.find((c) => c.id === id)
    emit(chunk, '')
  }

  function handleSubtopicChange(e) {
    const sub = e.target.value
    setSubtopic(sub)
    const chunk = chunks.find((c) => c.id === chunkId)
    emit(chunk, sub)
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedChunk = chunks.find((c) => c.id === chunkId)
  const subtopics     = selectedChunk?.subtopics ?? []
  const hasSubtopics  = subtopics.length > 0

  if (error) return <p className="text-error text-sm">{error}</p>

  return (
    <div className="space-y-4">

      {/* Step 1: Department */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-text">Department</label>
        {loadingDepts ? (
          <div className="px-3 py-2 text-sm text-muted animate-pulse">Loading departments…</div>
        ) : (
          <select value={deptId} onChange={handleDeptChange} className={selectCls}>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Step 2: Semester */}
      <div className="space-y-1">
        <label className={`block text-sm font-medium ${deptId ? 'text-text' : 'text-muted'}`}>Semester</label>
        <select
          value={semester}
          onChange={handleSemesterChange}
          disabled={!deptId}
          className={selectCls}
        >
          <option value="">Select semester</option>
          {SEMESTERS.map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
      </div>

      {/* Step 3: Subject */}
      <div className="space-y-1">
        <label className={`block text-sm font-medium ${semester ? 'text-text' : 'text-muted'}`}>Subject</label>
        {loadingSubjects ? (
          <div className="px-3 py-2 text-sm text-muted animate-pulse">Loading subjects…</div>
        ) : (
          <select
            value={subjectId}
            onChange={handleSubjectChange}
            disabled={!semester}
            className={selectCls}
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        )}
        {semester && !loadingSubjects && subjects.length === 0 && (
          <p className="text-xs text-muted">No subjects found for this department and semester.</p>
        )}
      </div>

      {/* Step 4: Unit / Topic */}
      <div className="space-y-1">
        <label className={`block text-sm font-medium ${subjectId ? 'text-text' : 'text-muted'}`}>
          Unit / Topic
        </label>
        {loadingChunks ? (
          <div className="px-3 py-2 text-sm text-muted animate-pulse">Loading topics…</div>
        ) : subjectId && chunks.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted bg-bg border border-border rounded-lg">
            No topics available — syllabus not yet uploaded for this subject.
          </div>
        ) : (
          <select
            value={chunkId}
            onChange={handleChunkChange}
            disabled={!subjectId || chunks.length === 0}
            className={selectCls}
          >
            <option value="">Select topic</option>
            {chunks.map((c) => (
              <option key={c.id} value={c.id}>
                {c.unit_number ? `Unit ${c.unit_number}: ` : ''}{c.topic}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Step 5: Subtopic (only shown if the selected chunk has subtopics) */}
      {chunkId && hasSubtopics && (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">
            Subtopic
            <span className="ml-2 text-xs font-normal text-muted">(optional — leave blank to cover the full topic)</span>
          </label>
          <select
            value={subtopic}
            onChange={handleSubtopicChange}
            className={selectCls}
          >
            <option value="">All subtopics (full topic overview)</option>
            {subtopics.map((st, i) => (
              <option key={i} value={st}>{st}</option>
            ))}
          </select>

          {/* Visual hint showing selected focus */}
          {subtopic && (
            <div className="flex items-center gap-2 px-3 py-2 bg-teal-light border border-teal rounded-lg">
              <svg className="w-3.5 h-3.5 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-teal font-medium">
                AI will focus only on: <strong>{subtopic}</strong>
              </span>
            </div>
          )}

          {!subtopic && chunkId && (
            <div className="flex items-center gap-2 px-3 py-2 bg-bg border border-border rounded-lg">
              <svg className="w-3.5 h-3.5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <span className="text-xs text-muted">
                AI will cover all {subtopics.length} subtopics of this unit.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
