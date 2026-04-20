'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { FavoriteButton } from '@/components/ui/FavoriteButton'

const selectCls =
  'px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

export function SyllabusClient({ deptList, hasFavorites }) {
  const [showFavOnly, setShowFavOnly] = useState(hasFavorites)
  const [filterDept,  setFilterDept]  = useState('')
  const [filterSem,   setFilterSem]   = useState('')
  const [filterQ,     setFilterQ]     = useState('')

  // Derive all unique semesters
  const allSemesters = useMemo(() => {
    const sems = new Set()
    deptList.forEach(d => Object.keys(d.semesters).forEach(s => sems.add(Number(s))))
    return [...sems].sort((a, b) => a - b)
  }, [deptList])

  const hasFilters = filterDept || filterSem || filterQ

  // Filter the dept/semester/subject tree
  const visibleDepts = useMemo(() => {
    return deptList
      .filter(d => !filterDept || d.id === filterDept)
      .map(dept => {
        const filteredSems = Object.fromEntries(
          Object.entries(dept.semesters)
            .filter(([sem]) => !filterSem || sem === filterSem)
            .map(([sem, subjects]) => [
              sem,
              subjects.filter(s => {
                if (showFavOnly && !hasFilters && !s.favorited) return false
                if (filterQ) {
                  const q = filterQ.toLowerCase()
                  if (!s.name.toLowerCase().includes(q) && !s.code?.toLowerCase().includes(q)) return false
                }
                return true
              }),
            ])
            .filter(([, subjects]) => subjects.length > 0)
        )
        return { ...dept, semesters: filteredSems }
      })
      .filter(d => Object.keys(d.semesters).length > 0)
  }, [deptList, filterDept, filterSem, filterQ, showFavOnly, hasFilters])

  // Total visible subject count
  const visibleCount = useMemo(() =>
    visibleDepts.reduce((sum, d) =>
      sum + Object.values(d.semesters).reduce((s2, subs) => s2 + subs.length, 0), 0),
    [visibleDepts]
  )
  const totalCount = useMemo(() =>
    deptList.reduce((sum, d) =>
      sum + Object.values(d.semesters).reduce((s2, subs) => s2 + subs.length, 0), 0),
    [deptList]
  )

  if (deptList.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center">
        <p className="text-muted text-sm">No subjects found for your college.</p>
        <p className="text-muted text-xs mt-1">Contact your college admin or Yuktra AI team.</p>
      </div>
    )
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Favourites toggle */}
        {hasFavorites && !hasFilters && (
          <div className="flex items-center gap-1 bg-bg border border-border rounded-lg p-0.5">
            <button
              onClick={() => setShowFavOnly(true)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                showFavOnly ? 'bg-teal text-white' : 'text-muted hover:text-text'
              }`}
            >
              ★ My Subjects
            </button>
            <button
              onClick={() => setShowFavOnly(false)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                !showFavOnly ? 'bg-teal text-white' : 'text-muted hover:text-text'
              }`}
            >
              All
            </button>
          </div>
        )}

        {/* Department */}
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className={selectCls}>
          <option value="">All Departments</option>
          {deptList.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        {/* Semester */}
        <select value={filterSem} onChange={e => setFilterSem(e.target.value)} className={selectCls}>
          <option value="">All Semesters</option>
          {allSemesters.map(s => (
            <option key={s} value={String(s)}>Semester {s}</option>
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
          {visibleCount} of {totalCount} subjects
        </p>
      </div>

      {/* Empty state */}
      {visibleDepts.length === 0 && (
        <div className="bg-surface border border-border rounded-xl p-10 text-center">
          <p className="text-muted text-sm">No subjects match your filters.</p>
          <button
            onClick={() => { setFilterDept(''); setFilterSem(''); setFilterQ('') }}
            className="text-xs text-teal hover:underline mt-2"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Dept → Semester → Subjects */}
      <div className="space-y-8">
        {visibleDepts.map((dept) => (
          <div key={dept.id}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-heading text-base font-bold text-navy">
                {dept.favorited && <span className="text-teal mr-1">★</span>}
                {dept.name}
              </h2>
              <FavoriteButton itemType="department" itemId={dept.id} initialState={dept.favorited} />
            </div>

            {Object.entries(dept.semesters)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([sem, semSubjects]) => (
                <div key={sem} className="mb-4">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2 px-1">
                    Semester {sem}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {semSubjects.map((s) => (
                      <div key={s.id} className="relative group">
                        <Link
                          href={`/syllabus/${s.id}`}
                          className="block bg-surface border border-border rounded-xl p-4 hover:border-teal hover:shadow-sm transition-all pr-10"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-text text-sm truncate">
                                {s.favorited && <span className="text-teal mr-1">★</span>}
                                {s.name}
                              </p>
                              <p className="text-xs font-mono text-muted mt-0.5">{s.code}</p>
                            </div>
                            <Badge variant={s.chunk_count > 0 ? 'success' : 'muted'}>
                              {s.chunk_count} topic{s.chunk_count !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {s.chunk_count === 0 && (
                            <p className="text-xs text-muted mt-2">Syllabus not yet uploaded</p>
                          )}
                        </Link>
                        <div className="absolute top-3 right-3">
                          <FavoriteButton itemType="subject" itemId={s.id} initialState={s.favorited} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  )
}
