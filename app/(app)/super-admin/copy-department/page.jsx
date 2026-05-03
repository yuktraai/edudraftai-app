'use client'

import { useState, useEffect } from 'react'

export default function CopyDepartmentPage() {
  const [colleges,    setColleges]    = useState([])
  const [srcDepts,    setSrcDepts]    = useState([])
  const [tgtDepts,    setTgtDepts]    = useState([])
  const [srcPreview,  setSrcPreview]  = useState(null)   // { subjectCount, deptName }

  const [srcCollege,  setSrcCollege]  = useState('')
  const [srcDept,     setSrcDept]     = useState('')
  const [tgtCollege,  setTgtCollege]  = useState('')
  const [tgtDept,     setTgtDept]     = useState('')

  const [copying,     setCopying]     = useState(false)
  const [result,      setResult]      = useState(null)   // success result
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(true)

  // Load colleges once
  useEffect(() => {
    fetch('/api/super-admin/colleges-list')
      .then(r => r.json())
      .then(j => { setColleges(j.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Load source departments when source college changes
  useEffect(() => {
    setSrcDepts([]); setSrcDept(''); setSrcPreview(null)
    if (!srcCollege) return
    fetch(`/api/super-admin/departments?college_id=${srcCollege}`)
      .then(r => r.json())
      .then(j => setSrcDepts(j.data ?? []))
      .catch(() => {})
  }, [srcCollege])

  // Load target departments when target college changes
  useEffect(() => {
    setTgtDepts([]); setTgtDept('')
    if (!tgtCollege) return
    fetch(`/api/super-admin/departments?college_id=${tgtCollege}`)
      .then(r => r.json())
      .then(j => setTgtDepts(j.data ?? []))
      .catch(() => {})
  }, [tgtCollege])

  // Preview source subject count when source dept changes
  useEffect(() => {
    setSrcPreview(null)
    if (!srcCollege || !srcDept) return
    const dept = srcDepts.find(d => d.id === srcDept)
    fetch(`/api/super-admin/subjects?college_id=${srcCollege}&department_id=${srcDept}`)
      .then(r => r.json())
      .then(j => setSrcPreview({
        deptName:     dept?.name ?? '',
        subjectCount: j.data?.length ?? 0,
      }))
      .catch(() => {})
  }, [srcCollege, srcDept, srcDepts])

  async function handleCopy() {
    setError(''); setResult(null)
    if (!srcCollege || !srcDept || !tgtCollege || !tgtDept) {
      setError('Please select all four fields.'); return
    }
    if (srcDept === tgtDept && srcCollege === tgtCollege) {
      setError('Source and target cannot be the same department.'); return
    }

    setCopying(true)
    try {
      const res  = await fetch('/api/super-admin/copy-department', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          src_college_id: srcCollege,
          src_dept_id:    srcDept,
          tgt_college_id: tgtCollege,
          tgt_dept_id:    tgtDept,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Copy failed. Please try again.'); return }
      setResult(json)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setCopying(false)
    }
  }

  const selectCls = 'w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors disabled:opacity-50'

  const srcCollegeName = colleges.find(c => c.id === srcCollege)?.name ?? ''
  const tgtCollegeName = colleges.find(c => c.id === tgtCollege)?.name ?? ''
  const srcDeptName    = srcDepts.find(d => d.id === srcDept)?.name ?? ''
  const tgtDeptName    = tgtDepts.find(d => d.id === tgtDept)?.name ?? ''

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy">Copy Department</h1>
        <p className="text-sm text-muted mt-1">
          Copy all subjects, semesters, and parsed syllabus from one college department to another in one click.
        </p>
      </div>

      {loading && (
        <div className="h-48 bg-border/40 rounded-2xl animate-pulse" />
      )}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Source */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-navy text-white text-xs font-bold flex items-center justify-center">S</div>
              <h2 className="text-base font-bold text-navy">Source</h2>
              <span className="text-xs text-muted">(copy FROM)</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">College</label>
                <select value={srcCollege} onChange={e => setSrcCollege(e.target.value)} className={selectCls}>
                  <option value="">Select college…</option>
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Department</label>
                <select value={srcDept} onChange={e => setSrcDept(e.target.value)}
                  disabled={!srcCollege || !srcDepts.length} className={selectCls}>
                  <option value="">{srcCollege ? (srcDepts.length ? 'Select department…' : 'No departments') : 'Select college first'}</option>
                  {srcDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            {/* Preview */}
            {srcPreview && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-bg border border-border text-sm">
                <p className="font-semibold text-navy">{srcPreview.deptName}</p>
                <p className="text-muted text-xs mt-0.5">
                  {srcPreview.subjectCount} subject{srcPreview.subjectCount !== 1 ? 's' : ''} will be copied
                </p>
              </div>
            )}
          </div>

          {/* Target */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-teal text-white text-xs font-bold flex items-center justify-center">T</div>
              <h2 className="text-base font-bold text-navy">Target</h2>
              <span className="text-xs text-muted">(copy INTO)</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">College</label>
                <select value={tgtCollege} onChange={e => setTgtCollege(e.target.value)} className={selectCls}>
                  <option value="">Select college…</option>
                  {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">Department</label>
                <select value={tgtDept} onChange={e => setTgtDept(e.target.value)}
                  disabled={!tgtCollege || !tgtDepts.length} className={selectCls}>
                  <option value="">{tgtCollege ? (tgtDepts.length ? 'Select department…' : 'No departments') : 'Select college first'}</option>
                  {tgtDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary + Copy button */}
      {(srcDept && tgtDept) && (
        <div className="mt-6 bg-surface border border-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-navy mb-3">Copy Summary</h3>
          <div className="flex items-center gap-3 flex-wrap text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg border border-border">
              <span className="text-muted text-xs">From</span>
              <span className="font-semibold text-navy">{srcCollegeName}</span>
              <span className="text-border">›</span>
              <span className="text-teal font-medium">{srcDeptName}</span>
            </div>
            <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
            </svg>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg border border-border">
              <span className="text-muted text-xs">To</span>
              <span className="font-semibold text-navy">{tgtCollegeName}</span>
              <span className="text-border">›</span>
              <span className="text-teal font-medium">{tgtDeptName}</span>
            </div>
          </div>
          <p className="text-xs text-muted mt-3">
            ⚠️ Existing subjects with the same code in the target college will be skipped. Syllabus chunks for new subjects will be copied. This action cannot be undone.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-error">{error}</div>
      )}

      {result && (
        <div className="mt-4 px-5 py-4 rounded-xl bg-teal-light border border-teal/25 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
            </svg>
            <span className="font-bold text-navy">Copy complete!</span>
          </div>
          <p className="text-navy text-xs">
            <strong>{result.subjects_copied}</strong> subject{result.subjects_copied !== 1 ? 's' : ''} and{' '}
            <strong>{result.chunks_copied}</strong> syllabus chunk{result.chunks_copied !== 1 ? 's' : ''} copied
            from <strong>{result.src_dept_name}</strong> → <strong>{result.tgt_dept_name}</strong>.
          </p>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleCopy}
          disabled={copying || !srcDept || !tgtDept}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-teal text-white font-semibold text-sm hover:bg-teal-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {copying ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
              </svg>
              Copying…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"/>
              </svg>
              Copy Department Now
            </>
          )}
        </button>
        {result && (
          <button
            onClick={() => { setResult(null); setSrcCollege(''); setSrcDept(''); setTgtCollege(''); setTgtDept('') }}
            className="px-4 py-3 rounded-xl border border-border text-sm font-medium text-muted hover:text-navy transition-colors"
          >
            Copy Another
          </button>
        )}
      </div>
    </div>
  )
}
