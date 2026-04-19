'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const selectCls =
  'px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'
const inputCls =
  'px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

export function SyllabusFilters({
  colleges,
  departments,
  activeCollegeId,
  activeDeptId,
  activeQ,
  total,
  filtered,
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const hasFilters = !!(activeCollegeId || activeDeptId || activeQ)

  function buildParams(overrides) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(overrides)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    return params.toString()
  }

  function handleCollegeChange(e) {
    const qs = buildParams({ college_id: e.target.value, dept_id: '' })
    router.push(`/super-admin/syllabus${qs ? '?' + qs : ''}`)
  }

  function handleDeptChange(e) {
    const qs = buildParams({ dept_id: e.target.value })
    router.push(`/super-admin/syllabus${qs ? '?' + qs : ''}`)
  }

  function handleQChange(e) {
    const qs = buildParams({ q: e.target.value })
    router.push(`/super-admin/syllabus${qs ? '?' + qs : ''}`)
  }

  function handleClear() {
    router.push('/super-admin/syllabus')
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* College dropdown */}
        <select
          className={selectCls}
          value={activeCollegeId ?? ''}
          onChange={handleCollegeChange}
        >
          <option value="">All Colleges</option>
          {colleges.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Department dropdown */}
        <select
          className={selectCls}
          value={activeDeptId ?? ''}
          onChange={handleDeptChange}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {/* Subject search */}
        <input
          type="text"
          className={inputCls}
          placeholder="Search subjects…"
          value={activeQ ?? ''}
          onChange={handleQChange}
        />

        {/* Clear filters button */}
        {hasFilters && (
          <button
            onClick={handleClear}
            className="px-3 py-2 rounded-lg border border-border bg-surface text-sm text-muted hover:text-text hover:border-text transition-colors focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Subject count */}
      <p className="text-xs text-muted">
        Showing {filtered} of {total} subject{total !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
