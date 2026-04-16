'use client'

import { useState, useEffect } from 'react'

const TYPE_LABELS = {
  lesson_notes:  'Lesson Notes',
  mcq_bank:      'MCQ Bank',
  question_bank: 'Question Bank',
  test_plan:     'Internal Test',
}

const RANGE_OPTIONS = [
  { value: 'month',      label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'all',        label: 'All Time' },
]

export default function SuperAdminAnalyticsPage() {
  const [data,    setData]    = useState([])
  const [range,   setRange]   = useState('month')
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [sortKey, setSortKey] = useState('generations')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/analytics/global?range=${range}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) setError(json.error)
        else setData(json.data ?? [])
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false))
  }, [range])

  function handleSort(key) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] ?? 0
    const bv = b[sortKey] ?? 0
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
    return sortAsc ? cmp : -cmp
  })

  const totals = data.reduce((acc, col) => ({
    generations:  acc.generations  + (col.generations ?? 0),
    credits_used: acc.credits_used + (col.credits_used ?? 0),
    lecturers:    acc.lecturers    + (col.lecturers    ?? 0),
  }), { generations: 0, credits_used: 0, lecturers: 0 })

  const SortIcon = ({ col }) => (
    <span className="ml-1 inline-block opacity-50">
      {sortKey === col ? (sortAsc ? '↑' : '↓') : '↕'}
    </span>
  )

  return (
    <div className="p-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Global Analytics</h1>
          <p className="text-muted text-sm mt-1">Cross-college usage breakdown across all institutions.</p>
        </div>
        <div className="flex items-center gap-1 bg-bg border border-border rounded-xl p-1">
          {RANGE_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => setRange(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                range === value ? 'bg-surface text-navy shadow-sm' : 'text-muted hover:text-text'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary totals */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Colleges',    value: data.length },
            { label: 'Total Generations', value: totals.generations },
            { label: 'Total Credits Used', value: totals.credits_used },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-5">
              <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
              <p className="text-3xl font-bold text-navy mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Per-College Breakdown</h2>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-10 bg-border rounded animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="px-5 py-6 text-sm text-error">{error}</div>
        ) : data.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted">No colleges found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                {[
                  { key: 'college_name', label: 'College' },
                  { key: 'lecturers',    label: 'Lecturers' },
                  { key: 'generations',  label: 'Generations' },
                  { key: 'credits_used', label: 'Credits Used' },
                  { key: 'top_type',     label: 'Top Content' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide cursor-pointer hover:text-text select-none"
                  >
                    {label}<SortIcon col={key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map(col => (
                <tr key={col.college_id} className="hover:bg-bg transition-colors">
                  <td className="px-5 py-3.5 font-medium text-text">{col.college_name}</td>
                  <td className="px-5 py-3.5 text-muted">{col.lecturers}</td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-navy">{col.generations}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`font-semibold ${col.credits_used > 0 ? 'text-teal' : 'text-muted'}`}>
                      {col.credits_used}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {col.top_type ? (
                      <span className="text-xs bg-bg border border-border rounded-full px-2.5 py-1">
                        {TYPE_LABELS[col.top_type] ?? col.top_type}
                      </span>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
