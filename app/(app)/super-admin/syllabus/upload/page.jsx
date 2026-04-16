'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SyllabusUploader } from '@/components/syllabus/SyllabusUploader'

export default function SuperAdminSyllabusUploadPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const preselectedSubjectId = searchParams.get('subject_id')

  const [colleges, setColleges]           = useState([])
  const [subjects, setSubjects]           = useState([])   // deduplicated list
  const [selectedCollegeId, setSelectedCollegeId] = useState('')
  // selectedSubject = the full deduplicated entry { id, name, code, semester, subject_ids[], dept_names[] }
  const [selectedSubject, setSelectedSubject]     = useState(null)
  const [loadingColleges, setLoadingColleges]     = useState(true)
  const [loadingSubjects, setLoadingSubjects]     = useState(false)

  // Fetch all colleges on mount via API (avoids browser-client RLS issues)
  useEffect(() => {
    fetch('/api/colleges')
      .then((r) => r.json())
      .then(({ data }) => {
        setColleges(data ?? [])
        setLoadingColleges(false)
      })
      .catch(() => setLoadingColleges(false))
  }, [])

  // If preselected subject_id, resolve its college via server API
  useEffect(() => {
    if (!preselectedSubjectId || colleges.length === 0) return
    async function fetchSubjectCollege() {
      const res = await fetch(`/api/super-admin/subject-by-id?id=${preselectedSubjectId}`)
      if (!res.ok) return
      const { data } = await res.json()
      if (data) {
        setSelectedCollegeId(data.college_id)
        // Wrap in a deduplicated-style object for consistency
        setSelectedSubject({
          id:          data.id,
          name:        data.name,
          code:        data.code,
          semester:    data.semester,
          subject_ids: [data.id],
          dept_names:  [],
        })
      }
    }
    fetchSubjectCollege()
  }, [preselectedSubjectId, colleges])

  // Fetch deduplicated subjects when college changes
  useEffect(() => {
    if (!selectedCollegeId) { setSubjects([]); setSelectedSubject(null); return }
    setLoadingSubjects(true)
    fetch(`/api/super-admin/subjects?college_id=${selectedCollegeId}`)
      .then((r) => r.json())
      .then(({ data }) => {
        setSubjects(data ?? [])
        setLoadingSubjects(false)
      })
      .catch(() => setLoadingSubjects(false))
  }, [selectedCollegeId])

  function handleCollegeChange(e) {
    setSelectedCollegeId(e.target.value)
    setSelectedSubject(null)
  }

  function handleSubjectChange(e) {
    const key = e.target.value
    if (!key) { setSelectedSubject(null); return }
    // subjects are keyed by "name||code||semester" in the option value
    const found = subjects.find((s) => `${s.name}||${s.code}||${s.semester}` === key)
    setSelectedSubject(found ?? null)
  }

  const selectCls =
    'w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

  const selectedKey = selectedSubject
    ? `${selectedSubject.name}||${selectedSubject.code}||${selectedSubject.semester}`
    : ''

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted hover:text-text transition-colors mb-4 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="font-heading text-2xl font-bold text-navy">Upload Syllabus PDF</h1>
        <p className="text-muted text-sm mt-1">Select a college, choose a subject, then upload the PDF.</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
        {/* Step 1: Select College */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center font-bold">1</span>
            <label className="text-sm font-medium text-text">Select College</label>
          </div>
          {loadingColleges ? (
            <div className="px-3 py-2 text-sm text-muted animate-pulse">Loading colleges…</div>
          ) : (
            <select value={selectedCollegeId} onChange={handleCollegeChange} className={selectCls}>
              <option value="">Choose a college…</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Step 2: Select Subject */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${selectedCollegeId ? 'bg-navy text-white' : 'bg-border text-muted'}`}>2</span>
            <label className={`text-sm font-medium ${selectedCollegeId ? 'text-text' : 'text-muted'}`}>Select Subject</label>
          </div>
          {loadingSubjects ? (
            <div className="px-3 py-2 text-sm text-muted animate-pulse">Loading subjects…</div>
          ) : (
            <select
              value={selectedKey}
              onChange={handleSubjectChange}
              disabled={!selectedCollegeId}
              className={`${selectCls} ${!selectedCollegeId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">Choose a subject…</option>
              {subjects.map((s) => {
                const key = `${s.name}||${s.code}||${s.semester}`
                return (
                  <option key={key} value={key}>
                    Sem {s.semester} — {s.name} ({s.code})
                    {s.subject_ids.length > 1 ? ` · ${s.subject_ids.length} depts` : ''}
                  </option>
                )
              })}
            </select>
          )}
          {selectedCollegeId && !loadingSubjects && subjects.length === 0 && (
            <p className="text-xs text-muted">No active subjects found for this college.</p>
          )}
          {/* Show which departments will receive the upload */}
          {selectedSubject && selectedSubject.subject_ids.length > 1 && (
            <div className="flex items-start gap-2 bg-teal-light border border-teal rounded-lg px-3 py-2">
              <svg className="w-4 h-4 text-teal mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-navy">
                This PDF will be applied to <span className="font-semibold">{selectedSubject.subject_ids.length} departments</span>
                {selectedSubject.dept_names.length > 0 && (
                  <> ({selectedSubject.dept_names.join(', ')})</>
                )}.
              </p>
            </div>
          )}
        </div>

        {/* Step 3: Upload PDF */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${selectedSubject ? 'bg-navy text-white' : 'bg-border text-muted'}`}>3</span>
            <label className={`text-sm font-medium ${selectedSubject ? 'text-text' : 'text-muted'}`}>Upload PDF</label>
          </div>
          {selectedSubject ? (
            <SyllabusUploader
              subjectIds={selectedSubject.subject_ids}
              onSuccess={() => router.push('/super-admin/syllabus')}
            />
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg px-6 py-8 text-center">
              <p className="text-sm text-muted">Select a college and subject first</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
