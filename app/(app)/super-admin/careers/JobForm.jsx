'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const EMPTY_FORM = {
  title:           '',
  department:      '',
  location:        '',
  type:            'Full-time',
  experience:      '',
  description:     '',
  responsibilities: [''],
  requirements:    [''],
}

const JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance']

function BulletList({ label, items, onChange }) {
  function update(i, val) {
    const next = [...items]
    next[i] = val
    onChange(next)
  }
  function add() { onChange([...items, '']) }
  function remove(i) {
    if (items.length === 1) { onChange(['']); return }
    onChange(items.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-navy mb-2">{label}</label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
            <input
              type="text"
              value={item}
              onChange={e => update(i, e.target.value)}
              placeholder="Add bullet point…"
              className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="mt-1 p-1.5 text-slate-400 hover:text-error rounded-lg hover:bg-red-50 transition-colors"
              title="Remove"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 inline-flex items-center gap-1.5 text-sm text-teal font-medium hover:text-teal-2 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add point
      </button>
    </div>
  )
}

export function JobForm({ initialData, jobId }) {
  const router = useRouter()
  const isEdit = Boolean(jobId)

  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    ...initialData,
    responsibilities: initialData?.responsibilities?.length ? initialData.responsibilities : [''],
    requirements:     initialData?.requirements?.length     ? initialData.requirements     : [''],
  }))

  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  function update(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  async function submit(isActive) {
    setError('')
    const payload = {
      ...form,
      responsibilities: form.responsibilities.filter(r => r.trim()),
      requirements:     form.requirements.filter(r => r.trim()),
      is_active:        isActive,
    }

    const required = ['title', 'department', 'location', 'type', 'experience', 'description']
    const missing  = required.filter(f => !payload[f]?.trim())
    if (missing.length) {
      setError(`Please fill in: ${missing.join(', ')}`)
      return
    }

    setSaving(true)
    try {
      const url    = isEdit ? `/api/super-admin/careers/${jobId}` : '/api/super-admin/careers'
      const method = isEdit ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Save failed'); return }
      router.push('/super-admin/careers')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="space-y-6">

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-1.5" htmlFor="jf-title">
            Job Title <span className="text-error">*</span>
          </label>
          <input
            id="jf-title"
            type="text"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            placeholder="e.g. Frontend Developer"
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors"
          />
        </div>

        {/* Department + Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5" htmlFor="jf-dept">
              Department <span className="text-error">*</span>
            </label>
            <input
              id="jf-dept"
              type="text"
              value={form.department}
              onChange={e => update('department', e.target.value)}
              placeholder="e.g. Engineering"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5" htmlFor="jf-loc">
              Location <span className="text-error">*</span>
            </label>
            <input
              id="jf-loc"
              type="text"
              value={form.location}
              onChange={e => update('location', e.target.value)}
              placeholder="e.g. Remote / Bhubaneswar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors"
            />
          </div>
        </div>

        {/* Type + Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5" htmlFor="jf-type">
              Employment Type <span className="text-error">*</span>
            </label>
            <select
              id="jf-type"
              value={form.type}
              onChange={e => update('type', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors"
            >
              {JOB_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5" htmlFor="jf-exp">
              Experience Required <span className="text-error">*</span>
            </label>
            <input
              id="jf-exp"
              type="text"
              value={form.experience}
              onChange={e => update('experience', e.target.value)}
              placeholder="e.g. 0-1 years / Fresher"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-1.5" htmlFor="jf-desc">
            Job Description <span className="text-error">*</span>
            <span className="text-muted font-normal ml-1.5">(Markdown supported)</span>
          </label>
          <textarea
            id="jf-desc"
            rows={8}
            value={form.description}
            onChange={e => update('description', e.target.value)}
            placeholder="Describe the role, team, and what makes it exciting…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors resize-y font-mono"
          />
        </div>

        {/* Responsibilities */}
        <div className="bg-bg rounded-2xl border border-border p-5">
          <BulletList
            label="Responsibilities (What You'll Do)"
            items={form.responsibilities}
            onChange={val => update('responsibilities', val)}
          />
        </div>

        {/* Requirements */}
        <div className="bg-bg rounded-2xl border border-border p-5">
          <BulletList
            label="Requirements (What We're Looking For)"
            items={form.requirements}
            onChange={val => update('requirements', val)}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-error">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-2 disabled:opacity-60 transition-colors"
          >
            {saving ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
            ) : null}
            {isEdit ? 'Save Changes' : 'Publish Job'}
          </button>
          {!isEdit && (
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white border border-border text-navy text-sm font-semibold hover:border-navy disabled:opacity-60 transition-colors"
            >
              Save as Draft
            </button>
          )}
          <button
            type="button"
            onClick={() => router.back()}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-muted text-sm font-medium hover:text-navy transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  )
}
