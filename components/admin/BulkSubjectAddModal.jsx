'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

const SEMESTERS = [1, 2, 3, 4, 5, 6]

const inputCls =
  'w-full px-2.5 py-2 rounded-lg border border-border bg-bg text-text text-sm ' +
  'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

function emptyRow() {
  return { name: '', code: '', semester: '', has_math: false }
}

export function BulkSubjectAddModal({ open, onClose, onSaved, colleges }) {
  const [collegeId, setCollegeId]     = useState('')
  const [deptId, setDeptId]           = useState('')
  const [departments, setDepartments] = useState([])
  const [loadingDepts, setLoadingDepts] = useState(false)
  const [rows, setRows]               = useState([emptyRow()])
  const [saving, setSaving]           = useState(false)
  const [results, setResults]         = useState([])   // { name, ok, error }
  const [globalError, setGlobalError] = useState(null)

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setCollegeId('')
      setDeptId('')
      setDepartments([])
      setRows([emptyRow()])
      setResults([])
      setGlobalError(null)
    }
  }, [open])

  // Fetch departments when college changes
  useEffect(() => {
    if (!collegeId) { setDepartments([]); setDeptId(''); return }
    let cancelled = false
    setLoadingDepts(true)
    fetch(`/api/super-admin/departments?college_id=${collegeId}`)
      .then((r) => r.json())
      .then((json) => { if (!cancelled) { setDepartments(json.departments ?? []); setDeptId('') } })
      .catch(() => { if (!cancelled) setDepartments([]) })
      .finally(() => { if (!cancelled) setLoadingDepts(false) })
    return () => { cancelled = true }
  }, [collegeId])

  function addRow()         { setRows((r) => [...r, emptyRow()]) }
  function removeRow(i)     { setRows((r) => r.filter((_, idx) => idx !== i)) }
  function updateRow(i, field, value) {
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  const validRows = rows.filter((r) => r.name.trim() && r.semester)

  async function handleSave() {
    if (!collegeId)            { setGlobalError('Please select a college.'); return }
    if (!deptId)               { setGlobalError('Please select a department.'); return }
    if (validRows.length === 0){ setGlobalError('Add at least one subject with a name and semester.'); return }
    setSaving(true)
    setResults([])
    setGlobalError(null)

    const settled = await Promise.allSettled(
      validRows.map(async (row) => {
        const res  = await fetch('/api/super-admin/subjects', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            college_id:    collegeId,
            department_id: deptId,
            name:          row.name.trim(),
            code:          row.code.trim().toUpperCase(),
            semester:      Number(row.semester),
            has_math:      row.has_math,
          }),
        })
        const json = await res.json()
        return {
          name:  row.name.trim(),
          ok:    res.ok,
          error: typeof json.error === 'string' ? json.error : (res.ok ? null : 'Failed to save'),
        }
      })
    )

    const mapped = settled.map((r) =>
      r.status === 'fulfilled' ? r.value : { name: '?', ok: false, error: 'Network error' }
    )
    setSaving(false)
    setResults(mapped)
    onSaved()  // refresh table for partial saves

    if (mapped.every((r) => r.ok)) onClose()
  }

  const hasResults = results.length > 0
  const allOk      = hasResults && results.every((r) => r.ok)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-heading text-lg font-bold text-navy">Add Subjects</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors p-1 rounded-lg hover:bg-bg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* College + Dept pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-text">College *</label>
              <select
                value={collegeId}
                onChange={(e) => setCollegeId(e.target.value)}
                className={inputCls}
                disabled={saving}
              >
                <option value="">Select a college</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-text">Department *</label>
              <select
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                className={`${inputCls} disabled:opacity-50`}
                disabled={!collegeId || loadingDepts || saving}
              >
                <option value="">
                  {!collegeId ? 'Select a college first' : loadingDepts ? 'Loading…' : 'Select a department'}
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject rows */}
          <div className="space-y-2">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_120px_110px_90px_32px] gap-2 text-xs font-medium text-muted px-1">
              <span>Subject Name *</span>
              <span>Code</span>
              <span>Semester *</span>
              <span>Has Math</span>
              <span />
            </div>

            {rows.map((row, i) => {
              const result = hasResults ? results[i] : null
              const rowErr  = result && !result.ok
              const rowOk   = result && result.ok
              return (
                <div key={i} className="space-y-1">
                  <div className="grid grid-cols-[1fr_120px_110px_90px_32px] gap-2 items-center">
                    {/* Name */}
                    <input
                      value={row.name}
                      onChange={(e) => updateRow(i, 'name', e.target.value)}
                      placeholder="e.g. Applied Mathematics"
                      className={`${inputCls} ${rowErr ? 'border-error' : rowOk ? 'border-success' : ''}`}
                      disabled={saving}
                    />
                    {/* Code */}
                    <input
                      value={row.code}
                      onChange={(e) => updateRow(i, 'code', e.target.value.toUpperCase())}
                      placeholder="e.g. AM-101"
                      maxLength={20}
                      className={`${inputCls} uppercase font-mono ${rowErr ? 'border-error' : rowOk ? 'border-success' : ''}`}
                      disabled={saving}
                    />
                    {/* Semester */}
                    <select
                      value={row.semester}
                      onChange={(e) => updateRow(i, 'semester', e.target.value)}
                      className={`${inputCls} ${rowErr ? 'border-error' : rowOk ? 'border-success' : ''}`}
                      disabled={saving}
                    >
                      <option value="">Sem…</option>
                      {SEMESTERS.map((s) => (
                        <option key={s} value={s}>Sem {s}</option>
                      ))}
                    </select>
                    {/* Has Math toggle */}
                    <button
                      type="button"
                      onClick={() => updateRow(i, 'has_math', !row.has_math)}
                      disabled={saving}
                      className={`h-9 rounded-lg border text-xs font-medium transition-colors ${
                        row.has_math
                          ? 'bg-teal text-white border-teal'
                          : 'bg-bg border-border text-muted hover:border-teal hover:text-teal'
                      }`}
                    >
                      {row.has_math ? '✓ Yes' : 'No'}
                    </button>
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      disabled={rows.length === 1 || saving}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-error hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {/* Per-row error */}
                  {rowErr && (
                    <p className="text-xs text-error px-1">{result.error}</p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add row */}
          <button
            type="button"
            onClick={addRow}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm text-teal font-medium hover:underline disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add another subject
          </button>

          {/* Global error */}
          {globalError && <p className="text-error text-sm">{globalError}</p>}

          {/* All-success */}
          {allOk && (
            <p className="text-success text-sm font-medium">
              ✓ All {results.length} subject{results.length !== 1 ? 's' : ''} saved successfully.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border shrink-0">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={saving || validRows.length === 0}
            className="flex-1"
          >
            {saving
              ? 'Saving…'
              : `Save ${validRows.length > 0 ? validRows.length : ''} Subject${validRows.length !== 1 ? 's' : ''}`}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {hasResults && !allOk ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </div>
    </div>
  )
}
