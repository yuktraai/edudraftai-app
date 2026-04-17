'use client'

import { useState, useEffect } from 'react'

const SEMESTERS = [1, 2, 3, 4, 5, 6]
const MAX_SUBTOPICS = 5

const selectCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent ' +
  'disabled:opacity-50 disabled:cursor-not-allowed'

/**
 * TopicPicker — 5-step cascade:
 *   Department → Semester → Subject → Unit/Topic → Subtopics (multi-select)
 *
 * Phase 10C: Step 5 is now multi-select checkboxes (1–5 subtopics).
 *
 * Props:
 *   onChange({ subject_id, chunk_id, topic, subtopics[], subject_name, semester })
 *
 * subtopics[] — the user's selected subtopics (1–5).
 * If no subtopics are selected, the full chunk subtopic list is emitted
 * (AI covers all of them).
 */
export function TopicPicker({ onChange }) {
  // Data
  const [departments,  setDepartments]  = useState([])
  const [subjects,     setSubjects]     = useState([])
  const [chunks,       setChunks]       = useState([])
  const [favSubjects,  setFavSubjects]  = useState(new Set())

  // Selections
  const [deptId,          setDeptId]          = useState('')
  const [semester,        setSemester]        = useState('')
  const [subjectId,       setSubjectId]       = useState('')
  const [chunkId,         setChunkId]         = useState('')
  const [selectedSubs,    setSelectedSubs]    = useState(new Set())  // multi-select

  // Loading
  const [loadingDepts,    setLoadingDepts]    = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingChunks,   setLoadingChunks]   = useState(false)

  const [error, setError] = useState(null)

  // ── Step 1: departments + favorites on mount ──────────────────────────────
  useEffect(() => {
    setLoadingDepts(true)
    Promise.all([
      fetch('/api/syllabus/departments').then(r => r.json()),
      fetch('/api/favorites').then(r => r.json()),
    ]).then(([deptRes, favRes]) => {
      setDepartments(deptRes.data ?? [])
      setFavSubjects(new Set(favRes.data?.subjects ?? []))
      setLoadingDepts(false)
    }).catch(() => {
      setError('Failed to load departments')
      setLoadingDepts(false)
    })
  }, [])

  // ── Step 3: subjects when dept + semester chosen ──────────────────────────
  useEffect(() => {
    if (!deptId || !semester) {
      setSubjects([]);  setSubjectId('')
      setChunks([]);    setChunkId('');  setSelectedSubs(new Set())
      return
    }
    setLoadingSubjects(true)
    setSubjectId(''); setChunks([]); setChunkId(''); setSelectedSubs(new Set())
    fetch(`/api/syllabus/subjects?department_id=${deptId}&semester=${semester}`)
      .then(r => r.json())
      .then(({ data }) => { setSubjects(data ?? []); setLoadingSubjects(false) })
      .catch(() => { setError('Failed to load subjects'); setLoadingSubjects(false) })
  }, [deptId, semester])

  // ── Step 4: chunks when subject chosen ───────────────────────────────────
  useEffect(() => {
    if (!subjectId) { setChunks([]); setChunkId(''); setSelectedSubs(new Set()); return }
    setLoadingChunks(true)
    setChunkId(''); setSelectedSubs(new Set())
    fetch(`/api/syllabus/chunks?subject_id=${subjectId}`)
      .then(r => r.json())
      .then(({ data }) => { setChunks(data ?? []); setLoadingChunks(false) })
      .catch(() => { setError('Failed to load topics'); setLoadingChunks(false) })
  }, [subjectId])

  // ── Emit ──────────────────────────────────────────────────────────────────
  function emit(chunk, subs) {
    const subject = subjects.find(s => s.id === subjectId)
    if (!chunk || !subject) { onChange?.(null); return }
    const selectedArr = [...subs]
    onChange?.({
      subject_id:   subjectId,
      chunk_id:     chunk.id,
      topic:        chunk.topic,
      // If user selected specific subtopics, emit those; else emit all (full topic)
      subtopics:    selectedArr.length > 0 ? selectedArr : (chunk.subtopics ?? []),
      subject_name: subject.name,
      semester:     Number(semester),
    })
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleDeptChange(e) {
    setDeptId(e.target.value)
    setSemester(''); setSubjectId(''); setChunkId(''); setSelectedSubs(new Set())
    setSubjects([]); setChunks([])
    onChange?.(null)
  }

  function handleSemesterChange(e) {
    setSemester(e.target.value)
    setSubjectId(''); setChunkId(''); setSelectedSubs(new Set())
    setChunks([])
    onChange?.(null)
  }

  function handleSubjectChange(e) {
    setSubjectId(e.target.value)
    setChunkId(''); setSelectedSubs(new Set())
    onChange?.(null)
  }

  function handleChunkChange(e) {
    const id = e.target.value
    setChunkId(id)
    setSelectedSubs(new Set())   // reset subtopic selection when unit changes
    if (!id) { onChange?.(null); return }
    const chunk = chunks.find(c => c.id === id)
    emit(chunk, new Set())       // emit with no selection = full topic coverage
  }

  function handleSubtopicToggle(st) {
    const chunk = chunks.find(c => c.id === chunkId)
    setSelectedSubs(prev => {
      const next = new Set(prev)
      if (next.has(st))         next.delete(st)
      else if (next.size < MAX_SUBTOPICS) next.add(st)
      emit(chunk, next)
      return next
    })
  }

  function handleSelectAll() {
    const chunk = chunks.find(c => c.id === chunkId)
    if (!chunk) return
    const all = new Set((chunk.subtopics ?? []).slice(0, MAX_SUBTOPICS))
    setSelectedSubs(all)
    emit(chunk, all)
  }

  function handleClearAll() {
    const chunk = chunks.find(c => c.id === chunkId)
    setSelectedSubs(new Set())
    emit(chunk, new Set())
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedChunk  = chunks.find(c => c.id === chunkId)
  const subtopics      = selectedChunk?.subtopics ?? []
  const hasSubtopics   = subtopics.length > 0
  const selCount       = selectedSubs.size
  const maxReached     = selCount >= MAX_SUBTOPICS

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
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Step 2: Semester */}
      <div className="space-y-1">
        <label className={`block text-sm font-medium ${deptId ? 'text-text' : 'text-muted'}`}>Semester</label>
        <select value={semester} onChange={handleSemesterChange} disabled={!deptId} className={selectCls}>
          <option value="">Select semester</option>
          {SEMESTERS.map(s => (
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
          <select value={subjectId} onChange={handleSubjectChange} disabled={!semester} className={selectCls}>
            <option value="">Select subject</option>
            {/* Favourited subjects first */}
            {subjects.filter(s => favSubjects.has(s.id)).map(s => (
              <option key={s.id} value={s.id}>★ {s.name} ({s.code})</option>
            ))}
            {subjects.filter(s => favSubjects.has(s.id)).length > 0 &&
              subjects.filter(s => !favSubjects.has(s.id)).length > 0 && (
              <option disabled>── Other subjects ──</option>
            )}
            {subjects.filter(s => !favSubjects.has(s.id)).map(s => (
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
            {chunks.map(c => (
              <option key={c.id} value={c.id}>
                {c.unit_number ? `Unit ${c.unit_number}: ` : ''}{c.topic}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Step 5: Subtopics — multi-select checkboxes (Phase 10C) */}
      {chunkId && hasSubtopics && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-text">
              Subtopics
              <span className="ml-2 text-xs font-normal text-muted">
                (select up to {MAX_SUBTOPICS})
              </span>
            </label>
            <div className="flex items-center gap-2">
              {selCount > 0 && (
                <span className="text-xs font-semibold text-teal bg-teal-light px-2 py-0.5 rounded-full border border-teal/20">
                  {selCount} selected
                </span>
              )}
              <button
                type="button"
                onClick={handleClearAll}
                disabled={selCount === 0}
                className="text-xs text-muted hover:text-text disabled:opacity-30 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Checkbox list */}
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border bg-surface">
            {subtopics.map((st, i) => {
              const checked    = selectedSubs.has(st)
              const disabled   = maxReached && !checked
              return (
                <label
                  key={i}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    checked   ? 'bg-teal-light cursor-pointer' :
                    disabled  ? 'opacity-40 cursor-not-allowed bg-bg' :
                    'hover:bg-bg cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => !disabled && handleSubtopicToggle(st)}
                    className="w-4 h-4 rounded accent-teal shrink-0"
                  />
                  <span className={`text-sm leading-snug ${checked ? 'text-teal font-medium' : 'text-text'}`}>
                    {st}
                  </span>
                </label>
              )
            })}
          </div>

          {/* Status message */}
          {selCount === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-bg border border-border rounded-lg">
              <svg className="w-3.5 h-3.5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <span className="text-xs text-muted">
                No subtopics selected — AI will cover all {subtopics.length} subtopics of this unit.
              </span>
            </div>
          ) : maxReached ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <svg className="w-3.5 h-3.5 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="text-xs text-warning">Maximum {MAX_SUBTOPICS} subtopics reached.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-teal-light border border-teal/20 rounded-lg">
              <svg className="w-3.5 h-3.5 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-teal font-medium">
                AI will focus on {selCount} selected subtopic{selCount !== 1 ? 's' : ''}.
              </span>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
