'use client'

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-navy text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold">{label}</p>
      <p className="text-teal">{payload[0].value} generations</p>
    </div>
  )
}

export function BarChart({ data = [], dataKey = 'count', xKey = 'date', color = '#00B4A6' }) {
  if (!data.length) return (
    <div className="h-40 flex items-center justify-center text-muted text-sm">No data yet.</div>
  )

  return (
    <ResponsiveContainer width="100%" height={160}>
      <ReBarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 10, fill: '#718096' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tickFormatter={v => (typeof v === 'string' && v.length > 5 ? v.slice(5) : v)}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#718096' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F4F7F6' }} />
        <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} maxBarSize={24} />
      </ReBarChart>
    </ResponsiveContainer>
  )
}
