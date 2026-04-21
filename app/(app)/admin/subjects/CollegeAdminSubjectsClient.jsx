'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

const SEMESTERS = [1, 2, 3, 4, 5, 6]

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm ' +
  'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

const selectCls = inputCls

// ── Department checkbox list ───────────────────────────────────────────────────
function DeptCheckboxList({ departments, selected, onChange }) {
  function toggle(id) {
    onChange(
      selected.includes(id)
        ? selected.filter((d) => d !== id)
        : [...selected, id]
    )
  }

  return (
    <div className="border border-border rounded-lg divide-y divide-border max-h-44 overflow-y-auto">
      {departments.map((d) => {
        const checked = selected.includes(d.id)
        return (
          <label
            key={d.id}
            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
              checked ? 'bg-teal-light' : 'hover:bg-bg'
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(d.id)}
              className="accent-teal w-4 h-4 shrink-0"
            />
            <span className="text-sm text-text">{d.name}</span>
            <span className="text-xs text-muted font-mono ml-auto">{d.code}</span>
          </label>
        )
      })}
    </div>
  )
}

// ── Add Subject Modal ──────────────────────────────────────────────────────────
function AddModal({ open, onClose, departments }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', code: '', semester: '', subject_type: 'theory', has_math: false })
  const [selectedDepts, setSelectedDepts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function handleClose() {
    setForm({ name: '', code: '', semester: '', subject_type: 'theory', has_math: false })
    setSelectedDepts([])
    setError(null)
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (selectedDepts.length === 0) {
      setError('Select at least one department')
      return
    }
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:           form.name,
        code:           form.code,
        semester:       Number(form.semester),
        subject_type:   form.subject_type,
        has_math:       form.has_math,
        department_ids: selectedDepts,
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(typeof json.error === 'string' ? json.error : 'Failed to create subject')
      return
    }
    handleClose()
    router.refresh()
  }

  return (
    <Modal isOpen={open} onClose={handleClose} title="Add Subject">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-error text-sm">{error}</p>}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Subject Name *</label>
          <input
            required
            value={form.name}
            onChange={set('name')}
            placeholder="e.g. Engineering Mathematics"
            className={inputCls}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Code *</label>
          <input
            required
            value={form.code}
            onChange={set('code')}
            placeholder="e.g. MATH301"
            maxLength={20}
            className={`${inputCls} uppercase`}
          />
          <p className="text-xs text-muted">Uppercase code — unique per department within your college</p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Semester *</label>
          <select required value={form.semester} onChange={set('semester')} className={selectCls}>
            <option value="">Select semester</option>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        {/* Subject type */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Subject Type *</label>
          <div className="flex gap-2">
            {['theory', 'practical'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm(f => ({ ...f, subject_type: type }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.subject_type === type
                    ? 'bg-teal text-white border-teal'
                    : 'bg-bg border-border text-muted hover:border-teal hover:text-teal'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">
            Departments *
            {selectedDepts.length > 0 && (
              <span className="ml-2 text-xs font-normal text-teal">
                {selectedDepts.length} selected
              </span>
            )}
          </label>
          <p className="text-xs text-muted mb-1.5">
            Select all departments this subject applies to — one entry will be created per department.
          </p>
          {departments.length > 0 ? (
            <DeptCheckboxList
              departments={departments}
              selected={selectedDepts}
              onChange={setSelectedDepts}
            />
          ) : (
            <p className="text-xs text-muted italic px-1">No departments found. Add departments first.</p>
          )}
        </div>

        {/* has_math toggle */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.has_math}
            onChange={e => setForm(f => ({ ...f, has_math: e.target.checked }))}
            className="accent-teal w-4 h-4 mt-0.5 shrink-0"
          />
          <div>
            <span className="text-sm font-medium text-text">Contains mathematical formulas</span>
            <p className="text-xs text-muted mt-0.5">
              Marks this as a math-heavy subject. The AI will use strict LaTeX notation for all equations (e.g. Physics, Maths, Electronics).
            </p>
          </div>
        </label>

        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={loading} className="flex-1">
            Add Subject{selectedDepts.length > 1 ? ` (${selectedDepts.length} depts)` : ''}
          </Button>
          <Button variant="secondary" type="button" onClick={handleClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Edit Subject Modal ─────────────────────────────────────────────────────────
function EditModal({ open, onClose, subject, departments = [] }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name:          subject?.name ?? '',
    code:          subject?.code ?? '',
    semester:      String(subject?.semester ?? ''),
    department_id: subject?.department_id ?? '',
    subject_type:  subject?.subject_type ?? 'theory',
    has_math:      subject?.has_math ?? false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/admin/subjects/${subject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, semester: Number(form.semester) }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(typeof json.error === 'string' ? json.error : 'Failed to update subject')
      return
    }
    onClose()
    router.refresh()
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Edit Subject">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-error text-sm">{error}</p>}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Subject Name</label>
          <input value={form.name} onChange={set('name')} className={inputCls} />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Code</label>
          <input value={form.code} onChange={set('code')} maxLength={20} className={`${inputCls} uppercase`} />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Semester</label>
          <select value={form.semester} onChange={set('semester')} className={selectCls}>
            {SEMESTERS.map((s) => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        {/* Subject type */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Subject Type *</label>
          <div className="flex gap-2">
            {['theory', 'practical'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm(f => ({ ...f, subject_type: type }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.subject_type === type
                    ? 'bg-teal text-white border-teal'
                    : 'bg-bg border-border text-muted hover:border-teal hover:text-teal'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {departments.length > 0 && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text">Department</label>
            <select value={form.department_id} onChange={set('department_id')} className={selectCls}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
        )}

        {/* has_math toggle */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.has_math}
            onChange={e => setForm(f => ({ ...f, has_math: e.target.checked }))}
            className="accent-teal w-4 h-4 mt-0.5 shrink-0"
          />
          <div>
            <span className="text-sm font-medium text-text">Contains mathematical formulas</span>
            <p className="text-xs text-muted mt-0.5">
              Marks this as a math-heavy subject (Physics, Maths, Electronics, etc.). AI will use strict LaTeX notation.
            </p>
          </div>
        </label>

        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={loading} className="flex-1">Save Changes</Button>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main Exported Component ────────────────────────────────────────────────────
export function CollegeAdminSubjectsClient({ mode, subject, departments }) {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [toggling, setToggling] = useState(false)

  async function handleToggleActive() {
    setToggling(true)
    await fetch(`/api/admin/subjects/${subject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !subject.is_active }),
    })
    setToggling(false)
    router.refresh()
  }

  if (mode === 'add-button') {
    return (
      <>
        <Button onClick={() => setAddOpen(true)}>+ Add Subject</Button>
        <AddModal open={addOpen} onClose={() => setAddOpen(false)} departments={departments} />
      </>
    )
  }

  // row-actions
  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>Edit</Button>
        <Button
          variant={subject?.is_active ? 'danger' : 'secondary'}
          size="sm"
          loading={toggling}
          onClick={handleToggleActive}
        >
          {subject?.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
      {editOpen && (
        <EditModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          subject={subject}
          departments={departments}
        />
      )}
    </>
  )
}
