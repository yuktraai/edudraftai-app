'use client'

import {
  LineChart as ReLineChart,
  Line,
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
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export function LineChart({ data = [], lines = [], xKey = 'date' }) {
  // lines: [{ dataKey, color, name }]
  if (!data.length) return (
    <div className="h-40 flex items-center justify-center text-muted text-sm">No data yet.</div>
  )

  return (
    <ResponsiveContainer width="100%" height={160}>
      <ReLineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
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
        <Tooltip content={<CustomTooltip />} />
        {lines.map(({ dataKey, color = '#00B4A6', name }) => (
          <Line
            key={dataKey}
            type="monotone"
            dataKey={dataKey}
            name={name ?? dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  )
}
