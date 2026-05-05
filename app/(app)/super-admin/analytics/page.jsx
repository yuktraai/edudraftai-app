'use client'

import { useState, useEffect } from 'react'

const TYPE_META = {
  lesson_notes:  { label: 'Lesson Notes',  icon: '📝', color: 'text-blue-700',   bg: 'bg-blue-50',   bar: 'bg-blue-500',   border: 'border-blue-200' },
  mcq_bank:      { label: 'MCQ Bank',      icon: '✅', color: 'text-purple-700', bg: 'bg-purple-50', bar: 'bg-purple-500', border: 'border-purple-200' },
  question_bank: { label: 'Question Bank', icon: '📋', color: 'text-amber-700',  bg: 'bg-amber-50',  bar: 'bg-amber-500',  border: 'border-amber-200' },
  test_plan:     { label: 'Internal Test', icon: '🗓', color: 'text-teal',       bg: 'bg-teal-light', bar: 'bg-teal',      border: 'border-teal/30' },
  exam_paper:    { label: 'Exam Paper',    icon: '📄', color: 'text-indigo-700', bg: 'bg-indigo-50',  bar: 'bg-indigo-500', border: 'border-indigo-200' },
}

const TYPE_LABELS = Object.fromEntries(Object.entries(TYPE_META).map(([k, v]) => [k, v.label]))

const RANGE_OPTIONS = [
  { value: 'month',      label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'all',        label: 'All Time' },
]

const TABS = [
  { id: 'usage',    label: 'Usage' },
  { id: 'feedback', label: 'Feedback' },
]

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return <div className={`bg-border rounded animate-pulse ${className}`} />
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, accent = false }) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? 'bg-navy border-navy/20' : 'bg-surface border-border'}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs font-medium uppercase tracking-wide ${accent ? 'text-white/60' : 'text-muted'}`}>
          {label}
        </p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${accent ? 'bg-white/10' : 'bg-bg'}`}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-bold ${accent ? 'text-white' : 'text-navy'}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? 'text-white/50' : 'text-muted'}`}>{sub}</p>}
    </div>
  )
}

// ─── Content Breakdown ────────────────────────────────────────────────────────

function ContentBreakdown({ byType, total }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-text mb-4">Platform Content Breakdown</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(TYPE_META).map(([type, meta]) => {
          const count = byType[type] ?? 0
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={type} className={`rounded-xl border ${meta.border} ${meta.bg} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{meta.icon}</span>
                <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
              </div>
              <p className={`text-2xl font-bold ${meta.color}`}>{count}</p>
              <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[10px] text-muted mt-1">{pct}% of total</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Top Colleges Chart (horizontal CSS bars) ────────────────────────────────

