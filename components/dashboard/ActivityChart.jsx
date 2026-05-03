'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const TYPE_COLORS = {
  lesson_notes:  '#00B4A6',
  mcq_bank:      '#1A3461',
  question_bank: '#DD6B20',
  test_plan:     '#38A169',
  exam_paper:    '#6366f1',
}

const TYPE_LABELS = {
  lesson_notes:  'Lesson Notes',
  mcq_bank:      'MCQ Bank',
  question_bank: 'Question Bank',
  test_plan:     'Internal Test',
  exam_paper:    'Exam Paper',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  if (total === 0) return null
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg px-4 py-3 text-xs min-w-[140px]">
      <p className="font-semibold text-navy mb-1.5">{label}</p>
      {payload.filter(p => p.value > 0).map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 mb-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill }} />
            <span className="text-muted">{TYPE_LABELS[p.dataKey] ?? p.dataKey}</span>
          </span>
          <span className="font-semibold text-navy">{p.value}</span>
        </div>
      ))}
      <div className="border-t border-border mt-1.5 pt-1.5 flex justify-between">
        <span className="text-muted">Total</span>
        <span className="font-bold text-navy">{total}</span>
      </div>
    </div>
  )
}

function formatXLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function ActivityChart() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/activity')
      .then(r => r.json())
      .then(j => setData(j.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [])

  const hasActivity = data?.some(d => d.total > 0)

  // Show only every 5th date label to avoid crowding
  const tickFormatter = (val, idx) => (idx % 5 === 0 ? formatXLabel(val) : '')

  return (
    <div className="bg-surface border border-border rounded-2xl p-5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-navy">Generation Activity</h2>
          <p className="text-xs text-muted mt-0.5">Last 30 days</p>
        </div>
        {hasActivity && (
          <div className="flex flex-wrap gap-3">
            {Object.entries(TYPE_LABELS).map(([key, label]) => (
              <span key={key} className="flex items-center gap-1 text-[11px] text-muted">
                <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[key] }} />
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="h-40 bg-border/40 rounded-xl animate-pulse" />
      )}

      {!loading && !hasActivity && (
        <div className="h-40 flex flex-col items-center justify-center gap-2">
          <svg className="w-8 h-8 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <p className="text-xs text-muted text-center">Start generating to see your activity chart</p>
        </div>
      )}

      {!loading && hasActivity && (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} barSize={6} barGap={1}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={tickFormatter}
              tick={{ fontSize: 11, fill: '#718096' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#718096' }}
              tickLine={false}
              axisLine={false}
              width={24}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,180,166,0.06)' }} />
            {Object.entries(TYPE_COLORS).map(([key, color]) => (
              <Bar key={key} dataKey={key} stackId="a" fill={color} radius={key === 'exam_paper' ? [3,3,0,0] : [0,0,0,0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
