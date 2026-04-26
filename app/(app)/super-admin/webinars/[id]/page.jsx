'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const STATUS_OPTIONS = ['upcoming', 'live', 'completed', 'cancelled']

export default function EditWebinarPage() {
  const router = useRouter()
  const params = useParams()
  const id     = params.id

  const [loading,    setLoading]    = useState(true)
  const [form,       setForm]       = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)
  const [success,    setSuccess]    = useState(null)
  const [meetSending,setMeetSending]= useState(false)
  const [fbSending,  setFbSending]  = useState(false)
  const [meetResult, setMeetResult] = useState(null)
  const [fbResult,   setFbResult]   = useState(null)

  useEffect(() => {
    fetch('/api/super-admin/webinars')
      .then(r => r.json())
      .then(json => {
        const w = json.webinars?.find(x => x.id === id)
        if (w) {
          setForm({
            title:             w.title ?? '',
            tagline:           w.tagline ?? '',
            description:       w.description ?? '',
            slug:              w.slug ?? '',
            date:              w.date ?? '',
            time_ist:          w.time_ist ?? '',
            time_est:          w.time_est ?? '',
            time_pst:          w.time_pst ?? '',
            duration_mins:     w.duration_mins ?? 45,
            max_registrations: w.max_registrations ?? 200,
            meet_link:         w.meet_link ?? '',
            status:            w.status ?? 'upcoming',
            feedback_open:     w.feedback_open ?? false,
            agenda:            w.agenda?.length ? w.agenda : [''],
          })
        }
        setLoading(false)
      })
  }, [id])

  function setField(key, value) { setForm(f => ({ ...f, [key]: value })) }
  function setAgendaItem(idx, val) {
    setForm(f => { const a = [...f.agenda]; a[idx] = val; return { ...f, agenda: a } })
  }
  function addAgendaItem()       { setForm(f => ({ ...f, agenda: [...f.agenda, ''] })) }
  function removeAgendaItem(idx) { setForm(f => ({ ...f, agenda: f.agenda.filter((_, i) => i !== idx) })) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(null); setSuccess(null)
    try {
      const payload = {
        ...form,
        duration_mins:     Number(form.duration_mins),
        max_registrations: Number(form.max_registrations),
        meet_link:         form.meet_link || null,
        agenda:            form.agenda.filter(Boolean),
      }
      const res  = await fetch(`/api/super-admin/webinars/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { setError(typeof json.error === 'string' ? json.error : JSON.stringify(json.error)); return }
      setSuccess('Saved!')
      setTimeout(() => setSuccess(null), 3000)
    } catch { setError('Network error') }
    finally   { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm('Delete this webinar? This will also delete all registrations and feedback.')) return
    const res = await fetch(`/api/super-admin/webinars/${id}`, { method: 'DELETE' })
    if (res.ok) { router.push('/super-admin/webinars'); router.refresh() }
    else { const j = await res.json(); setError(j.error ?? 'Delete failed') }
  }

  async function handleSendMeetLink() {
    if (!form.meet_link) { setError('Set a Google Meet link first, then save.'); return }
    setMeetSending(true); setMeetResult(null); setError(null)
    try {
      const res  = await fetch('/api/webinar/send-meet-link', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ webinarId: id }),
      })
      const json = await res.json()
      if (!res.ok) setError(json.error ?? 'Failed')
      else setMeetResult(json.message ?? `Sent to ${json.sent} registrants`)
    } catch { setError('Network error') }
    finally   { setMeetSending(false) }
  }

  async function handleSendFeedback() {
    if (!confirm('Send feedback emails to all registrants?')) return
    setFbSending(true); setFbResult(null); setError(null)
    try {
      const res  = await fetch('/api/webinar/send-feedback-emails', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ webinarId: id }),
      })
      const json = await res.json()
      if (!res.ok) setError(json.error ?? 'Failed')
      else setFbResult(`Sent to ${json.sent} registrants`)
    } catch { setError('Network error') }
    finally   { setFbSending(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-teal border-t-transparent animate-spin" />
      </div>
    )
  }
  if (!form) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center">
        <p className="text-error font-medium">Webinar not found.</p>
        <Link href="/super-admin/webinars" className="text-teal hover:underline text-sm mt-2 inline-block">← Back</Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/super-admin/webinars" className="text-muted hover:text-navy transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-navy font-heading flex-1">Edit Webinar</h1>
        <Link
          href={`/super-admin/webinars/${id}/registrations`}
          className="text-sm font-medium text-teal hover:underline"
        >
          View Registrants →
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Basic info */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-navy">Event Details</h2>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Title *</label>
            <input value={form.title} onChange={e => setField('title', e.target.value)} required
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Tagline</label>
            <input value={form.tagline} onChange={e => setField('tagline', e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={3}
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              URL Slug *
              <span className="ml-2 text-xs text-muted font-normal">edudraftai.com/webinar/{form.slug || '…'}</span>
            </label>
            <input value={form.slug} onChange={e => setField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              required pattern="[a-z0-9-]+"
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 font-mono" />
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-navy">Schedule</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Date *</label>
              <input type="date" value={form.date} onChange={e => setField('date', e.target.value)} required
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Duration (mins)</label>
              <input type="number" value={form.duration_mins} onChange={e => setField('duration_mins', e.target.value)} min={15} max={300}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[['time_ist','IST *'], ['time_est','EST'], ['time_pst','PST']].map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-text mb-1.5">Time ({label})</label>
                <input value={form[key]} onChange={e => setField(key, e.target.value)} placeholder="7:00 PM"
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Max Registrations</label>
              <input type="number" value={form.max_registrations} onChange={e => setField('max_registrations', e.target.value)} min={1}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Status</label>
              <select value={form.status} onChange={e => setField('status', e.target.value)}
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Agenda */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-navy">Agenda</h2>
            <button type="button" onClick={addAgendaItem} className="text-xs font-semibold text-teal hover:text-teal-2 transition-colors">
              + Add item
            </button>
          </div>
          {form.agenda.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input value={item} onChange={e => setAgendaItem(idx, e.target.value)} placeholder={`Agenda item ${idx + 1}`}
                className="flex-1 px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20" />
              {form.agenda.length > 1 && (
                <button type="button" onClick={() => removeAgendaItem(idx)}
                  className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Meet link + Email actions */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-navy">Meet Link & Emails</h2>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Google Meet Link</label>
            <input value={form.meet_link} onChange={e => setField('meet_link', e.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij" type="url"
              className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-bg focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/20 font-mono" />
            <p className="text-xs text-muted mt-1">Save after adding the link, then use the button below to email registrants.</p>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={handleSendMeetLink} disabled={meetSending}
              className="flex-1 flex items-center justify-center gap-2 border border-teal text-teal hover:bg-teal hover:text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
              {meetSending ? 'Sending…' : '📨 Send Meet Link to All'}
            </button>
            <button type="button" onClick={handleSendFeedback} disabled={fbSending}
              className="flex-1 flex items-center justify-center gap-2 border border-teal text-teal hover:bg-teal hover:text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
              {fbSending ? 'Sending…' : '⭐ Send Feedback Emails'}
            </button>
          </div>

          {meetResult && <p className="text-sm text-success font-medium">{meetResult}</p>}
          {fbResult   && <p className="text-sm text-success font-medium">{fbResult}</p>}

          {/* Feedback toggle */}
          <div className="flex items-center justify-between py-2 px-3 bg-bg rounded-xl border border-border">
            <div>
              <p className="text-sm font-medium text-text">Feedback Open</p>
              <p className="text-xs text-muted">Allow registrants to submit feedback via their token link</p>
            </div>
            <button
              type="button"
              onClick={() => setField('feedback_open', !form.feedback_open)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.feedback_open ? 'bg-teal' : 'bg-border'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.feedback_open ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {error   && <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-sm text-error">{error}</div>}
        {success && <div className="bg-teal-light border border-success/30 rounded-xl p-3 text-sm text-success font-semibold">{success}</div>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 bg-teal hover:bg-teal-2 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={handleDelete}
            className="px-5 py-3 border border-error/50 text-error hover:bg-error hover:text-white rounded-xl text-sm font-medium transition-colors">
            Delete
          </button>
        </div>
      </form>
    </div>
  )
}
