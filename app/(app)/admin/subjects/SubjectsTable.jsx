'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/Badge'
import { CollegeAdminSubjectsClient } from './CollegeAdminSubjectsClient'

const PARSE_STATUS_MAP = {
  completed:  { variant: 'success', label: 'Parsed' },
  processing: { variant: 'info',    label: 'Processing' },
  pending:    { variant: 'muted',   label: 'Pending' },
  failed:     { variant: 'error',   label: 'Failed' },
}

const selectCls =
  'px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

export function SubjectsTable({ subjects, departments }) {
  const [filterDept, setFilterDept]     = useState('')
  const [filterSem,  setFilterSem]      = useState('')
  const [filterQ,    setFilterQ]        = useState('')

  // Unique semesters across all subjects
  const allSemesters = useMemo(() =>
    [...new Set(subjects.map(s => s.semester))].sort((a, b) => a - b),
    [subjects]
  )

  // Apply filters
  const filtered = useMemo(() => {
    return subjects.filter(s => {
      if (filterDept && s.department_id !== filterDept) return false
      if (filterSem  && String(s.semester) !== filterSem) return false
      if (filterQ) {
        const q = filterQ.toLowerCase()
        if (!s.name.toLowerCase().includes(q) && !s.code.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [subjects, filterDept, filterSem, filterQ])

  // Group filtered subjects: dept → semester
  const grouped = useMemo(() => {
    const g = {}
    for (const s of filtered) {
      const key = s.department_id ?? 'unknown'
      if (!g[key]) g[key] = { name: s.dept_name, semesters: {} }
      const sem = String(s.semester)
      if (!g[key].semesters[sem]) g[key].semesters[sem] = []
      g[key].semesters[sem].push(s)
    }
    return Object.values(g).sort((a, b) => a.name.localeCompare(b.name))
  }, [filtered])

  const hasFilters = filterDept || filterSem || filterQ

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Department */}
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className={selectCls}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        {/* Semester */}
        <select
          value={filterSem}
          onChange={e => setFilterSem(e.target.value)}
          className={selectCls}
        >
          <option value="">All Semesters</option>
          {allSemesters.map(s => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>

        {/* Subject search */}
        <div className="relative flex-1 min-w-[160px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={filterQ}
            onChange={e => setFilterQ(e.target.value)}
            placeholder="Search subject or code…"
            className={`${selectCls} pl-9 w-full`}
          />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={() => { setFilterDept(''); setFilterSem(''); setFilterQ('') }}
            className="text-sm text-muted hover:text-text transition-colors"
          >
            Clear
          </button>
        )}

        <p className="text-xs text-muted ml-auto">
          {filtered.length} of {subjects.length} subjects
        </p>
      </div>

      {/* Table */}
      {grouped.length > 0 ? (
        <div className="space-y-8">
          {grouped.map((dept, di) => (
            <div key={di}>
              <h2 className="font-heading text-base font-bold text-navy mb-3">{dept.name}</h2>
              {Object.entries(dept.semesters)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([sem, semSubjects]) => (
                  <div key={sem} className="mb-4">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">
                      Semester {sem}
                    </p>
                    <div className="bg-surface border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-bg">
                            <th className="text-left px-5 py-3 font-medium text-muted">Subject</th>
                            <th className="text-left px-5 py-3 font-medium text-muted">Code</th>
                            <th className="text-left px-5 py-3 font-medium text-muted">Topics</th>
                            <th className="text-left px-5 py-3 font-medium text-muted">Syllabus</th>
                            <th className="text-left px-5 py-3 font-medium text-muted">Status</th>
                            <th className="text-left px-5 py-3 font-medium text-muted">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {semSubjects.map(s => {
                            const fileStatus = s.latest_file?.parse_status
                            const badgeConf  = PARSE_STATUS_MAP[fileStatus]
                            return (
                              <tr key={s.id} className="hover:bg-bg transition-colors">
                                <td className="px-5 py-3 font-medium text-text">{s.name}</td>
                                <td className="px-5 py-3 font-mono text-xs text-muted">{s.code}</td>
                                <td className="px-5 py-3 text-muted">
                                  {s.chunk_count} topic{s.chunk_count !== 1 ? 's' : ''}
                                </td>
                                <td className="px-5 py-3">
                                  {s.latest_file && badgeConf
                                    ? <Badge variant={badgeConf.variant}>{badgeConf.label}</Badge>
                                    : <Badge variant="muted">Not uploaded</Badge>
                                  }
                                </td>
                                <td className="px-5 py-3">
                                  <Badge variant={s.is_active ? 'success' : 'error'}>
                                    {s.is_active ? 'Active' : 'Inactive'}
                                  </Badge>
                                </td>
                                <td className="px-5 py-3">
                                  <CollegeAdminSubjectsClient
                                    mode="row-actions"
                                    subject={s}
                                    departments={departments}
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          {hasFilters ? (
            <>
              <p className="text-muted text-sm">No subjects match your filters.</p>
              <button
                onClick={() => { setFilterDept(''); setFilterSem(''); setFilterQ('') }}
                className="text-xs text-teal hover:underline mt-2"
              >
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="text-muted text-sm">No subjects yet.</p>
              <p className="text-muted text-xs mt-1">Click &ldquo;+ Add Subject&rdquo; to create one.</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
