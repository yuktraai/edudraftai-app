'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm ' +
  'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

// ── Add department modal ───────────────────────────────────────────────────────
function AddModal({ open, onClose }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', code: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(null)
    const res = await fetch('/api/admin/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setError(json.error ?? 'Failed to create department'); return }
    setForm({ name: '', code: '' })
    onClose()
    router.refresh()
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Add Department">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-error text-sm">{error}</p>}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Department Name *</label>
          <input required value={form.name} onChange={set('name')}
            placeholder="e.g. Computer Science & Engineering" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Code *</label>
          <input required value={form.code} onChange={set('code')}
            placeholder="e.g. CSE" maxLength={20} className={`${inputCls} uppercase`} />
          <p className="text-xs text-muted">Short uppercase code — must be unique in your college</p>
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={loading} className="flex-1">Add Department</Button>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Edit modal ─────────────────────────────────────────────────────────────────
function EditModal({ open, onClose, department }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: department?.name ?? '', code: department?.code ?? '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(null)
    const res = await fetch(`/api/admin/departments/${department.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setError(json.error ?? 'Failed to update'); return }
    onClose()
    router.refresh()
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Edit Department">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-error text-sm">{error}</p>}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Name</label>
          <input value={form.name} onChange={set('name')} className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Code</label>
          <input value={form.code} onChange={set('code')} className={`${inputCls} uppercase`} />
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="submit" loading={loading} className="flex-1">Save Changes</Button>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main exported component ────────────────────────────────────────────────────
export function DepartmentsClient({ mode, department }) {
  const router = useRouter()
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${department?.name}"? This cannot be undone.`)) return
    setDeleting(true)
    await fetch(`/api/admin/departments/${department.id}`, { method: 'DELETE' })
    setDeleting(false)
    router.refresh()
  }

  if (mode === 'add-button') {
    return (
      <>
        <Button onClick={() => setAddOpen(true)}>+ Add Department</Button>
        <AddModal open={addOpen} onClose={() => setAddOpen(false)} />
      </>
    )
  }

  // row-actions
  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>Edit</Button>
        <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>Delete</Button>
      </div>
      {editOpen && (
        <EditModal open={editOpen} onClose={() => setEditOpen(false)} department={department} />
      )}
    </>
  )
}
