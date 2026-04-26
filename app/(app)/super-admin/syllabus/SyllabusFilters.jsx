'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { SubjectMultiSelect } from '@/components/admin/SubjectMultiSelect'

const selectCls =
  'px-3 py-2 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'

export function SyllabusFilters({
  colleges,
  departments,
  subjects,
  activeCollegeId,
  activeDeptId,
  activeSemester,
  activeSubjectIds,
  total,
  filtered,
}) {
  const router      = useRouter()
  const searchParams = useSearchParams()

  const hasFilters = !!(
    activeCollegeId ||
    activeDeptId ||
    activeSemester ||
    activeSubjectIds.length > 0
  )

  function buildParams(overrides) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(overrides)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    return params.toString()
  }

  function handleCollegeChange(e) {
    // Changing college resets dept and subject filter
    const qs = buildParams({
      college_id:  e.target.value,
      dept_id:     '',
      subject_ids: '',
    })
    router.push(`/super-admin/syllabus${qs ? '?' + qs : ''}`)
  }

  function handleDeptChange(e) {
    // Changing dept resets subject filter
    const qs = buildParams({
      dept_id:     e.target.value,
      subject_ids: '',
    })
    router.push(`/super-admin/syllabus${qs ? '?' + qs : ''}`)
  }

  function handleSemesterChange(e) {
    // Changing semester resets subject filter
    const qs = buildParams({
      semester:    e.target.value,
      subject_ids: '',
    })
    router.push(`/super-admin/syllabus${qs ? '?' + qs : ''}`)
  }

  function handleSubjectChange(newIds) {
    const qs = buildParams({
      subject_ids: newIds.length > 0 ? newIds.join(',') : '',
    })
    router.push(`/super-admin/syllabus${qs ? '?' + qs : ''}`)
  }

  function handleClear() {
    router.push('/super-admin/syllabus')
  }

  // Filter subjects available to SubjectMultiSelect by the currently active
  // college / department / semester so the list stays relevant
  const visibleSubjects = (subjects ?? []).filter((s) => {
    if (activeCollegeId && s.college_id !== activeCollegeId) return false
    if (activeDeptId    && s.department_id !== activeDeptId) return false
    if (activeSemester  && String(s.semester) !== String(activeSemester)) return false
    return true
  })

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

        {/* Semester dropdown */}
        <select
          className={selectCls}
          value={activeSemester ?? ''}
          onChange={handleSemesterChange}
        >
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>

        {/* Subject multi-select */}
        <SubjectMultiSelect
          subjects={visibleSubjects}
          selectedIds={activeSubjectIds}
          onChange={handleSubjectChange}
        />

        {/* Clear filters */}
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
