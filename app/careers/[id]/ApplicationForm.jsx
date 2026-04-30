'use client'

import { useState, useRef } from 'react'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']

export function ApplicationForm({ jobId, jobTitle }) {
  const [fields, setFields] = useState({
    full_name:    '',
    email:        '',
    phone:        '',
    applicant_role: '',
  })
  const [file,       setFile]       = useState(null)
  const [fileError,  setFileError]  = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState('')
  const fileInputRef = useRef(null)

  function handleChange(e) {
    setFields(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleFile(e) {
    setFileError('')
    const selected = e.target.files?.[0]
    if (!selected) { setFile(null); return }

    const ext = '.' + selected.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError('Only PDF, DOC, or DOCX files are accepted.')
      setFile(null)
      e.target.value = ''
      return
    }
    if (selected.size > MAX_FILE_BYTES) {
      setFileError('File must be under 5 MB.')
      setFile(null)
      e.target.value = ''
      return
    }
    setFile(selected)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!file) { setError('Please attach your resume.'); return }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('full_name',    fields.full_name.trim())
      fd.append('email',        fields.email.trim())
      fd.append('phone',        fields.phone.trim())
      fd.append('applicant_role', fields.applicant_role.trim())
      fd.append('resume',       file)

      const res  = await fetch(`/api/careers/${jobId}/apply`, {
        method: 'POST',
        body:   fd,
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Something went wrong. Please try again.')
        return
      }

      setSuccess(true)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-14 h-14 rounded-full bg-teal-light flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-navy mb-2">Application Submitted!</h3>
        <p className="text-sm text-muted leading-relaxed">
          Thanks for applying for <strong className="text-navy">{jobTitle}</strong>.
          Check your email for a confirmation. Our team will review and get back to you soon.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Full Name */}
      <div>
        <label className="block text-sm font-semibold text-navy mb-1.5" htmlFor="full_name">
          Full Name <span className="text-error">*</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          autoComplete="name"
          value={fields.full_name}
          onChange={handleChange}
          placeholder="e.g. Priya Mohanty"
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors placeholder:text-slate-400"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-navy mb-1.5" htmlFor="email">
          Email Address <span className="text-error">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={fields.email}
          onChange={handleChange}
          placeholder="you@example.com"
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors placeholder:text-slate-400"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-semibold text-navy mb-1.5" htmlFor="phone">
          Phone Number <span className="text-error">*</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          value={fields.phone}
          onChange={handleChange}
          placeholder="+91 98765 43210"
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors placeholder:text-slate-400"
        />
      </div>

      {/* Current Role */}
      <div>
        <label className="block text-sm font-semibold text-navy mb-1.5" htmlFor="applicant_role">
          Current Role / Year of Study
          <span className="text-muted font-normal ml-1">(optional)</span>
        </label>
        <input
          id="applicant_role"
          name="applicant_role"
          type="text"
          value={fields.applicant_role}
          onChange={handleChange}
          placeholder="e.g. Software Engineer at XYZ / 3rd year B.Tech"
          className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-text text-sm focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors placeholder:text-slate-400"
        />
      </div>

      {/* Resume Upload */}
      <div>
        <label className="block text-sm font-semibold text-navy mb-1.5">
          Resume <span className="text-error">*</span>
          <span className="text-muted font-normal ml-1">(PDF, DOC, or DOCX — max 5 MB)</span>
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
            file
              ? 'border-teal bg-teal-light'
              : 'border-border bg-slate-50 hover:border-teal/50 hover:bg-white'
          }`}
        >
          <svg
            className={`w-5 h-5 shrink-0 ${file ? 'text-teal' : 'text-slate-400'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
          </svg>
          <span className={`text-sm ${file ? 'text-teal font-medium' : 'text-slate-500'}`}>
            {file ? file.name : 'Click to attach resume…'}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFile}
            className="sr-only"
          />
        </div>
        {fileError && (
          <p className="mt-1.5 text-xs text-error">{fileError}</p>
        )}
      </div>

      {/* Submission error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-error">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-teal text-white font-semibold text-sm hover:bg-teal-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            Submitting…
          </>
        ) : (
          'Apply Now'
        )}
      </button>
    </form>
  )
}
