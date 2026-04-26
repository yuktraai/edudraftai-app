'use client'

import { useState, useEffect, useCallback } from 'react'

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
 * Phase 26:  On mobile (< 768px) the dropdowns are replaced with a bottom-sheet
 *            that walks through each step as a scrollable list of tappable rows.
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
  const [selectedSubs,    setSelectedSubs]    = useState(new Set())

  // Loading
  const [loadingDepts,    setLoadingDepts]    = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingChunks,   setLoadingChunks]   = useState(false)

  const [error, setError] = useState(null)

  // Mobile bottom-sheet state
  const [sheetOpen,  setSheetOpen]  = useState(false)
  const [sheetStep,  setSheetStep]  = useState('dept') // 'dept' | 'semester' | 'subject' | 'chunk' | 'subtopics'

  // Temporary selections inside the sheet (committed on Confirm)
  const [tmpDeptId,    setTmpDeptId]    = useState('')
  const [tmpSemester,  setTmpSemester]  = useState('')
  const [tmpSubjectId, setTmpSubjectId] = useState('')
  const [tmpChunkId,   setTmpChunkId]   = useState('')
  const [tmpSubs,      setTmpSubs]      = useState(new Set())

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
      subtopics:    selectedArr.length > 0 ? selectedArr : (chunk.subtopics ?? []),
      subject_name: subject.name,
      semester:     Number(semester),
      unit_number:  chunk.unit_number ?? null,
    })
  }

  // ── Desktop handlers ──────────────────────────────────────────────────────
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
    setSelectedSubs(new Set())
    if (!id) { onChange?.(null); return }
    const chunk = chunks.find(c => c.id === id)
    emit(chunk, new Set())
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

  function handleClearAll() {
    const chunk = chunks.find(c => c.id === chunkId)
    setSelectedSubs(new Set())
    emit(chunk, new Set())
  }

  // ── Mobile bottom-sheet helpers ───────────────────────────────────────────
  function openSheet() {
    // Seed temp state from committed state
    setTmpDeptId(deptId)
    setTmpSemester(semester)
    setTmpSubjectId(subjectId)
    setTmpChunkId(chunkId)
    setTmpSubs(new Set(selectedSubs))
    setSheetStep('dept')
    setSheetOpen(true)
  }

  function closeSheet() {
    setSheetOpen(false)
  }

  // Fetch subjects for tmp dept+semester inside sheet
  const [sheetSubjects,      setSheetSubjects]      = useState([])
  const [sheetChunks,        setSheetChunks]        = useState([])
  const [loadingSheetSubs,   setLoadingSheetSubs]   = useState(false)
  const [loadingSheetChunks, setLoadingSheetChunks] = useState(false)

  // When tmpDeptId + tmpSemester change inside sheet, load subjects
  useEffect(() => {
    if (!sheetOpen || !tmpDeptId || !tmpSemester) { setSheetSubjects([]); return }
    setLoadingSheetSubs(true)
    fetch(`/api/syllabus/subjects?department_id=${tmpDeptId}&semester=${tmpSemester}`)
      .then(r => r.json())
      .then(({ data }) => { setSheetSubjects(data ?? []); setLoadingSheetSubs(false) })
      .catch(() => setLoadingSheetSubs(false))
  }, [tmpDeptId, tmpSemester, sheetOpen])

  // When tmpSubjectId changes inside sheet, load chunks
  useEffect(() => {
    if (!sheetOpen || !tmpSubjectId) { setSheetChunks([]); return }
    setLoadingSheetChunks(true)
    fetch(`/api/syllabus/chunks?subject_id=${tmpSubjectId}`)
      .then(r => r.json())
      .then(({ data }) => { setSheetChunks(data ?? []); setLoadingSheetChunks(false) })
      .catch(() => setLoadingSheetChunks(false))
  }, [tmpSubjectId, sheetOpen])

  function sheetSelectDept(id) {
    setTmpDeptId(id)
    setTmpSemester('')
    setTmpSubjectId('')
    setTmpChunkId('')
    setTmpSubs(new Set())
    setSheetSubjects([])
    setSheetChunks([])
    setSheetStep('semester')
  }

  function sheetSelectSemester(s) {
    setTmpSemester(String(s))
    setTmpSubjectId('')
    setTmpChunkId('')
    setTmpSubs(new Set())
    setSheetChunks([])
    setSheetStep('subject')
  }

  function sheetSelectSubject(id) {
    setTmpSubjectId(id)
    setTmpChunkId('')
    setTmpSubs(new Set())
    setSheetChunks([])
    setSheetStep('chunk')
  }

  function sheetSelectChunk(id) {
    setTmpChunkId(id)
    setTmpSubs(new Set())
    setSheetStep('subtopics')
  }

  function sheetToggleSub(st, subtopics) {
    setTmpSubs(prev => {
      const next = new Set(prev)
      if (next.has(st))                   next.delete(st)
      else if (next.size < MAX_SUBTOPICS) next.add(st)
      return next
    })
  }

  function sheetConfirm() {
    // Commit tmp → real state
    const wasNewDept    = tmpDeptId    !== deptId
    const wasNewSem     = tmpSemester  !== semester
    const wasNewSubject = tmpSubjectId !== subjectId

    setDeptId(tmpDeptId)
    setSemester(tmpSemester)

    if (wasNewDept || wasNewSem) {
      // subjects will be reloaded via useEffect
      setSubjects(sheetSubjects)
    }
    if (wasNewSubject || wasNewDept || wasNewSem) {
      setChunks(sheetChunks)
    }

    setSubjectId(tmpSubjectId)
    setChunkId(tmpChunkId)
    setSelectedSubs(tmpSubs)

    // Emit
    const subject = sheetSubjects.find(s => s.id === tmpSubjectId) ?? subjects.find(s => s.id === tmpSubjectId)
    const chunk   = sheetChunks.find(c => c.id === tmpChunkId) ?? chunks.find(c => c.id === tmpChunkId)
    if (chunk && subject) {
      const selectedArr = [...tmpSubs]
      onChange?.({
        subject_id:   tmpSubjectId,
        chunk_id:     chunk.id,
        topic:        chunk.topic,
        subtopics:    selectedArr.length > 0 ? selectedArr : (chunk.subtopics ?? []),
        subject_name: subject.name,
        semester:     Number(tmpSemester),
        unit_number:  chunk.unit_number ?? null,
      })
    } else {
      onChange?.(null)
    }

    closeSheet()
  }

  function sheetBack() {
    const order = ['dept', 'semester', 'subject', 'chunk', 'subtopics']
    const idx = order.indexOf(sheetStep)
    if (idx > 0) setSheetStep(order[idx - 1])
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedChunk  = chunks.find(c => c.id === chunkId)
  const subtopics      = selectedChunk?.subtopics ?? []
  const hasSubtopics   = subtopics.length > 0
  const selCount       = selectedSubs.size
  const maxReached     = selCount >= MAX_SUBTOPICS

  // Summary text for mobile trigger button
  function buildSummary() {
    if (!deptId) return null
    const dept    = departments.find(d => d.id === deptId)
    const parts   = [dept?.name ?? 'Dept']
    if (semester)   parts.push(`Sem ${semester}`)
    const subj    = subjects.find(s => s.id === subjectId)
    if (subj)       parts.push(subj.name)
    if (selectedChunk) parts.push(selectedChunk.topic)
    return parts.join(' → ')
  }

  const summary = buildSummary()

  // Sheet summary bar (breadcrumb inside sheet)
  function buildSheetSummary() {
    const parts = []
    const dept    = departments.find(d => d.id === tmpDeptId)
    if (dept)          parts.push(dept.name)
    if (tmpSemester)   parts.push(`Sem ${tmpSemester}`)
    const subj = (sheetSubjects.find(s => s.id === tmpSubjectId) ?? subjects.find(s => s.id === tmpSubjectId))
    if (subj)          parts.push(subj.name)
    const chnk = (sheetChunks.find(c => c.id === tmpChunkId) ?? chunks.find(c => c.id === tmpChunkId))
    if (chnk)          parts.push(chnk.topic)
    return parts.join(' → ')
  }

  const sheetSummary = buildSheetSummary()

  const sheetChunkForSubs = sheetChunks.find(c => c.id === tmpChunkId) ?? chunks.find(c => c.id === tmpChunkId)
  const sheetSubtopics    = sheetChunkForSubs?.subtopics ?? []
  const tmpSubsMaxReached = tmpSubs.size >= MAX_SUBTOPICS

  if (error) return <p className="text-error text-sm">{error}</p>

  return (
    <>
      {/* ── Desktop layout (md and up) ─────────────────────────────────────── */}
      <div className="hidden md:block space-y-4">

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

        {/* Step 5: Subtopics */}
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

            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border bg-surface">
              {subtopics.map((st, i) => {
                const checked  = selectedSubs.has(st)
                const disabled = maxReached && !checked
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

      {/* ── Mobile layout (below md) ───────────────────────────────────────── */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={openSheet}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-bg text-sm text-text min-h-[44px] hover:border-teal transition-colors"
        >
          {summary ? (
            <span className="text-left text-xs text-text leading-snug line-clamp-2">{summary}</span>
          ) : (
            <span className="text-muted">Select Topic</span>
          )}
          <svg className="w-4 h-4 text-muted shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {summary && (
          <p className="text-xs text-teal mt-1.5 px-1">Topic selected. Tap to change.</p>
        )}
      </div>

      {/* ── Bottom Sheet ──────────────────────────────────────────────────────── */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeSheet}
          />

          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 md:hidden h-[85vh] bg-surface rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ease-out">

            {/* Sheet header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                {sheetStep !== 'dept' && (
                  <button
                    type="button"
                    onClick={sheetBack}
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted hover:text-text hover:border-text transition-colors"
                    aria-label="Go back"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}
                <div>
                  <p className="text-xs font-semibold text-text">
                    {sheetStep === 'dept'      && 'Select Department'}
                    {sheetStep === 'semester'  && 'Select Semester'}
                    {sheetStep === 'subject'   && 'Select Subject'}
                    {sheetStep === 'chunk'     && 'Select Topic / Unit'}
                    {sheetStep === 'subtopics' && 'Select Subtopics'}
                  </p>
                  {sheetSummary && (
                    <p className="text-xs text-muted mt-0.5 line-clamp-1">{sheetSummary}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted hover:text-text transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sheet body — scrollable list */}
            <div className="flex-1 overflow-y-auto">

              {/* STEP: Department */}
              {sheetStep === 'dept' && (
                loadingDepts ? (
                  <div className="px-4 py-6 text-sm text-muted animate-pulse">Loading departments…</div>
                ) : (
                  <ul className="divide-y divide-border">
                    {departments.map(d => (
                      <li key={d.id}>
                        <button
                          type="button"
                          onClick={() => sheetSelectDept(d.id)}
                          className={`w-full flex items-center justify-between px-4 min-h-[48px] py-3 text-left text-sm transition-colors ${
                            tmpDeptId === d.id ? 'bg-teal-light text-teal font-medium' : 'text-text hover:bg-bg'
                          }`}
                        >
                          {d.name}
                          {tmpDeptId === d.id && (
                            <svg className="w-4 h-4 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {/* STEP: Semester */}
              {sheetStep === 'semester' && (
                <ul className="divide-y divide-border">
                  {SEMESTERS.map(s => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => sheetSelectSemester(s)}
                        className={`w-full flex items-center justify-between px-4 min-h-[48px] py-3 text-left text-sm transition-colors ${
                          tmpSemester === String(s) ? 'bg-teal-light text-teal font-medium' : 'text-text hover:bg-bg'
                        }`}
                      >
                        Semester {s}
                        {tmpSemester === String(s) && (
                          <svg className="w-4 h-4 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* STEP: Subject */}
              {sheetStep === 'subject' && (
                loadingSheetSubs ? (
                  <div className="px-4 py-6 text-sm text-muted animate-pulse">Loading subjects…</div>
                ) : sheetSubjects.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-muted">No subjects found for this department and semester.</div>
                ) : (
                  <ul className="divide-y divide-border">
                    {/* Favourited first */}
                    {sheetSubjects.filter(s => favSubjects.has(s.id)).map(s => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => sheetSelectSubject(s.id)}
                          className={`w-full flex items-center justify-between px-4 min-h-[48px] py-3 text-left text-sm transition-colors ${
                            tmpSubjectId === s.id ? 'bg-teal-light text-teal font-medium' : 'text-text hover:bg-bg'
                          }`}
                        >
                          <span>★ {s.name} <span className="text-muted text-xs">({s.code})</span></span>
                          {tmpSubjectId === s.id && (
                            <svg className="w-4 h-4 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      </li>
                    ))}
                    {sheetSubjects.filter(s => !favSubjects.has(s.id)).map(s => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => sheetSelectSubject(s.id)}
                          className={`w-full flex items-center justify-between px-4 min-h-[48px] py-3 text-left text-sm transition-colors ${
                            tmpSubjectId === s.id ? 'bg-teal-light text-teal font-medium' : 'text-text hover:bg-bg'
                          }`}
                        >
                          <span>{s.name} <span className="text-muted text-xs">({s.code})</span></span>
                          {tmpSubjectId === s.id && (
                            <svg className="w-4 h-4 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {/* STEP: Chunk / Topic */}
              {sheetStep === 'chunk' && (
                loadingSheetChunks ? (
                  <div className="px-4 py-6 text-sm text-muted animate-pulse">Loading topics…</div>
                ) : sheetChunks.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-muted">No topics available — syllabus not yet uploaded for this subject.</div>
                ) : (
                  <ul className="divide-y divide-border">
                    {sheetChunks.map(c => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => sheetSelectChunk(c.id)}
                          className={`w-full flex items-center justify-between px-4 min-h-[48px] py-3 text-left text-sm transition-colors ${
                            tmpChunkId === c.id ? 'bg-teal-light text-teal font-medium' : 'text-text hover:bg-bg'
                          }`}
                        >
                          <span>{c.unit_number ? `Unit ${c.unit_number}: ` : ''}{c.topic}</span>
                          {tmpChunkId === c.id && (
                            <svg className="w-4 h-4 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              )}

              {/* STEP: Subtopics */}
              {sheetStep === 'subtopics' && (
                sheetSubtopics.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-muted">No subtopics for this unit. Tap Confirm to use the full unit.</div>
                ) : (
                  <>
                    <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-bg">
                      <span className="text-xs text-muted">Select up to {MAX_SUBTOPICS} subtopics</span>
                      {tmpSubs.size > 0 && (
                        <button
                          type="button"
                          onClick={() => setTmpSubs(new Set())}
                          className="text-xs text-muted hover:text-text transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <ul className="divide-y divide-border">
                      {sheetSubtopics.map((st, i) => {
                        const checked  = tmpSubs.has(st)
                        const disabled = tmpSubsMaxReached && !checked
                        return (
                          <li key={i}>
                            <label
                              className={`flex items-center gap-3 px-4 min-h-[48px] py-3 transition-colors ${
                                checked  ? 'bg-teal-light cursor-pointer' :
                                disabled ? 'opacity-40 cursor-not-allowed bg-bg' :
                                'hover:bg-bg cursor-pointer'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={disabled}
                                onChange={() => !disabled && sheetToggleSub(st, sheetSubtopics)}
                                className="w-5 h-5 rounded accent-teal shrink-0"
                              />
                              <span className={`text-sm leading-snug ${checked ? 'text-teal font-medium' : 'text-text'}`}>
                                {st}
                              </span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                    {tmpSubs.size === 0 && (
                      <div className="px-4 py-3 text-xs text-muted">
                        No subtopics selected — AI will cover all {sheetSubtopics.length} subtopics.
                      </div>
                    )}
                  </>
                )
              )}
            </div>

            {/* Sheet footer — Confirm button (shown when a chunk is selected) */}
            {(sheetStep === 'subtopics' || (sheetStep === 'chunk' && tmpChunkId)) && (
              <div className="px-4 py-4 border-t border-border bg-surface shrink-0">
                <button
                  type="button"
                  onClick={sheetConfirm}
                  disabled={!tmpChunkId}
                  className="w-full py-3 rounded-xl bg-teal text-white text-sm font-semibold min-h-[48px] hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Confirm Selection
                  {tmpSubs.size > 0 && ` (${tmpSubs.size} subtopic${tmpSubs.size !== 1 ? 's' : ''})`}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
