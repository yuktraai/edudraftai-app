'use client'

import { useState, useEffect, useCallback } from 'react'

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

const TABS = [
  { id: 'usage',    label: 'Usage' },
  { id: 'feedback', label: 'Feedback' },
]

// ─── Usage Tab ───────────────────────────────────────────────────────────────

function UsageTab() {
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
    <div className="space-y-6">
      {/* Range picker */}
      <div className="flex justify-end">
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

// ─── CSS Bar component ────────────────────────────────────────────────────────

function CssBar({ pct, color = 'teal' }) {
  const bg = color === 'teal' ? 'bg-teal' : 'bg-error'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-bg rounded-full overflow-hidden border border-border">
        <div className={`h-full ${bg} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-muted w-10 text-right">{pct}%</span>
    </div>
  )
}

// ─── Feedback Tab ─────────────────────────────────────────────────────────────

function FeedbackTab() {
  const [fb,      setFb]      = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    setLoading(true)
    fetch('/api/analytics/feedback')
      .then(r => r.json())
      .then(json => {
        if (json.error) setError(json.error)
        else setFb(json.data ?? null)
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  function exportCsv() {
    if (!fb?.negative_feedback?.length) return
    const rows = [
      ['College', 'Lecturer', 'Content Type', 'Topic', 'Feedback', 'Date'],
      ...fb.negative_feedback.map(r => [
        r.college,
        r.lecturer_name,
        TYPE_LABELS[r.content_type] ?? r.content_type,
        r.topic,
        `"${(r.feedback_text ?? '').replace(/"/g, '""')}"`,
        new Date(r.created_at).toLocaleDateString('en-IN'),
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `negative-feedback-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-24 bg-border rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-error bg-surface border border-border rounded-xl p-6">{error}</div>
  }

  if (!fb) return null

  const filtered = (fb.negative_feedback ?? []).filter(r => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      r.college.toLowerCase().includes(q) ||
      r.lecturer_name.toLowerCase().includes(q) ||
      r.content_type.toLowerCase().includes(q) ||
      r.topic.toLowerCase().includes(q) ||
      (r.feedback_text ?? '').toLowerCase().includes(q)
    )
  })

  const satColor = fb.satisfaction_pct >= 70 ? 'text-success' : fb.satisfaction_pct >= 50 ? 'text-warning' : 'text-error'

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-wide">Total Ratings</p>
          <p className="text-3xl font-bold text-navy mt-1">{fb.total_rated}</p>
          <p className="text-xs text-muted mt-1">
            👍 {fb.thumbs_up_count} &nbsp;·&nbsp; 👎 {fb.thumbs_down_count}
          </p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-wide">Satisfaction Rate</p>
          <p className={`text-3xl font-bold mt-1 ${satColor}`}>{fb.satisfaction_pct}%</p>
          <p className="text-xs text-muted mt-1">Thumbs up / total ratings</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-muted uppercase tracking-wide">Needs Attention</p>
          {fb.worst_type ? (
            <>
              <p className="text-xl font-bold text-error mt-1">
                {TYPE_LABELS[fb.worst_type.type] ?? fb.worst_type.type}
              </p>
              <p className="text-xs text-muted mt-1">
                Lowest satisfaction — {fb.worst_type.pct}%
              </p>
            </>
          ) : (
            <p className="text-xl font-bold text-muted mt-1">—</p>
          )}
        </div>
      </div>

      {/* By Content Type */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Satisfaction by Content Type</h2>
        </div>
        {fb.by_content_type.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted text-center">No ratings yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {[...fb.by_content_type]
              .sort((a, b) => b.pct - a.pct)
              .map(t => (
                <div key={t.type} className="px-5 py-3 flex items-center gap-4">
                  <span className="w-32 text-sm font-medium text-text truncate">
                    {TYPE_LABELS[t.type] ?? t.type}
                  </span>
                  <div className="flex-1">
                    <CssBar pct={t.pct} color={t.pct >= 60 ? 'teal' : 'red'} />
                  </div>
                  <span className="text-xs text-muted w-24 text-right">
                    {t.up}↑ · {t.down}↓
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* By College */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Top Colleges by Rating Volume</h2>
        </div>
        {fb.by_college.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted text-center">No ratings yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {fb.by_college.map(c => (
              <div key={c.college_name} className="px-5 py-3 flex items-center gap-4">
                <span className="w-56 text-sm font-medium text-text truncate">
                  {c.college_name}
                </span>
                <div className="flex-1">
                  <CssBar pct={c.pct} color={c.pct >= 60 ? 'teal' : 'red'} />
                </div>
                <span className="text-xs text-muted w-24 text-right">
                  {c.up + c.down} ratings
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Negative Feedback Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-text">
            Negative Feedback
            {fb.thumbs_down_count > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-50 text-error rounded-full">
                {fb.thumbs_down_count}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3 py-1.5 text-xs border border-border rounded-lg bg-bg text-text focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent w-44"
            />
            <button
              onClick={exportCsv}
              disabled={!fb.negative_feedback?.length}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted hover:border-teal hover:text-teal transition-colors disabled:opacity-40"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              CSV
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted text-center">
            {fb.thumbs_down_count === 0 ? 'No negative feedback yet. 🎉' : 'No results match your search.'}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                {['College', 'Lecturer', 'Type', 'Topic', 'Comment', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r, i) => (
                <tr key={i} className="hover:bg-bg transition-colors">
                  <td className="px-4 py-3 text-text font-medium max-w-[140px] truncate">{r.college}</td>
                  <td className="px-4 py-3 text-muted">{r.lecturer_name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-bg border border-border rounded-full px-2 py-0.5 whitespace-nowrap">
                      {TYPE_LABELS[r.content_type] ?? r.content_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted max-w-[140px] truncate">{r.topic}</td>
                  <td className="px-4 py-3 text-text max-w-[200px]">
                    {r.feedback_text ? (
                      <span className="italic text-muted">&ldquo;{r.feedback_text}&rdquo;</span>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuperAdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('usage')

  return (
    <div className="p-8 max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-navy">Global Analytics</h1>
        <p className="text-muted text-sm mt-1">Cross-college usage breakdown and feedback intelligence.</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === t.id
                ? 'border-teal text-teal'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'usage'    && <UsageTab />}
      {activeTab === 'feedback' && <FeedbackTab />}
    </div>
  )
}
