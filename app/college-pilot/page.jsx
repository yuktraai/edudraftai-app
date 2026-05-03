'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

const ODISHA_DISTRICTS = [
  'Angul','Balangir','Balasore','Bargarh','Bhadrak','Bolangir','Boudh','Cuttack',
  'Deogarh','Dhenkanal','Gajapati','Ganjam','Jagatsinghpur','Jajpur','Jharsuguda',
  'Kalahandi','Kandhamal','Kendrapara','Kendujhar','Khordha','Koraput','Malkangiri',
  'Mayurbhanj','Nabarangpur','Nayagarh','Nuapada','Puri','Rayagada','Sambalpur',
  'Sonepur','Sundargarh',
]

function emptyDept() { return '' }

export default function CollegePilotPage() {
  const [form, setForm] = useState({
    college_name:    '',
    address:         '',
    district:        '',
    state:           'Odisha',
    phone:           '',
    principal_name:  '',
    principal_email: '',
  })
  const [departments, setDepartments]   = useState([''])
  const [logo,        setLogo]          = useState(null)
  const [logoError,   setLogoError]     = useState('')
  const [submitting,  setSubmitting]    = useState(false)
  const [success,     setSuccess]       = useState(false)
  const [error,       setError]         = useState('')
  const fileRef = useRef(null)

  function update(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  function updateDept(i, val) {
    setDepartments(prev => { const n = [...prev]; n[i] = val; return n })
  }
  function addDept()    { setDepartments(prev => [...prev, '']) }
  function removeDept(i) {
    setDepartments(prev => prev.length === 1 ? [''] : prev.filter((_, idx) => idx !== i))
  }

  function handleLogo(e) {
    setLogoError('')
    const file = e.target.files?.[0]
    if (!file) { setLogo(null); return }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowed.includes(file.type)) {
      setLogoError('Logo must be JPG, PNG, WebP or SVG.')
      setLogo(null); e.target.value = ''; return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo must be under 2 MB.')
      setLogo(null); e.target.value = ''; return
    }
    setLogo(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const validDepts = departments.filter(d => d.trim())
    if (!validDepts.length) { setError('Please add at least one department.'); return }

    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      validDepts.forEach(d => fd.append('departments[]', d.trim()))
      if (logo) fd.append('logo', logo)

      const res  = await fetch('/api/college-pilot', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Submission failed. Please try again.'); return }
      setSuccess(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-surface border border-border rounded-2xl p-10 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-teal-light flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-navy mb-3">Request Submitted!</h2>
          <p className="text-muted text-sm leading-relaxed mb-6">
            Thank you for your interest in EduDraftAI. Our team will review your submission
            and reach out to <strong className="text-navy">{form.principal_email}</strong> within 2–3 business days.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-2 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors placeholder:text-slate-400'
  const labelCls = 'block text-sm font-semibold text-navy mb-1.5'

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-navy text-white">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-white hover:text-teal transition-colors">
            <img src="/logo.png" alt="EduDraftAI" className="w-8 h-8 rounded-xl" />
            <span className="font-bold text-lg tracking-tight">EduDraft<span className="text-teal">AI</span></span>
          </Link>
          <Link href="/careers" className="text-sm text-slate-300 hover:text-white transition-colors">Careers →</Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-navy pb-10 pt-8">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal/10 border border-teal/20 text-teal text-sm font-semibold mb-5">
            🏫 College Pilot Programme
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            Get Early Access for Your College
          </h1>
          <p className="text-slate-300 text-base max-w-xl mx-auto leading-relaxed">
            Fill in your college details and we'll onboard you to EduDraftAI — free during the pilot phase.
            All SCTEVT Odisha diploma colleges are eligible.
          </p>
        </div>
      </div>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-surface border border-border rounded-2xl p-8 space-y-8">

            {/* College details */}
            <section>
              <h2 className="text-base font-bold text-navy mb-5 pb-3 border-b border-border">College Details</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls} htmlFor="cp-name">
                    College Name <span className="text-error">*</span>
                  </label>
                  <input id="cp-name" type="text" required value={form.college_name}
                    onChange={e => update('college_name', e.target.value)}
                    placeholder="e.g. Government Polytechnic Bhubaneswar"
                    className={inputCls} />
                </div>

                <div>
                  <label className={labelCls} htmlFor="cp-address">
                    Full Address <span className="text-error">*</span>
                  </label>
                  <textarea id="cp-address" rows={2} required value={form.address}
                    onChange={e => update('address', e.target.value)}
                    placeholder="Street / locality / PO"
                    className={inputCls + ' resize-none'} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} htmlFor="cp-district">
                      District <span className="text-error">*</span>
                    </label>
                    <select id="cp-district" required value={form.district}
                      onChange={e => update('district', e.target.value)}
                      className={inputCls}>
                      <option value="">Select district…</option>
                      {ODISHA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="cp-phone">
                      College Phone <span className="text-error">*</span>
                    </label>
                    <input id="cp-phone" type="tel" required value={form.phone}
                      onChange={e => update('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className={inputCls} />
                  </div>
                </div>

                {/* College Logo */}
                <div>
                  <label className={labelCls}>
                    College Logo
                    <span className="text-muted font-normal ml-1">(JPG, PNG, SVG — max 2 MB, optional)</span>
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                      logo ? 'border-teal bg-teal-light' : 'border-border bg-slate-50 hover:border-teal/50'
                    }`}
                  >
                    {logo ? (
                      <img
                        src={URL.createObjectURL(logo)}
                        alt="Logo preview"
                        className="w-10 h-10 object-contain rounded-lg border border-border bg-white"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    )}
                    <span className={`text-sm ${logo ? 'text-teal font-medium' : 'text-slate-500'}`}>
                      {logo ? logo.name : 'Click to upload college logo…'}
                    </span>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      onChange={handleLogo} className="sr-only" />
                  </div>
                  {logoError && <p className="mt-1.5 text-xs text-error">{logoError}</p>}
                </div>
              </div>
            </section>

            {/* Principal details */}
            <section>
              <h2 className="text-base font-bold text-navy mb-5 pb-3 border-b border-border">Principal / Contact Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} htmlFor="cp-pname">
                    Principal Name <span className="text-error">*</span>
                  </label>
                  <input id="cp-pname" type="text" required value={form.principal_name}
                    onChange={e => update('principal_name', e.target.value)}
                    placeholder="Dr. / Mr. / Ms."
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="cp-pemail">
                    Official Email <span className="text-error">*</span>
                  </label>
                  <input id="cp-pemail" type="email" required value={form.principal_email}
                    onChange={e => update('principal_email', e.target.value)}
                    placeholder="principal@college.edu.in"
                    className={inputCls} />
                </div>
              </div>
            </section>

            {/* Departments */}
            <section>
              <h2 className="text-base font-bold text-navy mb-1 pb-3 border-b border-border">
                Departments
                <span className="text-muted font-normal ml-1 text-sm">(add all departments)</span>
              </h2>
              <div className="mt-4 space-y-2">
                {departments.map((dept, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="w-5 h-5 rounded-full bg-teal-light text-teal text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={dept}
                      onChange={e => updateDept(i, e.target.value)}
                      placeholder="e.g. Computer Science & Engineering"
                      className={inputCls + ' flex-1'}
                    />
                    <button type="button" onClick={() => removeDept(i)}
                      className="p-1.5 text-slate-400 hover:text-error rounded-lg hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addDept}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm text-teal font-medium hover:text-teal-2 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add department
                </button>
              </div>
            </section>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-error">{error}</div>
            )}

            {/* Submit */}
            <button type="submit" disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-teal text-white font-semibold text-sm hover:bg-teal-2 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
                  </svg>
                  Submitting…
                </>
              ) : 'Submit Pilot Request'}
            </button>
          </div>
        </form>
      </main>

      <footer className="border-t border-border py-6">
        <div className="max-w-3xl mx-auto px-6 text-center text-sm text-muted">
          <p>© {new Date().getFullYear()} Yuktra AI ·
            <Link href="/privacy-policy" className="ml-2 hover:text-navy transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
