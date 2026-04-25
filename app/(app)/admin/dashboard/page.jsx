'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart }   from '@/components/admin/charts/BarChart'
import { DonutChart } from '@/components/admin/charts/DonutChart'

// ---------------------------------------------------------------------------
// DepartmentsTab — department-wise analytics with CSV export
// ---------------------------------------------------------------------------
function DepartmentsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/analytics/departments')
      .then(r => r.json())
      .then(json => {
        if (json.error) setError(json.error)
        else setData(json)
      })
      .catch(() => setError('Failed to load department analytics'))
      .finally(() => setLoading(false))
  }, [])

  function exportCSV() {
    if (!data) return
    const rows = [
      ['Department', 'Code', 'Generations', 'Credits Used'],
      ...data.by_department.map(d => [d.dept_name, d.dept_code, d.total_generations, d.credits_used]),
      [],
      ['Top Subjects'],
      ['Subject', 'Code', 'Semester', 'Generations'],
      ...data.top_subjects.map(s => [s.subject_name, s.subject_code ?? '', s.semester ?? '', s.generation_count]),
      [],
      ['Top Lecturers'],
      ['Name', 'Email', 'Generations', 'Last Active'],
      ...data.top_lecturers.map(l => [
        l.name ?? '',
        l.email ?? '',
        l.generation_count,
        l.last_active ? new Date(l.last_active).toLocaleDateString('en-IN') : '',
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'department-report.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="h-48 bg-border rounded-xl animate-pulse mt-4" />
  if (error) return (
    <div className="text-sm text-error bg-red-50 border border-red-200 rounded-xl px-5 py-4 mt-4">{error}</div>
  )
  if (!data) return null

  const maxGens = Math.max(...(data.by_department.map(d => d.total_generations)), 1)

  return (
    <div className="space-y-6 mt-4">
      {/* Export button */}
      <div className="flex justify-end">
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-navy border border-navy/20 rounded-xl bg-navy/5 hover:bg-navy/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export Report (CSV)
        </button>
      </div>

      {/* Department bar chart */}
      <div className="bg-surface border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-text mb-4">Generations by Department</h2>
        {data.by_department.length === 0 ? (
          <p className="text-sm text-muted">No department data yet.</p>
        ) : (
          <div className="space-y-3">
            {[...data.by_department]
              .sort((a, b) => b.total_generations - a.total_generations)
              .map(dept => (
                <div key={dept.dept_id ?? dept.dept_code} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-muted truncate shrink-0" title={dept.dept_name}>
                    {dept.dept_code || dept.dept_name}
                  </div>
                  <div className="flex-1 bg-bg rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-teal rounded-full transition-all"
                      style={{ width: `${(dept.total_generations / maxGens) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-navy w-8 text-right shrink-0">
                    {dept.total_generations}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Top subjects table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Top Subjects by Activity</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">#</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Subject</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wide">Sem</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wide">Generations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.top_subjects.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-6 text-center text-muted text-sm">No data yet.</td></tr>
            ) : data.top_subjects.map((s, i) => (
              <tr key={i} className="hover:bg-bg transition-colors">
                <td className="px-5 py-3.5 text-muted text-xs">{i + 1}</td>
                <td className="px-5 py-3.5 font-medium text-text">{s.subject_name}</td>
                <td className="px-5 py-3.5 text-center text-muted text-xs">{s.semester ?? '—'}</td>
                <td className="px-5 py-3.5 text-right font-semibold text-teal">{s.generation_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top lecturers */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Most Active Lecturers</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg">
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">#</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Name</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Last Active</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wide">Generations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.top_lecturers.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-6 text-center text-muted text-sm">No data yet.</td></tr>
            ) : data.top_lecturers.map((l, i) => (
              <tr key={i} className="hover:bg-bg transition-colors">
                <td className="px-5 py-3.5 text-muted text-xs">{i + 1}</td>
                <td className="px-5 py-3.5 font-medium text-text">{l.name ?? l.email}</td>
                <td className="px-5 py-3.5 text-muted text-xs">
                  {l.last_active
                    ? new Date(l.last_active).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—'}
                </td>
                <td className="px-5 py-3.5 text-right font-semibold text-teal">{l.generation_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

const TYPE_META = {
  lesson_notes:  { label: 'Lesson Notes',  color: '#1A3461' },
  mcq_bank:      { label: 'MCQ Bank',      color: '#00B4A6' },
  question_bank: { label: 'Question Bank', color: '#38A169' },
  test_plan:     { label: 'Internal Test', color: '#DD6B20' },
}

export default function AdminDashboardPage() {
  const [data,      setData]      = useState(null)
  const [range,     setRange]     = useState('month')
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/analytics/summary?range=${range}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) setError(json.error)
        else setData(json)
      })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [range])

  const rangeLabel = range === 'month' ? 'This month' : range === 'last_month' ? 'Last month' : 'All time'

  // Prepare donut data from by_type
  const donutData = data
    ? Object.entries(TYPE_META).map(([type, meta]) => {
        const count = data.by_type?.[type] ?? 0
        const total = data.total_generations || 1
        return { name: meta.label, value: count, pct: Math.round((count / total) * 100), color: meta.color }
      }).filter(d => d.value > 0)
    : []

  return (
    <div className="p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Dashboard</h1>
          <p className="text-muted text-sm mt-1">Usage analytics for your college.</p>
        </div>
        {/* Range selector — only visible on overview tab */}
        {activeTab === 'overview' && (
          <div className="flex items-center gap-1 bg-bg border border-border rounded-xl p-1">
            {[
              { value: 'month',      label: 'This Month' },
              { value: 'last_month', label: 'Last Month' },
              { value: 'all',        label: 'All Time' },
            ].map(({ value, label }) => (
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
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {[
          { key: 'overview',    label: 'Overview' },
          { key: 'departments', label: 'Departments' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-teal text-teal'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'departments' && <DepartmentsTab />}

      {activeTab === 'overview' && (loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-border rounded-xl animate-pulse" />)}
          </div>
          <div className="h-48 bg-border rounded-xl animate-pulse" />
        </div>
      ) : error ? (
        <div className="text-sm text-error bg-red-50 border border-red-200 rounded-xl px-5 py-4">{error}</div>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-xs text-muted uppercase tracking-wide">Total Generations</p>
              <p className="text-3xl font-bold text-navy mt-1">{data.total_generations}</p>
              <p className="text-xs text-muted mt-1">{rangeLabel}</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-xs text-muted uppercase tracking-wide">Credits Used</p>
              <p className="text-3xl font-bold text-navy mt-1">{data.total_credits_used}</p>
              <p className="text-xs text-muted mt-1">{rangeLabel}</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5 col-span-2 lg:col-span-1">
              <p className="text-xs text-muted uppercase tracking-wide">Avg per Day</p>
              <p className="text-3xl font-bold text-navy mt-1">
                {data.daily_counts?.length
                  ? (data.total_generations / 30).toFixed(1)
                  : '—'}
              </p>
              <p className="text-xs text-muted mt-1">last 30 days</p>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Bar chart — daily generations */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-text mb-4">Generations — Last 30 Days</h2>
              <BarChart data={data.daily_counts ?? []} dataKey="count" xKey="date" />
            </div>

            {/* Donut chart — by content type */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-text mb-2">Content Type Mix</h2>
              <DonutChart data={donutData} />
            </div>
          </div>

          {/* Top lecturers */}
          {data.top_lecturers?.length > 0 && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text">Top Lecturers</h2>
                <span className="text-xs text-muted">{rangeLabel}</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">#</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Name</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wide">Generations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.top_lecturers.map((lec, i) => (
                    <tr key={lec.user_id} className="hover:bg-bg transition-colors">
                      <td className="px-5 py-3.5 text-muted text-xs">{i + 1}</td>
                      <td className="px-5 py-3.5 font-medium text-text">{lec.name}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-semibold text-teal">{lec.count}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Manage Lecturers', href: '/admin/users',      desc: 'Invite, deactivate, view users' },
              { label: 'Departments',      href: '/admin/departments', desc: 'Add and manage departments' },
              { label: 'Credits',          href: '/admin/credits',     desc: 'Grant and track credits' },
            ].map(({ label, href, desc }) => (
              <Link
                key={href}
                href={href}
                className="group block bg-surface border border-border rounded-xl p-5 hover:border-teal transition-all"
              >
                <p className="font-semibold text-navy group-hover:text-teal transition-colors">{label}</p>
                <p className="text-muted text-xs mt-1">{desc}</p>
              </Link>
            ))}
          </div>
        </>
      ))}
    </div>
  )
}
