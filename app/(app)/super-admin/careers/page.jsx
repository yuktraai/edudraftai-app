'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const STATUS_STYLES = {
  true:  'bg-teal-light text-teal border border-teal/25',
  false: 'bg-slate-100 text-muted border border-border',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SuperAdminCareersPage() {
  const [jobs,    setJobs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [toggling, setToggling] = useState({}) // { [jobId]: boolean }
  const [deleting, setDeleting] = useState({}) // { [jobId]: boolean }

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/super-admin/careers')
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to load jobs'); return }
      setJobs(json.data ?? [])
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  async function handleToggle(job) {
    setToggling(prev => ({ ...prev, [job.id]: true }))
    try {
      const res  = await fetch(`/api/super-admin/careers/${job.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ is_active: !job.is_active }),
      })
      const json = await res.json()
      if (!res.ok) { alert(json.error ?? 'Update failed'); return }
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, is_active: !j.is_active } : j))
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setToggling(prev => ({ ...prev, [job.id]: false }))
    }
  }

  async function handleDelete(job) {
    if (!confirm(`Delete "${job.title}"? This will also delete all applications. This cannot be undone.`)) return
    setDeleting(prev => ({ ...prev, [job.id]: true }))
    try {
      const res  = await fetch(`/api/super-admin/careers/${job.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { alert(json.error ?? 'Delete failed'); return }
      setJobs(prev => prev.filter(j => j.id !== job.id))
    } catch {
      alert('Network error. Please try again.')
    } finally {
      setDeleting(prev => ({ ...prev, [job.id]: false }))
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy">Careers</h1>
          <p className="text-sm text-muted mt-0.5">Manage job postings and review applications</p>
        </div>
        <Link
          href="/super-admin/careers/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Post New Job
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-error">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-border/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Jobs table */}
      {!loading && !error && (
        <>
          {jobs.length === 0 ? (
            <div className="text-center py-20 bg-surface border border-border rounded-2xl">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-navy font-semibold mb-1">No job postings yet</p>
              <p className="text-sm text-muted mb-4">Create your first job posting to start recruiting.</p>
              <Link
                href="/super-admin/careers/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-2 transition-colors"
              >
                Post New Job
              </Link>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg text-xs font-semibold text-muted uppercase tracking-wide">
                    <th className="px-5 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Department</th>
                    <th className="px-4 py-3 text-left hidden lg:table-cell">Location</th>
                    <th className="px-4 py-3 text-left hidden lg:table-cell">Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-center hidden sm:table-cell">Applications</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">Posted</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jobs.map(job => (
                    <tr key={job.id} className="hover:bg-bg/50 transition-colors">
                      {/* Title */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-navy">{job.title}</p>
                        <p className="text-xs text-muted mt-0.5 md:hidden">{job.department}</p>
                      </td>
                      {/* Department */}
                      <td className="px-4 py-4 hidden md:table-cell text-muted">{job.department}</td>
                      {/* Location */}
                      <td className="px-4 py-4 hidden lg:table-cell text-muted">{job.location}</td>
                      {/* Type */}
                      <td className="px-4 py-4 hidden lg:table-cell text-muted">{job.type}</td>
                      {/* Status toggle */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggle(job)}
                          disabled={toggling[job.id]}
                          title={job.is_active ? 'Click to deactivate' : 'Click to activate'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${STATUS_STYLES[job.is_active]} hover:opacity-80 disabled:opacity-50 cursor-pointer`}
                        >
                          {toggling[job.id] ? (
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                            </svg>
                          ) : (
                            <span className={`w-1.5 h-1.5 rounded-full ${job.is_active ? 'bg-teal' : 'bg-slate-400'}`} />
                          )}
                          {job.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      {/* Application count */}
                      <td className="px-4 py-4 text-center hidden sm:table-cell">
                        <Link
                          href={`/super-admin/careers/${job.id}/applications`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-navy/5 text-navy font-semibold text-sm hover:bg-teal hover:text-white transition-colors"
                          title="View applications"
                        >
                          {job.application_count ?? 0}
                        </Link>
                      </td>
                      {/* Posted date */}
                      <td className="px-4 py-4 hidden md:table-cell text-muted text-xs">{formatDate(job.created_at)}</td>
                      {/* Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/super-admin/careers/${job.id}/applications`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-muted border border-border hover:border-teal hover:text-teal transition-colors"
                            title="View applicants"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                            Applicants
                          </Link>
                          <Link
                            href={`/super-admin/careers/${job.id}/edit`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-muted border border-border hover:border-navy hover:text-navy transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(job)}
                            disabled={deleting[job.id]}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-muted border border-border hover:border-error hover:text-error transition-colors disabled:opacity-50"
                          >
                            {deleting[job.id] ? (
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
