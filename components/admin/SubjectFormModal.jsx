'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

const SEMESTERS = [1, 2, 3, 4, 5, 6]

export function SubjectFormModal({ open, onClose, onSaved, subject, colleges }) {
  const isEdit = !!subject

  const [collegeId, setCollegeId]     = useState('')
  const [deptId, setDeptId]           = useState('')
  const [name, setName]               = useState('')
  const [code, setCode]               = useState('')
  const [semester, setSemester]       = useState('')
  const [departments, setDepartments] = useState([])
  const [loadingDepts, setLoadingDepts] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  // Populate form when editing
  useEffect(() => {
    if (!open) return
    if (isEdit) {
      setCollegeId(subject.college_id ?? '')
      setDeptId(subject.department_id ?? '')
      setName(subject.name ?? '')
      setCode(subject.code ?? '')
      setSemester(String(subject.semester ?? ''))
    } else {
      setCollegeId('')
      setDeptId('')
      setName('')
      setCode('')
      setSemester('')
      setDepartments([])
    }
    setError('')
  }, [open, subject, isEdit])

  // Fetch departments when college changes
  useEffect(() => {
    if (!collegeId) {
      setDepartments([])
      setDeptId('')
      return
    }
    let cancelled = false
    setLoadingDepts(true)
    fetch(`/api/super-admin/departments?college_id=${collegeId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setDepartments(json.departments ?? [])
          // Reset dept selection if editing and college changed, or if not already set
          if (!isEdit || subject?.college_id !== collegeId) setDeptId('')
        }
      })
      .catch(() => { if (!cancelled) setDepartments([]) })
      .finally(() => { if (!cancelled) setLoadingDepts(false) })
    return () => { cancelled = true }
  }, [collegeId, isEdit, subject?.college_id])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!collegeId)        { setError('Please select a college.'); return }
    if (!deptId)           { setError('Please select a department.'); return }
    if (!name.trim())      { setError('Subject name is required.'); return }
    if (!semester)         { setError('Please select a semester.'); return }

    setSaving(true)
    try {
      const url    = isEdit ? `/api/super-admin/subjects/${subject.id}` : '/api/super-admin/subjects'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          college_id:    collegeId,
          department_id: deptId,
          name:          name.trim(),
          code:          code.trim(),
          semester:      Number(semester),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.fieldErrors
          ? Object.values(json.error.fieldErrors).flat().join(', ')
          : (json.error ?? 'Something went wrong.'))
        return
      }
      onSaved()
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-lg mx-4 z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <h2 className="font-heading text-lg font-bold text-navy">
            {isEdit ? 'Edit Subject' : 'Add Subject'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors ml-4 mt-0.5 shrink-0"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* College */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">College</label>
            <select
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:ring-2 focus:ring-teal/40"
              required
            >
              <option value="">Select college…</option>
              {(colleges ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">Department</label>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:ring-2 focus:ring-teal/40 disabled:opacity-50"
              disabled={!collegeId || loadingDepts}
              required
            >
              <option value="">
                {loadingDepts ? 'Loading…' : !collegeId ? 'Select college first' : 'Select department…'}
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}{d.code ? ` (${d.code})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Subject Name */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">Subject Name <span className="text-error">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Digital Electronics"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:ring-2 focus:ring-teal/40"
              required
            />
          </div>

          {/* Subject Code */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Subject Code <span className="text-muted text-xs">(optional)</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. CS-301"
              maxLength={20}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:ring-2 focus:ring-teal/40"
            />
          </div>

          {/* Semester */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:ring-2 focus:ring-teal/40"
              required
            >
              <option value="">Select semester…</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? 'Save Changes' : 'Add Subject'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
