'use client'

/**
 * Phase 53 — Super Admin Analytics: Professional Dashboard Redesign
 * Recharts (already installed) for trend line + donut; no CDN dependency.
 */

import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_META = {
  lesson_notes:  { label: 'Lesson Notes',  icon: '📝', color: '#00B4A6', tailwind: 'text-teal',       bg: 'bg-teal-light',   border: 'border-teal/30'    },
  mcq_bank:      { label: 'MCQ Bank',      icon: '✅', color: '#6366F1', tailwind: 'text-indigo-600', bg: 'bg-indigo-50',    border: 'border-indigo-200' },
  question_bank: { label: 'Question Bank', icon: '📋', color: '#F59E0B', tailwind: 'text-amber-600',  bg: 'bg-amber-50',     border: 'border-amber-200'  },
  test_plan:     { label: 'Internal Test', icon: '🗓', color: '#10B981', tailwind: 'text-emerald-600', bg: 'bg-emerald-50',   border: 'border-emerald-200'},
  exam_paper:    { label: 'Exam Paper',    icon: '📄', color: '#EF4444', tailwind: 'text-red-600',     bg: 'bg-red-50',       border: 'border-red-200'    },
}

const RANGE_OPTIONS = [
  { value: 'month',      label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'all',        label: 'All Time'   },
]

const TABS = [
  { id: 'usage',    label: 'Usage'    },
  { id: 'feedback', label: 'Feedback' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delta(current, previous) {
  if (previous == null) return null
  if (previous === 0 && current === 0) return { pct: 0, dir: 'flat' }
  if (previous === 0) return { pct: null, dir: 'new' }
  const pct = Math.round(((current - previous) / previous) * 100)
  return { pct, dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' }
}

function DeltaBadge({ d }) {
  if (!d) return null
  if (d.dir === 'new') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-light text-teal">New</span>
  )
  if (d.dir === 'flat') return (
    <span className="text-xs text-muted">— same as before</span>
  )
  const positive = d.dir === 'up'
  const arrow    = positive ? '↑' : '↓'
  const cls      = positive ? 'text-success' : 'text-error'
  return (
    <span className={`text-xs font-semibold ${cls}`}>
      {arrow} {Math.abs(d.pct)}% vs previous
    </span>
  )
}

function Skeleton({ className = '' }) {
  return <div className={`bg-border rounded animate-pulse ${className}`} />
}

function exportCsv(headers, rows, filename) {
  const lines = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob  = new Blob([lines], { type: 'text/csv' })
  const url   = URL.createObjectURL(blob)
  const a     = document.createElement('a')
  a.href      = url
  a.download  = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, d, sub }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center text-base">{icon}</div>
      </div>
      <p className="text-3xl font-bold text-navy mb-1">{value ?? 0}</p>
      {d ? <DeltaBadge d={d} /> : sub ? <p className="text-xs text-muted">{sub}</p> : null}
    </div>
  )
}

// ─── Rank Badge ──────────────────────────────────────────────────────────────

function RankBadge({ rank }) {
  if (rank === 1) return <span className="w-6 h-6 rounded-full bg-teal text-white text-xs font-bold flex items-center justify-center">1</span>
  if (rank === 2) return <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center">2</span>
  if (rank === 3) return <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-700 text-xs font-bold flex items-center justify-center">3</span>
  return <span className="w-6 text-xs text-muted text-center">{rank}</span>
}

// ─── Trend Chart (recharts) ────────────────────────────────────────────────────

