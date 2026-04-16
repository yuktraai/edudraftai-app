'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

export function CollegesClient({ mode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', district: '', address: '' })

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/colleges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error?.formErrors?.[0] ?? json.error ?? 'Something went wrong')
      return
    }

    setOpen(false)
    setForm({ name: '', code: '', district: '', address: '' })
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ New College</Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add New College">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-error text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Field label="College Name *" id="name">
            <input
              id="name" required value={form.name} onChange={set('name')}
              placeholder="e.g. Government Polytechnic Bhubaneswar"
              className={inputCls}
            />
          </Field>

          <Field label="College Code *" id="code">
            <input
              id="code" required value={form.code} onChange={set('code')}
              placeholder="e.g. GPB" maxLength={20}
              className={`${inputCls} uppercase`}
            />
            <p className="text-xs text-muted mt-1">Unique identifier — uppercase, no spaces</p>
          </Field>

          <Field label="District" id="district">
            <input
              id="district" value={form.district} onChange={set('district')}
              placeholder="e.g. Khordha"
              className={inputCls}
            />
          </Field>

          <Field label="Address" id="address">
            <input
              id="address" value={form.address} onChange={set('address')}
              placeholder="Full address"
              className={inputCls}
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1">
              Create College
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)} type="button">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

function Field({ label, id, children }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-text">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm ' +
  'placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'
