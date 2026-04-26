'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewWebinarPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    title:             '',
    tagline:           '',
    description:       '',
    slug:              '',
    date:              '',
    time_ist:          '',
    time_est:          '',
    time_pst:          '',
    duration_mins:     45,
    max_registrations: 200,
    agenda:            [''],
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function autoSlug(title) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  function handleTitleChange(e) {
    const v = e.target.value
    setForm(f => ({
      ...f,
      title: v,
      slug: f.slug === autoSlug(f.title) ? autoSlug(v) : f.slug,
    }))
  }

  function setAgendaItem(idx, val) {
    setForm(f => {
      const a = [...f.agenda]
      a[idx] = val
      return { ...f, agenda: a }
    })
  }
  function addAgendaItem()       { setForm(f => ({ ...f, agenda: [...f.agenda, ''] })) }
  function removeAgendaItem(idx) {
    setForm(f => ({ ...f, agenda: f.agenda.filter((_, i) => i !== idx) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = {
        ...form,
        duration_mins:     Number(form.duration_mins),
        max_registrations: Number(form.max_registrations),
        agenda:            form.agenda.filter(Boolean),
      }
      const res = await fetch('/api/super-admin/webinars', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : JSON.stringify(json.error))
        return
      }
      router.push('/super-admin/webinars')
      router.refresh()
    } catch (err) {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/super-admin/webinars" className="text-muted hover:text-navy transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-navy font-heading">New Webinar</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-navy">Event Details</h2>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={handleTitleChange}
              placeholder="EduDraftAI Demo & Q&A"
              required
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Tagline</label>
            <input
              value={form.tagline}
              onChange={e => setField('tagline', e.target.value)}
              placeholder="45-min live session for diploma lecturers"
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              placeholder="A brief overview of what attendees will learn…"
              rows={3}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              URL Slug *
              <span className="ml-2 text-xs text-muted font-normal">edudraftai.com/webinar/<strong>{form.slug || '…'}</strong></span>
            </label>
            <input
              value={form.slug}
              onChange={e => setField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="demo-june-2026"
              required
              pattern="[a-z0-9-]+"
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 font-mono"
            />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-navy">Schedule</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setField('date', e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Duration (mins) *</label>
              <input
                type="number"
                value={form.duration_mins}
                onChange={e => setField('duration_mins', e.target.value)}
                min={15} max={300}
                required
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Time (IST) *</label>
              <input
                value={form.time_ist}
                onChange={e => setField('time_ist', e.target.value)}
                placeholder="7:00 PM"
                required
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Time (EST)</label>
              <input
                value={form.time_est}
                onChange={e => setField('time_est', e.target.value)}
                placeholder="8:30 AM"
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Time (PST)</label>
              <input
                value={form.time_pst}
                onChange={e => setField('time_pst', e.target.value)}
                placeholder="5:30 AM"
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Max Registrations</label>
            <input
              type="number"
              value={form.max_registrations}
              onChange={e => setField('max_registrations', e.target.value)}
              min={1} max={10000}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
            />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy">Agenda</h2>
            <button
              type="button"
              onClick={addAgendaItem}
              className="text-xs font-semibold text-teal hover:text-teal-2 transition-colors"
            >
              + Add item
            </button>
          </div>

          {form.agenda.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                value={item}
                onChange={e => setAgendaItem(idx, e.target.value)}
                placeholder={`Agenda item ${idx + 1}`}
                className="flex-1 px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20"
              />
              {form.agenda.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAgendaItem(idx)}
                  className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-sm text-error">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-teal hover:bg-teal-2 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create Webinar'}
          </button>
          <Link
            href="/super-admin/webinars"
            className="px-5 py-3 border border-border text-muted hover:text-navy hover:border-navy rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