function TopCollegesChart({ data, metric, label }) {
  const top10    = [...data]
    .filter(c => (c[metric] ?? 0) > 0)
    .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
    .slice(0, 10)
  const maxVal   = top10[0]?.[metric] ?? 1

  if (top10.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text mb-4">Top Colleges by {label}</h2>
        <p className="text-sm text-muted text-center py-6">No data for this period.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <h2 className="text-sm font-semibold text-text mb-5">Top Colleges by {label}</h2>
      <div className="space-y-3">
        {top10.map((col, i) => {
          const val = col[metric] ?? 0
          const pct = Math.round((val / maxVal) * 100)
          return (
            <div key={col.college_id} className="flex items-center gap-3">
              <span className="w-5 text-xs font-bold text-muted text-right shrink-0">{i + 1}</span>
              <span className="w-48 text-xs font-medium text-text truncate shrink-0" title={col.college_name}>
                {col.college_name}
              </span>
              <div className="flex-1 h-2.5 bg-bg rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-teal rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 text-xs font-semibold text-navy text-right shrink-0">{val}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Usage Tab ────────────────────────────────────────────────────────────────

function UsageTab() {
  const [apiData, setApiData] = useState(null)
  const [range,   setRange]   = useState('month')
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [sortKey, setSortKey] = useState('generations')
  const [sortAsc, setSortAsc] = useState(false)
  const [metric,  setMetric]  = useState('generations')  // chart toggle

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/analytics/global?range=${range}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) setError(json.error)
        else setApiData(json)
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false))
  }, [range])

  function handleSort(key) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  const data           = apiData?.data           ?? []
  const platform_by_type = apiData?.platform_by_type ?? {}
  const totals         = apiData?.totals          ?? {}
  const totalGens      = totals.generations  ?? 0

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] ?? 0
    const bv = b[sortKey] ?? 0
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
    return sortAsc ? cmp : -cmp
  })

  const SortIcon = ({ col }) => (
    <span className="ml-1 inline-block opacity-50">
      {sortKey === col ? (sortAsc ? '↑' : '↓') : '↕'}
    </span>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <p className="text-sm text-error">{error}</p>
      </div>
    )
  }

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

      {/* ── Platform Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Colleges"    value={totals.colleges   ?? data.length} icon="🏫" />
        <StatCard label="Active Lecturers"  value={totals.lecturers  ?? 0}           icon="👨‍🏫" />
        <StatCard label="Total Generations" value={totals.generations ?? 0}          icon="📄" sub="completed" />
        <StatCard label="Credits Consumed"  value={totals.credits_used ?? 0}         icon="💳" accent />
      </div>

      {/* ── RAG Stat ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-teal/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">RAG-Assisted Generations</p>
            <div className="w-8 h-8 rounded-lg bg-teal-light flex items-center justify-center">
              <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold text-teal">{totals.rag_generations ?? 0}</p>
            {(totals.generations ?? 0) > 0 && (
              <p className="text-sm text-muted mb-1">
                ({Math.round(((totals.rag_generations ?? 0) / totals.generations) * 100)}% of all generations)
              </p>
            )}
          </div>
          <p className="text-xs text-muted mt-1">
            Content generated with reference documents from Pinecone vector store
          </p>
        </div>

        {(totals.rag_generations ?? 0) > 0 && (totals.generations ?? 0) > 0 && (
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted mb-3">RAG Adoption Rate</p>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted">RAG-assisted</span>
                <span className="text-xs font-semibold text-teal">
                  {Math.round(((totals.rag_generations ?? 0) / totals.generations) * 100)}%
                </span>
              </div>
              <div className="h-3 bg-bg rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-teal rounded-full transition-all"
                  style={{ width: `${Math.round(((totals.rag_generations ?? 0) / totals.generations) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted">Standard</span>
                <span className="text-xs font-semibold text-muted">
                  {Math.round((((totals.generations ?? 0) - (totals.rag_generations ?? 0)) / totals.generations) * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Content Breakdown ── */}
      {totalGens > 0 && (
        <ContentBreakdown byType={platform_by_type} total={totalGens} />
      )}

      {/* ── Top Colleges Charts ── */}
      {data.length > 0 && (
        <div>
          {/* Chart metric toggle */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-base font-bold text-navy">College Performance</h2>
            <div className="flex items-center gap-1 bg-bg border border-border rounded-xl p-1">
              {[
                { value: 'generations',  label: 'Generations' },
                { value: 'credits_used', label: 'Credits' },
              ].map(({ value, label }) => (
                <button key={value} onClick={() => setMetric(value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    metric === value ? 'bg-surface text-navy shadow-sm' : 'text-muted hover:text-text'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <TopCollegesChart
            data={data}
            metric={metric}
            label={metric === 'generations' ? 'Generations' : 'Credits Used'}
          />
        </div>
      )}

      {/* ── Per-College Table ── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">All Colleges Breakdown</h2>
          <span className="text-xs text-muted">{data.length} colleges</span>
        </div>

        {data.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted">No colleges found.</div>
        ) : (
          <div className="overflow-x-auto">
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
                      className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide cursor-pointer hover:text-text select-none whitespace-nowrap"
                    >
                      {label}<SortIcon col={key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map(col => {
                  const genShare = totalGens > 0 ? Math.round((col.generations / totalGens) * 100) : 0
                  return (
                    <tr key={col.college_id} className="hover:bg-bg transition-colors">
                      <td className="px-5 py-3.5 font-medium text-text max-w-xs truncate">{col.college_name}</td>
                      <td className="px-5 py-3.5 text-muted">{col.lecturers}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-navy w-8">{col.generations}</span>
                          {genShare > 0 && (
                            <div className="flex-1 h-1.5 bg-bg rounded-full overflow-hidden border border-border min-w-[48px]">
                              <div className="h-full bg-teal/60 rounded-full" style={{ width: `${genShare}%` }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-semibold ${col.credits_used > 0 ? 'text-teal' : 'text-muted'}`}>
                          {col.credits_used}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {col.top_type ? (
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                            TYPE_META[col.top_type]
                              ? `${TYPE_META[col.top_type].bg} ${TYPE_META[col.top_type].color} ${TYPE_META[col.top_type].border}`
                              : 'bg-bg text-muted border-border'
                          }`}>
                            {TYPE_META[col.top_type]?.icon} {TYPE_LABELS[col.top_type] ?? col.top_type}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr className="border-t-2 border-border bg-bg">
                  <td className="px-5 py-3 text-xs font-bold text-muted uppercase">Platform Total</td>
                  <td className="px-5 py-3 font-bold text-text">{totals.lecturers ?? 0}</td>
                  <td className="px-5 py-3 font-bold text-navy">{totals.generations ?? 0}</td>
                  <td className="px-5 py-3 font-bold text-teal">{totals.credits_used ?? 0}</td>
                  <td className="px-5 py-3 text-muted text-xs">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
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
        {[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}
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
        <p className="text-muted text-sm mt-1">Platform-wide usage, content breakdown, and feedback intelligence.</p>
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