function TrendChart({ trend }) {
  if (!trend?.labels?.length) {
    return (
      <div className="h-48 flex items-center justify-center">
        <p className="text-sm text-muted">No generation data for this period.</p>
      </div>
    )
  }

  const chartData = trend.labels.map((label, i) => ({ label, value: trend.values[i] ?? 0 }))

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#718096' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#718096' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
            formatter={(v) => [v, 'Generations']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#00B4A6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#00B4A6', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Donut Chart (recharts) ───────────────────────────────────────────────────

function DonutChart({ breakdown }) {
  const active = breakdown.filter(b => b.count > 0)
  if (!active.length) return null

  return (
    <div className="h-40 w-40 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={active}
            dataKey="count"
            nameKey="type"
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="85%"
            paddingAngle={2}
          >
            {active.map(b => (
              <Cell key={b.type} fill={TYPE_META[b.type]?.color ?? '#718096'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
            formatter={(v, name) => [v, TYPE_META[name]?.label ?? name]}
          />
        </PieChart>
      </ResponsiveContainer>
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

  function handleExportCsv() {
    if (!fb?.negative_feedback?.length) return
    const headers = ['College', 'Lecturer', 'Content Type', 'Topic', 'Comment', 'Date']
    const rows = fb.negative_feedback.map(r => [
      `"${r.college}"`,
      `"${r.lecturer_name}"`,
      TYPE_META[r.content_type]?.label ?? r.content_type,
      `"${r.topic}"`,
      `"${(r.feedback_text ?? '').replace(/"/g, '""')}"`,
      new Date(r.created_at).toLocaleDateString('en-IN'),
    ])
    exportCsv(headers, rows, `negative-feedback-${new Date().toISOString().slice(0,10)}.csv`)
  }

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
  if (error)   return <div className="text-sm text-error bg-surface border border-border rounded-xl p-6">{error}</div>
  if (!fb)     return null

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
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Total Ratings</p>
          <p className="text-3xl font-bold text-navy">{fb.total_rated}</p>
          <p className="text-xs text-muted mt-1">👍 {fb.thumbs_up_count} &nbsp;·&nbsp; 👎 {fb.thumbs_down_count}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Satisfaction Rate</p>
          <p className={`text-3xl font-bold mt-1 ${satColor}`}>{fb.satisfaction_pct}%</p>
          <p className="text-xs text-muted mt-1">Thumbs up / total ratings</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Needs Attention</p>
          {fb.worst_type ? (
            <>
              <p className="text-xl font-bold text-error mt-1">{TYPE_META[fb.worst_type.type]?.label ?? fb.worst_type.type}</p>
              <p className="text-xs text-muted mt-1">Lowest satisfaction — {fb.worst_type.pct}%</p>
            </>
          ) : (
            <p className="text-xl font-bold text-muted mt-1">—</p>
          )}
        </div>
      </div>

      {/* Satisfaction by Content Type */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Satisfaction by Content Type</h2>
        </div>
        <div className="divide-y divide-border">
          {Object.entries(TYPE_META).map(([type, meta]) => {
            const row = fb.by_content_type?.find(t => t.type === type)
            const up   = row?.up ?? 0
            const down = row?.down ?? 0
            const pct  = row?.pct ?? 0
            return (
              <div key={type} className="px-5 py-3.5 flex items-center gap-4">
                <span className="text-base shrink-0">{meta.icon}</span>
                <span className="w-32 text-sm font-medium text-text">{meta.label}</span>
                <div className="flex-1 h-2.5 bg-bg rounded-full overflow-hidden border border-border">
                  {up + down > 0 && (
                    <div className={`h-full rounded-full ${pct >= 60 ? 'bg-teal' : 'bg-error'}`} style={{ width: `${pct}%` }} />
                  )}
                </div>
                <span className="w-10 text-xs font-semibold text-navy text-right">{up + down > 0 ? `${pct}%` : '—'}</span>
                <span className="text-xs text-muted w-20 text-right">👍 {up} · 👎 {down}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Colleges by Rating */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Top Colleges by Rating Volume</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg">
              {['College', 'Ratings', 'Satisfaction', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {fb.by_college?.length > 0 ? fb.by_college.map(c => (
              <tr key={c.college_name} className="hover:bg-bg transition-colors">
                <td className="px-5 py-3 font-medium text-text">{c.college_name}</td>
                <td className="px-5 py-3 text-muted">{c.up + c.down}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-bg rounded-full overflow-hidden border border-border">
                      <div className={`h-full rounded-full ${c.pct >= 60 ? 'bg-teal' : 'bg-error'}`} style={{ width: `${c.pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-navy">{c.pct}%</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-muted">👍 {c.up} · 👎 {c.down}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">No ratings yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Negative Feedback */}
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
              onClick={handleExportCsv}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg">
                  {['College', 'Lecturer', 'Type', 'Topic', 'Comment', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r, i) => {
                  const topMeta = TYPE_META[r.content_type]
                  return (
                    <tr key={i} className="hover:bg-bg transition-colors">
                      <td className="px-4 py-3 font-medium text-text max-w-[120px] truncate">{r.college}</td>
                      <td className="px-4 py-3 text-muted">{r.lecturer_name}</td>
                      <td className="px-4 py-3">
                        {topMeta ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${topMeta.bg} ${topMeta.tailwind} ${topMeta.border}`}>
                            {topMeta.icon} {topMeta.label}
                          </span>
                        ) : (
                          <span className="text-xs bg-bg border border-border rounded-full px-2 py-0.5">{r.content_type}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted max-w-[140px] truncate">{r.topic}</td>
                      <td className="px-4 py-3 text-text max-w-[200px]">
                        {r.feedback_text
                          ? <span className="italic text-muted">&ldquo;{r.feedback_text}&rdquo;</span>
                          : <span className="text-muted text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SuperAdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('usage')
  const [range,     setRange]     = useState('month')

  return (
    <div className="p-8 max-w-6xl space-y-6">
      {/* Header + Range picker */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Global Analytics</h1>
          <p className="text-muted text-sm mt-1">Platform-wide usage, content breakdown, and feedback intelligence.</p>
        </div>
        <div className="flex items-center gap-1 bg-bg border border-border rounded-xl p-1">
          {RANGE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                range === value ? 'bg-surface text-navy shadow-sm' : 'text-muted hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
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
      {activeTab === 'usage'    && <UsageTabWithContext range={range} />}
      {activeTab === 'feedback' && <FeedbackTab />}
    </div>
  )
}

function UsageTabWithContext({ range }) {
  const [apiData, setApiData] = useState(null)
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
        else setApiData(json)
      })
      .catch(() => setError('Network error. Please try again.'))
      .finally(() => setLoading(false))
  }, [range])

  function handleSort(key) {
    if (sortKey === key) setSortAsc(a => !a)
    else { setSortKey(key); setSortAsc(false) }
  }

  const summary         = apiData?.summary          ?? {}
  const breakdown       = apiData?.breakdown        ?? []
  const trend           = apiData?.trend            ?? { labels: [], values: [] }
  const colleges        = apiData?.colleges         ?? []
  const needs_attention = apiData?.needs_attention  ?? []
  const ragCount        = summary.rag_generations   ?? 0
  const totalGens       = summary.generations?.current ?? 0

  const sorted = [...colleges].sort((a, b) => {
    const av = a[sortKey] ?? 0
    const bv = b[sortKey] ?? 0
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
    return sortAsc ? cmp : -cmp
  })
  const maxGens = sorted.length > 0 ? Math.max(...sorted.map(c => c.generations)) : 1

  function handleExportCsv() {
    const headers = ['Rank', 'College', 'Departments', 'Lecturers', 'Generations', 'Credits Used', 'Top Content']
    const rows = sorted.map((c, i) => [
      i + 1, `"${c.college_name}"`, c.departments, c.lecturers, c.generations, c.credits_used,
      TYPE_META[c.top_type]?.label ?? c.top_type ?? '—',
    ])
    exportCsv(headers, rows, `college-analytics-${range}-${new Date().toISOString().slice(0,10)}.csv`)
  }

  const SortIcon = ({ col }) => (
    <span className="ml-1 opacity-40">{sortKey === col ? (sortAsc ? '↑' : '↓') : '↕'}</span>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
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

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Colleges"
          value={summary.colleges?.current ?? colleges.length}
          icon="🏫"
          d={delta(summary.colleges?.current, summary.colleges?.previous)}
        />
        <KpiCard
          label="Active Lecturers"
          value={summary.lecturers?.current ?? 0}
          icon="👨‍🏫"
          sub="currently active"
        />
        <KpiCard
          label="Generations"
          value={summary.generations?.current ?? 0}
          icon="📄"
          d={range !== 'all' ? delta(summary.generations?.current, summary.generations?.previous) : null}
          sub={range === 'all' ? 'all time' : null}
        />
        <KpiCard
          label="Credits Used"
          value={summary.credits_used?.current ?? 0}
          icon="💳"
          d={range !== 'all' ? delta(summary.credits_used?.current, summary.credits_used?.previous) : null}
        />
      </div>

      {/* ── RAG Stat ── */}
      {totalGens > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface border border-teal/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">RAG-Assisted Generations</p>
              <div className="w-8 h-8 rounded-lg bg-teal-light flex items-center justify-center">
                <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                </svg>
              </div>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-teal">{ragCount}</p>
              <p className="text-sm text-muted mb-1">({Math.round((ragCount / totalGens) * 100)}% of generations)</p>
            </div>
            <div className="mt-3 h-2 bg-bg rounded-full overflow-hidden border border-border">
              <div className="h-full bg-teal rounded-full" style={{ width: `${Math.round((ragCount / totalGens) * 100)}%` }} />
            </div>
            <p className="text-xs text-muted mt-1.5">Content generated using Pinecone vector reference docs</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-4">RAG vs Standard</p>
            {[
              { label: 'RAG-Assisted', count: ragCount,             color: 'bg-teal' },
              { label: 'Standard',     count: totalGens - ragCount,  color: 'bg-border' },
            ].map(row => (
              <div key={row.label} className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted font-medium">{row.label}</span>
                  <span className="font-semibold text-navy">{row.count}</span>
                </div>
                <div className="h-2.5 bg-bg rounded-full overflow-hidden border border-border">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${totalGens > 0 ? Math.round((row.count / totalGens) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Generation Trend ── */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text mb-4">Generation Trend</h2>
        <TrendChart trend={trend} />
      </div>

      {/* ── Content Mix ── */}
      {totalGens > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col items-center justify-center gap-4">
            <h2 className="text-sm font-semibold text-text self-start">Content Mix</h2>
            <DonutChart breakdown={breakdown} />
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
              {breakdown.filter(b => b.count > 0).map(b => (
                <div key={b.type} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: TYPE_META[b.type]?.color ?? '#718096' }} />
                  <span className="text-xs text-muted">{TYPE_META[b.type]?.label ?? b.type}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text mb-4">By Content Type</h2>
            <div className="space-y-3">
              {breakdown.map((b, i) => {
                const meta = TYPE_META[b.type]
                return (
                  <div key={b.type} className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-muted text-right shrink-0">{i + 1}</span>
                    <span className="text-lg shrink-0">{meta?.icon ?? '📄'}</span>
                    <span className="w-32 text-xs font-medium text-text shrink-0">{meta?.label ?? b.type}</span>
                    <div className="flex-1 h-2.5 bg-bg rounded-full overflow-hidden border border-border">
                      <div className="h-full rounded-full" style={{ width: `${b.pct}%`, backgroundColor: meta?.color ?? '#718096' }} />
                    </div>
                    <span className="w-14 text-right shrink-0">
                      <span className="text-xs font-semibold text-navy">{b.count}</span>
                      <span className="text-[10px] text-muted ml-1">{b.pct}%</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── College Performance Table ── */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">
            College Performance
            <span className="ml-2 text-xs text-muted font-normal">{colleges.length} colleges</span>
          </h2>
          <button
            onClick={handleExportCsv}
            disabled={colleges.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted hover:border-teal hover:text-teal transition-colors disabled:opacity-40"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        </div>
        {colleges.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted">No colleges found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide w-10">#</th>
                  {[
                    { key: 'college_name', label: 'College'     },
                    { key: 'departments',  label: 'Depts'       },
                    { key: 'lecturers',    label: 'Lecturers'   },
                    { key: 'generations',  label: 'Generations' },
                    { key: 'credits_used', label: 'Credits'     },
                    { key: 'top_type',     label: 'Top Type'    },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide cursor-pointer hover:text-text select-none whitespace-nowrap"
                    >
                      {label}<SortIcon col={key} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((col, i) => {
                  const genPct = maxGens > 0 ? Math.round((col.generations / maxGens) * 100) : 0
                  const topMeta = TYPE_META[col.top_type]
                  return (
                    <tr key={col.college_id} className="hover:bg-bg transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex justify-center"><RankBadge rank={i + 1} /></div>
                      </td>
                      <td className="px-4 py-3 font-medium text-text max-w-[200px] truncate">{col.college_name}</td>
                      <td className="px-4 py-3 text-muted text-center">{col.departments}</td>
                      <td className="px-4 py-3 text-muted text-center">{col.lecturers}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="flex-1 h-2 bg-bg rounded-full overflow-hidden border border-border">
                            <div className="h-full bg-teal rounded-full" style={{ width: `${genPct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-navy w-7 text-right">{col.generations}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold text-sm ${col.credits_used > 0 ? 'text-teal' : 'text-muted'}`}>
                          {col.credits_used}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {topMeta ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${topMeta.bg} ${topMeta.tailwind} ${topMeta.border}`}>
                            {topMeta.icon} {topMeta.label}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-bg">
                  <td className="px-4 py-3 text-xs font-bold text-muted uppercase" colSpan={2}>Platform Total</td>
                  <td className="px-4 py-3 font-bold text-text text-center">{colleges.reduce((s,c) => s + c.departments, 0)}</td>
                  <td className="px-4 py-3 font-bold text-text text-center">{summary.lecturers?.current ?? 0}</td>
                  <td className="px-4 py-3 font-bold text-navy">{totalGens}</td>
                  <td className="px-4 py-3 font-bold text-teal">{summary.credits_used?.current ?? 0}</td>
                  <td className="px-4 py-3 text-muted text-xs">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Needs Attention ── */}
      {range !== 'all' && (
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text mb-4">Needs Attention</h2>
          {needs_attention.length === 0 ? (
            <div className="flex items-center gap-2 text-success">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">All colleges are active this period — no issues detected.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {needs_attention.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-warning shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-text">{item.name}</p>
                      <p className="text-xs text-warning">No content generated this period</p>
                    </div>
                  </div>
                  <a
                    href={`/super-admin/colleges/${item.id}`}
                    className="text-xs font-semibold text-teal hover:underline whitespace-nowrap"
                  >
                    View College →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
