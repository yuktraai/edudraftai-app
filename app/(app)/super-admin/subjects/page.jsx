'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { SubjectTable } from '@/components/admin/SubjectTable'
import { SubjectFormModal } from '@/components/admin/SubjectFormModal'

export default function SuperAdminSubjectsPage() {
  const [colleges, setColleges]               = useState([])
  const [departments, setDepartments]         = useState([])
  const [subjects, setSubjects]               = useState([])
  const [filterCollegeId, setFilterCollegeId] = useState('')
  const [filterDeptId, setFilterDeptId]       = useState('')
  const [filterSemester, setFilterSemester]   = useState('')
  const [loading, setLoading]                 = useState(true)
  const [showModal, setShowModal]             = useState(false)
  const [editingSubject, setEditingSubject]   = useState(null)

  // Load colleges once on mount
  useEffect(() => {
    fetch('/api/super-admin/colleges-list')
      .then((r) => r.json())
      .then((json) => setColleges(json.data ?? []))
      .catch(() => setColleges([]))
  }, [])

  // Fetch departments when filter college changes
  useEffect(() => {
    if (!filterCollegeId) {
      setDepartments([])
      setFilterDeptId('')
      return
    }
    let cancelled = false
    fetch(`/api/super-admin/departments?college_id=${filterCollegeId}`)
      .then((r) => r.json())
      .then((json) => { if (!cancelled) setDepartments(json.departments ?? []) })
      .catch(() => { if (!cancelled) setDepartments([]) })
    return () => { cancelled = true }
  }, [filterCollegeId])

  // Fetch subjects based on current filters
  const fetchSubjects = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterCollegeId) params.set('college_id', filterCollegeId)
      if (filterDeptId)    params.set('department_id', filterDeptId)
      if (filterSemester)  params.set('semester', filterSemester)
      const res = await fetch(`/api/super-admin/subjects?${params.toString()}`)
      const json = await res.json()
      setSubjects(json.subjects ?? [])
    } catch {
      setSubjects([])
    } finally {
      setLoading(false)
    }
  }, [filterCollegeId, filterDeptId, filterSemester])

  useEffect(() => {
    fetchSubjects()
  }, [fetchSubjects])

  function handleCollegeFilterChange(e) {
    setFilterCollegeId(e.target.value)
    setFilterDeptId('')
  }

  function handleDeptFilterChange(e) {
    setFilterDeptId(e.target.value)
  }

  function handleSemesterFilterChange(e) {
    setFilterSemester(e.target.value)
  }

  function openAdd() {
    setEditingSubject(null)
    setShowModal(true)
  }

  function openEdit(subject) {
    setEditingSubject(subject)
    setShowModal(true)
  }

  async function handleDelete(id) {
    try {
      await fetch(`/api/super-admin/subjects/${id}`, { method: 'DELETE' })
      await fetchSubjects()
    } catch {
      // silently re-fetch to reflect latest state
      await fetchSubjects()
    }
  }

  async function handleSaved() {
    await fetchSubjects()
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Subject Management</h1>
          <p className="text-muted text-sm mt-1">
            Add, edit, or deactivate subjects across all colleges.
          </p>
        </div>
        <Button onClick={openAdd}>+ Add Subject</Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-surface border border-border rounded-xl px-5 py-4">
        {/* College filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-muted mb-1">Filter by College</label>
          <select
            value={filterCollegeId}
            onChange={handleCollegeFilterChange}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:ring-2 focus:ring-teal/40"
          >
            <option value="">All colleges</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Department filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-muted mb-1">Filter by Department</label>
          <select
            value={filterDeptId}
            onChange={handleDeptFilterChange}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:ring-2 focus:ring-teal/40 disabled:opacity-50"
            disabled={!filterCollegeId}
          >
            <option value="">
              {!filterCollegeId ? 'Select a college first' : 'All departments'}
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Semester filter */}
        <div className="w-40 shrink-0">
          <label className="block text-xs font-medium text-muted mb-1">Semester</label>
          <select
            value={filterSemester}
            onChange={handleSemesterFilterChange}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:ring-2 focus:ring-teal/40"
          >
            <option value="">All semesters</option>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        {/* Result count */}
        <div className="flex items-end pb-0.5 shrink-0">
          <p className="text-xs text-muted">
            {loading ? 'Loading…' : `${subjects.length} subject${subjects.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">Loading subjects…</p>
        </div>
      ) : (
        <SubjectTable
          subjects={subjects}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Modal */}
      <SubjectFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={handleSaved}
        subject={editingSubject}
        colleges={colleges}
      />
    </div>
  )
}
