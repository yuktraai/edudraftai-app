'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ── Helpers ────────────────────────────────────────────────────────────────────

const selectCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed'

/**
 * Derive unique departments from a flat subject list.
 * Accepts subjects with { department_id, dept_name } fields.
 * Returns [{ id, name }] sorted by name.
 */
function deriveDeptsFromSubjects(subjects) {
  const map = {}
  for (const s of subjects) {
    const deptId = s.department_id
    const deptName = s.dept_name
    if (deptId && deptName && deptName !== '—' && !map[deptId]) {
      map[deptId] = { id: deptId, name: deptName }
    }
  }
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
}

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  const steps = ['Source', 'Targets', 'Confirm', 'Final check']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1
        const isActive = current === num
        const isDone = current > num
        return (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${isDone ? 'bg-teal text-white' : isActive ? 'bg-navy text-white' : 'bg-border text-muted'}`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : num}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap ${isActive ? 'text-navy font-semibold' : 'text-muted'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-12 mx-1 mb-4 transition-colors ${isDone ? 'bg-teal' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── College + Subject cascade (shared between source and target panels) ─────────

function CollegeSubjectCascade({
  colleges,
  loadingColleges,
  selectedCollegeId,
  onCollegeChange,
  subjects,
  loadingSubjects,
  selectedDeptId,
  onDeptChange,
  children, // renders below dept, receives filtered subjects
}) {
  const depts = deriveDeptsFromSubjects(subjects)
  const filteredSubjects = selectedDeptId
    ? subjects.filter((s) => s.department_id === selectedDeptId)
    : subjects

  return (
    <div className="space-y-4">
      {/* College */}
      <div>
        <label className="block text-xs font-medium text-muted mb-1">College</label>
        {loadingColleges ? (
          <div className="px-3 py-2 text-sm text-muted animate-pulse">Loading colleges…</div>
        ) : (
          <select value={selectedCollegeId} onChange={(e) => onCollegeChange(e.target.value)} className={selectCls}>
            <option value="">Choose a college…</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Department */}
      <div>
        <label className="block text-xs font-medium text-muted mb-1">Department</label>
        {loadingSubjects ? (
          <div className="px-3 py-2 text-sm text-muted animate-pulse">Loading departments…</div>
        ) : (
          <select
            value={selectedDeptId}
            onChange={(e) => onDeptChange(e.target.value)}
            disabled={!selectedCollegeId || depts.length === 0}
            className={selectCls}
          >
            <option value="">All departments</option>
            {depts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
        {selectedCollegeId && !loadingSubjects && depts.length === 0 && (
          <p className="text-xs text-muted mt-1">No departments found for this college.</p>
        )}
      </div>

      {children && children(filteredSubjects)}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CopySyllabusPage() {
  const [step, setStep] = useState(1)

  // Shared college list (fetched once)
  const [colleges, setColleges] = useState([])
  const [loadingColleges, setLoadingColleges] = useState(true)

  // ── Step 1: Source ─────────────────────────────────────────────────────────
  const [srcCollegeId, setSrcCollegeId] = useState('')
  const [srcSubjects, setSrcSubjects] = useState([])     // raw from API (includes dept info)
  const [loadingSrcSubjects, setLoadingSrcSubjects] = useState(false)
  const [srcDeptId, setSrcDeptId] = useState('')
  const [selectedSourceId, setSelectedSourceId] = useState('')  // single subject_id

  // ── Step 2: Targets ────────────────────────────────────────────────────────
  const [tgtCollegeId, setTgtCollegeId] = useState('')
  const [tgtSubjects, setTgtSubjects] = useState([])
  const [loadingTgtSubjects, setLoadingTgtSubjects] = useState(false)
  const [tgtDeptId, setTgtDeptId] = useState('')
  const [selectedTargetIds, setSelectedTargetIds] = useState(new Set())  // Set of subject_ids

  // ── Steps 3 & 4: Summary + result ─────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)   // { data } or { error }

  // ── Fetch colleges on mount ────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/super-admin/colleges-list')
      .then((r) => r.json())
      .then(({ data }) => { setColleges(data ?? []); setLoadingColleges(false) })
      .catch(() => setLoadingColleges(false))
  }, [])

  // ── Fetch subjects when source college changes ─────────────────────────────
  useEffect(() => {
    if (!srcCollegeId) { setSrcSubjects([]); setSrcDeptId(''); setSelectedSourceId(''); return }
    setLoadingSrcSubjects(true)
    setSrcDeptId('')
    setSelectedSourceId('')
    fetch(`/api/super-admin/subjects?college_id=${srcCollegeId}`)
      .then((r) => r.json())
      .then(({ subjects }) => {
        setSrcSubjects(rawToFlat(subjects ?? []))
        setLoadingSrcSubjects(false)
      })
      .catch(() => setLoadingSrcSubjects(false))
  }, [srcCollegeId])

  // ── Fetch subjects when target college changes ─────────────────────────────
  useEffect(() => {
    if (!tgtCollegeId) { setTgtSubjects([]); setTgtDeptId(''); setSelectedTargetIds(new Set()); return }
    setLoadingTgtSubjects(true)
    setTgtDeptId('')
    setSelectedTargetIds(new Set())
    fetch(`/api/super-admin/subjects?college_id=${tgtCollegeId}`)
      .then((r) => r.json())
      .then(({ subjects }) => {
        setTgtSubjects(rawToFlat(subjects ?? []))
        setLoadingTgtSubjects(false)
      })
      .catch(() => setLoadingTgtSubjects(false))
  }, [tgtCollegeId])

  // Convert raw API subject rows (from the `subjects` key) to the flat shape
  // used by CollegeSubjectCascade. Raw rows have real department_id UUIDs and
  // a joined departments.name field — no synthetic keys needed.
  function rawToFlat(rawRows) {
    return rawRows.map((s) => ({
      id:            s.id,
      name:          s.name,
      code:          s.code ?? '',
      semester:      s.semester,
      department_id: s.department_id ?? '',
      dept_name:     s.departments?.name ?? '',
    }))
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const sourceSubject = srcSubjects.find((s) => s.id === selectedSourceId)

  function toggleTarget(subjectId) {
    setSelectedTargetIds((prev) => {
      const next = new Set(prev)
      if (next.has(subjectId)) next.delete(subjectId)
      else next.add(subjectId)
      return next
    })
  }

  function removeTarget(subjectId) {
    setSelectedTargetIds((prev) => {
      const next = new Set(prev)
      next.delete(subjectId)
      return next
    })
  }

  // Build detailed target list from all fetched subjects matching selected IDs
  const targetSubjectDetails = [...selectedTargetIds].map((id) => {
    const s = tgtSubjects.find((t) => t.id === id)
    return s ?? { id, name: id, dept_name: '—', college_id: tgtCollegeId }
  })

  const targetCollegeName = colleges.find((c) => c.id === tgtCollegeId)?.name ?? tgtCollegeId
  const sourceCollegeName = colleges.find((c) => c.id === srcCollegeId)?.name ?? srcCollegeId

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleConfirm() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/super-admin/syllabus/copy', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          source_subject_id:  selectedSourceId,
          target_subject_ids: [...selectedTargetIds],
        }),
      })
      const json = await res.json()
      setResult(json)
    } catch (err) {
      setResult({ error: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  function handleCopyAnother() {
    setSrcCollegeId('')
    setSrcSubjects([])
    setSrcDeptId('')
    setSelectedSourceId('')
    setTgtCollegeId('')
    setTgtSubjects([])
    setTgtDeptId('')
    setSelectedTargetIds(new Set())
    setResult(null)
    setStep(1)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-3xl">
      {/* Back link */}
      <Link
        href="/super-admin/syllabus"
        className="text-sm text-muted hover:text-text transition-colors mb-4 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Syllabus Manager
      </Link>

      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-navy">Copy Syllabus</h1>
        <p className="text-muted text-sm mt-1">
          Copy all parsed chunks from one subject to one or more target subjects.
          Existing chunks in the targets will be replaced.
        </p>
      </div>

      <StepIndicator current={result ? 5 : step} />

      {/* ── Result screen ─────────────────────────────────────────────────── */}
      {result && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          {result.error ? (
            <div className="flex items-start gap-3 bg-red-50 border border-error rounded-lg p-4">
              <svg className="w-5 h-5 text-error shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-error">Copy failed</p>
                <p className="text-xs text-error mt-1">{result.error}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-teal-light border border-teal rounded-lg p-4">
                <svg className="w-5 h-5 text-teal shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-navy">Copy complete</p>
                  <p className="text-xs text-navy mt-1">
                    {result.data.chunks_in_source} chunk{result.data.chunks_in_source !== 1 ? 's' : ''} copied
                    from <span className="font-medium">{result.data.source_subject_name}</span> to{' '}
                    {result.data.targets_updated} subject{result.data.targets_updated !== 1 ? 's' : ''}.
                  </p>
                </div>
              </div>

              {/* Per-target breakdown */}
              <div className="space-y-2">
                {(result.data.targets ?? []).map((t) => (
                  <div
                    key={t.subject_id}
                    className={`flex items-center justify-between px-4 py-2 rounded-lg border text-sm
                      ${t.error ? 'border-error bg-red-50' : 'border-border bg-bg'}`}
                  >
                    <span className="text-text font-medium">{t.name ?? t.subject_id}</span>
                    {t.error
                      ? <span className="text-xs text-error">{t.error}</span>
                      : <span className="text-xs text-muted">{t.chunks_copied} chunk{t.chunks_copied !== 1 ? 's' : ''} written</span>
                    }
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Link href="/super-admin/syllabus">
                  <button className="px-4 py-2 rounded-lg border border-border text-sm text-text hover:bg-bg transition-colors">
                    View Syllabus Manager
                  </button>
                </Link>
                <button
                  onClick={handleCopyAnother}
                  className="px-4 py-2 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy-2 transition-colors"
                >
                  Copy Another
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 1: Source selection ──────────────────────────────────────── */}
      {!result && step === 1 && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center font-bold">1</span>
            <h2 className="text-sm font-semibold text-text">Select Source Subject</h2>
          </div>

          <CollegeSubjectCascade
            colleges={colleges}
            loadingColleges={loadingColleges}
            selectedCollegeId={srcCollegeId}
            onCollegeChange={(id) => setSrcCollegeId(id)}
            subjects={srcSubjects}
            loadingSubjects={loadingSrcSubjects}
            selectedDeptId={srcDeptId}
            onDeptChange={(id) => { setSrcDeptId(id); setSelectedSourceId('') }}
          >
            {(filteredSubjects) => (
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Subject</label>
                {loadingSrcSubjects ? (
                  <div className="px-3 py-2 text-sm text-muted animate-pulse">Loading subjects…</div>
                ) : (
                  <select
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                    disabled={!srcCollegeId || filteredSubjects.length === 0}
                    className={selectCls}
                  >
                    <option value="">Choose a subject…</option>
                    {filteredSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        Sem {s.semester} — {s.name} ({s.code}){s.dept_name && s.dept_name !== '—' ? ` · ${s.dept_name}` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {srcCollegeId && !loadingSrcSubjects && filteredSubjects.length === 0 && (
                  <p className="text-xs text-muted mt-1">No subjects found.</p>
                )}
              </div>
            )}
          </CollegeSubjectCascade>

          {/* Selected source preview */}
          {sourceSubject && (
            <div className="flex items-start gap-2 bg-teal-light border border-teal rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-teal mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs text-navy">
                Source: <span className="font-semibold">{sourceSubject.name}</span>
                {sourceSubject.dept_name && sourceSubject.dept_name !== '—' && (
                  <> · {sourceSubject.dept_name}</>
                )}
                {' '}· {sourceCollegeName}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              disabled={!selectedSourceId}
              onClick={() => setStep(2)}
              className="px-5 py-2 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Select Targets
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Target selection ──────────────────────────────────────── */}
      {!result && step === 2 && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center font-bold">2</span>
            <h2 className="text-sm font-semibold text-text">Select Target Subject(s)</h2>
          </div>

          <p className="text-xs text-muted">
            Choose one or more subjects that will receive the syllabus from{' '}
            <span className="font-medium text-navy">{sourceSubject?.name}</span>.
          </p>

          <CollegeSubjectCascade
            colleges={colleges}
            loadingColleges={loadingColleges}
            selectedCollegeId={tgtCollegeId}
            onCollegeChange={(id) => setTgtCollegeId(id)}
            subjects={tgtSubjects}
            loadingSubjects={loadingTgtSubjects}
            selectedDeptId={tgtDeptId}
            onDeptChange={(id) => setTgtDeptId(id)}
          >
            {(filteredSubjects) => {
              // Exclude the source subject from targets
              const available = filteredSubjects.filter((s) => s.id !== selectedSourceId)
              return (
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Subjects <span className="text-muted">(check all that apply)</span>
                  </label>
                  {loadingTgtSubjects ? (
                    <div className="px-3 py-2 text-sm text-muted animate-pulse">Loading subjects…</div>
                  ) : available.length > 0 ? (
                    <div className="border border-border rounded-lg divide-y divide-border max-h-60 overflow-y-auto">
                      {available.map((s) => (
                        <label
                          key={s.id}
                          className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-bg transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTargetIds.has(s.id)}
                            onChange={() => toggleTarget(s.id)}
                            className="w-4 h-4 accent-teal"
                          />
                          <span className="text-sm text-text">
                            Sem {s.semester} — {s.name}{' '}
                            <span className="text-xs text-muted">({s.code}){s.dept_name && s.dept_name !== '—' ? ` · ${s.dept_name}` : ''}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : tgtCollegeId ? (
                    <p className="text-xs text-muted mt-1">No subjects available in this department.</p>
                  ) : null}
                </div>
              )
            }}
          </CollegeSubjectCascade>

          {/* Selected targets chips */}
          {selectedTargetIds.size > 0 && (
            <div>
              <p className="text-xs font-medium text-muted mb-2">
                {selectedTargetIds.size} target{selectedTargetIds.size !== 1 ? 's' : ''} selected:
              </p>
              <div className="flex flex-wrap gap-2">
                {targetSubjectDetails.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1.5 bg-navy text-white text-xs px-2.5 py-1 rounded-full"
                  >
                    {t.name}
                    <button
                      onClick={() => removeTarget(t.id)}
                      className="text-white/70 hover:text-white transition-colors"
                      aria-label={`Remove ${t.name}`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2 rounded-lg border border-border text-sm text-text hover:bg-bg transition-colors"
            >
              Back
            </button>
            <button
              disabled={selectedTargetIds.size === 0}
              onClick={() => setStep(3)}
              className="px-5 py-2 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Review
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: First confirmation ────────────────────────────────────── */}
      {!result && step === 3 && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center font-bold">3</span>
            <h2 className="text-sm font-semibold text-text">Review Copy</h2>
          </div>

          {/* Summary card */}
          <div className="bg-bg border border-border rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Source</p>
              <p className="text-sm font-semibold text-navy">
                {sourceSubject?.name}
                {sourceSubject?.code && <span className="text-muted font-normal"> ({sourceSubject.code})</span>}
              </p>
              <p className="text-xs text-muted">
                {sourceSubject?.dept_name !== '—' ? `${sourceSubject?.dept_name} · ` : ''}
                {sourceCollegeName}
              </p>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
                {selectedTargetIds.size} Target{selectedTargetIds.size !== 1 ? 's' : ''}
              </p>
              <div className="space-y-1.5">
                {targetSubjectDetails.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <svg className="w-3.5 h-3.5 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-text font-medium">{t.name}</span>
                    {t.dept_name && t.dept_name !== '—' && (
                      <span className="text-xs text-muted">{t.dept_name}</span>
                    )}
                    <span className="text-xs text-muted">· {targetCollegeName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2 rounded-lg border border-border text-sm text-text hover:bg-bg transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-5 py-2 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy-2 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Final confirmation (destructive warning) ─────────────── */}
      {!result && step === 4 && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center font-bold">4</span>
            <h2 className="text-sm font-semibold text-text">Final Confirmation</h2>
          </div>

          {/* Red warning */}
          <div className="flex items-start gap-3 bg-red-50 border border-error rounded-lg p-4">
            <svg className="w-5 h-5 text-error shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-error">
                This will REPLACE existing syllabus data in all target subjects.
              </p>
              <p className="text-xs text-error mt-1">
                All current chunks in the {selectedTargetIds.size} target subject{selectedTargetIds.size !== 1 ? 's' : ''} will be deleted and replaced with
                chunks from <span className="font-semibold">{sourceSubject?.name}</span>. This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Target list with context */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Subjects that will be overwritten:</p>
            {targetSubjectDetails.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm px-3 py-2 bg-bg border border-border rounded-lg">
                <svg className="w-4 h-4 text-error shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-text font-medium">{t.name}</span>
                {t.dept_name && t.dept_name !== '—' && (
                  <span className="text-xs text-muted">· {t.dept_name}</span>
                )}
                <span className="text-xs text-muted">· {targetCollegeName}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <button
              disabled={submitting}
              onClick={() => setStep(3)}
              className="px-5 py-2 rounded-lg border border-border text-sm text-text hover:bg-bg transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              disabled={submitting}
              onClick={handleConfirm}
              className="px-5 py-2 rounded-lg bg-error text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Copying…
                </>
              ) : (
                'Yes, copy syllabus'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
