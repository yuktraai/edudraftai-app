'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BarChart }   from '@/components/admin/charts/BarChart'
import { DonutChart } from '@/components/admin/charts/DonutChart'

const TYPE_META = {
  lesson_notes:  { label: 'Lesson Notes',  color: '#1A3461' },
  mcq_bank:      { label: 'MCQ Bank',      color: '#00B4A6' },
  question_bank: { label: 'Question Bank', color: '#38A169' },
  test_plan:     { label: 'Internal Test', color: '#DD6B20' },
}

export default function AdminDashboardPage() {
  const [data,    setData]    = useState(null)
  const [range,   setRange]   = useState('month')
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

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
        {/* Range selector */}
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
      </div>

      {loading ? (
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
      )}
    </div>
  )
}
