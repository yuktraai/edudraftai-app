'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm ' +
  'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

// ── Add / Edit modal ──────────────────────────────────────────────────────────
function DeptModal({ open, onClose, onSaved, department, colleges }) {
  const isEdit = !!department
  const [form, setForm]     = useState({ name: '', code: '', college_id: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState(null)

  // Sync form when editing
  useEffect(() => {
    if (department) {
      setForm({ name: department.name, code: department.code, college_id: department.college_id })
    } else {
      setForm({ name: '', code: '', college_id: '' })
    }
    setError(null)
  }, [department, open])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(null)

    const url    = isEdit ? `/api/super-admin/departments/${department.id}` : '/api/super-admin/departments'
    const method = isEdit ? 'PATCH' : 'POST'
    const body   = isEdit
      ? { name: form.name, code: form.code }
      : { name: form.name, code: form.code, college_id: form.college_id }

    const res  = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(typeof json.error === 'string' ? json.error : 'Something went wrong')
      return
    }
    onClose()
    onSaved()
  }

  return (
    <Modal isOpen={open} onClose={onClose} title={isEdit ? 'Edit Department' : 'Add Department'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-error text-sm">{error}</p>}

        {/* College picker — only when adding */}
        {!isEdit && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text">College *</label>
            <select
              required
              value={form.college_id}
              onChange={set('college_id')}
              className={inputCls}
            >
              <option value="">Select a college</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Department Name *</label>
          <input
            required
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Computer Science & Engineering"
            className={inputCls}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Code *</label>
          <input
            required
            value={form.code}
            onChange={set('code')}
            placeholder="e.g. CSE"
            maxLength={20}
            className={`${inputCls} uppercase`}
          />
          <p className="text-xs text-muted">Short uppercase code — must be unique within the college</p>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={loading} className="flex-1">
            {isEdit ? 'Save Changes' : 'Add Department'}
          </Button>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SuperAdminDepartmentsPage() {
  const [colleges, setColleges]           = useState([])
  const [departments, setDepartments]     = useState([])
  const [filterCollegeId, setFilterCollegeId] = useState('')
  const [loading, setLoading]             = useState(false)
  const [showModal, setShowModal]         = useState(false)
  const [editingDept, setEditingDept]     = useState(null)
  const [deletingId, setDeletingId]       = useState(null)

  // Load colleges once
  useEffect(() => {
    fetch('/api/super-admin/colleges-list')
      .then((r) => r.json())
      .then((json) => setColleges(json.data ?? []))
      .catch(() => setColleges([]))
  }, [])

  const fetchDepartments = useCallback(async () => {
    if (!filterCollegeId) { setDepartments([]); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/super-admin/departments?college_id=${filterCollegeId}`)
      const json = await res.json()
      setDepartments(json.departments ?? [])
    } catch {
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }, [filterCollegeId])

  useEffect(() => { fetchDepartments() }, [fetchDepartments])

  function openAdd()         { setEditingDept(null); setShowModal(true) }
  function openEdit(dept)    { setEditingDept(dept);  setShowModal(true) }

  async function handleDelete(dept) {
    if (!confirm(`Delete "${dept.name}"? This will deactivate the department.`)) return
    setDeletingId(dept.id)
    try {
      await fetch(`/api/super-admin/departments/${dept.id}`, { method: 'DELETE' })
      await fetchDepartments()
    } finally {
      setDeletingId(null)
    }
  }

  async function handleRestore(dept) {
    setDeletingId(dept.id)
    try {
      await fetch(`/api/super-admin/departments/${dept.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      })
      await fetchDepartments()
    } finally {
      setDeletingId(null)
    }
  }

  const selectedCollege = colleges.find((c) => c.id === filterCollegeId)

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Department Management</h1>
          <p className="text-muted text-sm mt-1">
            Add, edit, or deactivate departments across all colleges.
          </p>
        </div>
        <Button onClick={openAdd}>+ Add Department</Button>
      </div>

      {/* College filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-surface border border-border rounded-xl px-5 py-4">
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-medium text-muted mb-1">Filter by College</label>
          <select
            value={filterCollegeId}
            onChange={(e) => setFilterCollegeId(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text bg-surface focus:outline-none focus:ring-2 focus:ring-teal/40"
          >
            <option value="">Select a college to view departments</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {filterCollegeId && !loading && (
          <div className="flex items-end pb-0.5 shrink-0">
            <p className="text-xs text-muted">
              {departments.length} department{departments.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Table */}
      {!filterCollegeId ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">Select a college above to view its departments.</p>
        </div>
      ) : loading ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">Loading departments…</p>
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <p className="text-muted text-sm">No departments found for {selectedCollege?.name}.</p>
          <p className="text-muted text-xs mt-1">Click &ldquo;+ Add Department&rdquo; to create one.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-5 py-3 font-medium text-muted">Name</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Code</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {departments.map((d) => (
                <tr key={d.id} className={`hover:bg-bg transition-colors ${!d.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3 font-medium text-text">{d.name}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs bg-bg border border-border px-2 py-0.5 rounded text-muted">
                      {d.code}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      d.is_active
                        ? 'bg-teal-light text-success'
                        : 'bg-red-50 text-error'
                    }`}>
                      {d.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEdit({ ...d, college_id: filterCollegeId })}
                      >
                        Edit
                      </Button>
                      {d.is_active ? (
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deletingId === d.id}
                          onClick={() => handleDelete(d)}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={deletingId === d.id}
                          onClick={() => handleRestore(d)}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeptModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={fetchDepartments}
        department={editingDept}
        colleges={colleges}
      />
    </div>
  )
}
