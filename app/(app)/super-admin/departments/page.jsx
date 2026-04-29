'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm ' +
  'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

// ── Bulk Add modal ─────────────────────────────────────────────────────────────
function BulkAddDeptModal({ open, onClose, onSaved, colleges }) {
  const [collegeId, setCollegeId] = useState('')
  const [rows, setRows]           = useState([{ name: '', code: '' }])
  const [saving, setSaving]       = useState(false)
  const [results, setResults]     = useState([])   // { name, ok, error } per row
  const [globalError, setGlobalError] = useState(null)

  useEffect(() => {
    if (open) {
      setRows([{ name: '', code: '' }])
      setResults([])
      setGlobalError(null)
      setCollegeId('')
    }
  }, [open])

  function addRow() { setRows((r) => [...r, { name: '', code: '' }]) }
  function removeRow(i) { setRows((r) => r.filter((_, idx) => idx !== i)) }
  function updateRow(i, field, value) {
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  const validRows = rows.filter((r) => r.name.trim() && r.code.trim())

  async function handleSave() {
    if (!collegeId)          { setGlobalError('Please select a college first.'); return }
    if (validRows.length === 0) { setGlobalError('Add at least one department with a name and code.'); return }
    setSaving(true)
    setResults([])
    setGlobalError(null)

    const settled = await Promise.allSettled(
      validRows.map(async (row) => {
        const res  = await fetch('/api/super-admin/departments', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            name:       row.name.trim(),
            code:       row.code.trim().toUpperCase(),
            college_id: collegeId,
          }),
        })
        const json = await res.json()
        return { name: row.name.trim(), ok: res.ok, error: typeof json.error === 'string' ? json.error : null }
      })
    )

    const mapped = settled.map((r) =>
      r.status === 'fulfilled' ? r.value : { name: '?', ok: false, error: 'Network error' }
    )
    setSaving(false)
    setResults(mapped)
    onSaved()  // refresh the list regardless (partial saves)

    if (mapped.every((r) => r.ok)) {
      onClose()
    }
    // If some failed, stay open and show per-row status
  }

  const hasResults = results.length > 0
  const allOk      = hasResults && results.every((r) => r.ok)

  return (
    <Modal isOpen={open} onClose={onClose} title="Add Departments">
      <div className="space-y-4">

        {/* College picker */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">College *</label>
          <select
            required
            value={collegeId}
            onChange={(e) => setCollegeId(e.target.value)}
            className={inputCls}
          >
            <option value="">Select a college</option>
            {colleges.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Department rows */}
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_120px_32px] gap-2 text-xs font-medium text-muted px-1">
            <span>Department Name</span>
            <span>Code</span>
            <span />
          </div>

          {rows.map((row, i) => {
            const result = results[i]
            return (
              <div key={i} className="grid grid-cols-[1fr_120px_32px] gap-2 items-center">
                <div className="relative">
                  <input
                    value={row.name}
                    onChange={(e) => updateRow(i, 'name', e.target.value)}
                    placeholder="e.g. Computer Science & Engineering"
                    className={`${inputCls} ${result ? (result.ok ? 'border-success' : 'border-error') : ''}`}
                    disabled={saving}
                  />
                </div>
                <input
                  value={row.code}
                  onChange={(e) => updateRow(i, 'code', e.target.value.toUpperCase())}
                  placeholder="CSE"
                  maxLength={20}
                  className={`${inputCls} uppercase font-mono ${result ? (result.ok ? 'border-success' : 'border-error') : ''}`}
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  disabled={rows.length === 1 || saving}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-error hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Remove row"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {/* Per-row result message */}
                {result && !result.ok && (
                  <p className="col-span-3 text-xs text-error -mt-1 px-1">{result.error ?? 'Failed'}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Add row button */}
        <button
          type="button"
          onClick={addRow}
          disabled={saving}
          className="flex items-center gap-1.5 text-sm text-teal font-medium hover:underline disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add another department
        </button>

        {/* Global error */}
        {globalError && <p className="text-error text-sm">{globalError}</p>}

        {/* All-success message */}
        {allOk && (
          <p className="text-success text-sm font-medium">
            ✓ All {results.length} department{results.length !== 1 ? 's' : ''} saved successfully.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={saving || validRows.length === 0}
            className="flex-1"
          >
            {saving
              ? 'Saving…'
              : `Save ${validRows.length > 0 ? validRows.length : ''} Department${validRows.length !== 1 ? 's' : ''}`}
          </Button>
          <Button variant="secondary" type="button" onClick={onClose} disabled={saving}>
            {hasResults && !allOk ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Edit modal (single) ────────────────────────────────────────────────────────
function EditDeptModal({ open, onClose, onSaved, department }) {
  const [form, setForm]       = useState({ name: '', code: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (department) setForm({ name: department.name, code: department.code })
    setError(null)
  }, [department, open])

  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(null)
    const res  = await fetch(`/api/super-admin/departments/${department.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: form.name, code: form.code }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setError(typeof json.error === 'string' ? json.error : 'Something went wrong'); return }
    onClose(); onSaved()
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Edit Department">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-error text-sm">{error}</p>}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Department Name *</label>
          <input required value={form.name} onChange={set('name')} placeholder="e.g. Computer Science & Engineering" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Code *</label>
          <input required value={form.code} onChange={set('code')} placeholder="e.g. CSE" maxLength={20} className={`${inputCls} uppercase`} />
          <p className="text-xs text-muted">Short uppercase code — must be unique within the college</p>
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={loading} className="flex-1">Save Changes</Button>
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
  const [showAddModal, setShowAddModal]   = useState(false)
  const [editingDept, setEditingDept]     = useState(null)
  const [deletingId, setDeletingId]       = useState(null)

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
    } catch { setDepartments([]) }
    finally  { setLoading(false) }
  }, [filterCollegeId])

  useEffect(() => { fetchDepartments() }, [fetchDepartments])

  async function handleDelete(dept) {
    if (!confirm(`Deactivate "${dept.name}"?`)) return
    setDeletingId(dept.id)
    try {
      await fetch(`/api/super-admin/departments/${dept.id}`, { method: 'DELETE' })
      await fetchDepartments()
    } finally { setDeletingId(null) }
  }

  async function handleRestore(dept) {
    setDeletingId(dept.id)
    try {
      await fetch(`/api/super-admin/departments/${dept.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ is_active: true }),
      })
      await fetchDepartments()
    } finally { setDeletingId(null) }
  }

  const selectedCollege = colleges.find((c) => c.id === filterCollegeId)

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Department Management</h1>
          <p className="text-muted text-sm mt-1">Add, edit, or deactivate departments across all colleges.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>+ Add Department</Button>
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
                      d.is_active ? 'bg-teal-light text-success' : 'bg-red-50 text-error'
                    }`}>
                      {d.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingDept({ ...d, college_id: filterCollegeId })}
                      >
                        Edit
                      </Button>
                      {d.is_active ? (
                        <Button variant="danger" size="sm" loading={deletingId === d.id} onClick={() => handleDelete(d)}>
                          Deactivate
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" loading={deletingId === d.id} onClick={() => handleRestore(d)}>
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

      {/* Bulk add modal */}
      <BulkAddDeptModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={fetchDepartments}
        colleges={colleges}
      />

      {/* Single edit modal */}
      <EditDeptModal
        open={!!editingDept}
        onClose={() => setEditingDept(null)}
        onSaved={fetchDepartments}
        department={editingDept}
      />
    </div>
  )
}
