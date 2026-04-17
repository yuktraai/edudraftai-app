'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const COLORS = ['#00B4A6', '#1A3461', '#38A169', '#DD6B20']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-navy text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold">{item.name}</p>
      <p className="text-teal">{item.value} ({item.payload.pct}%)</p>
    </div>
  )
}

const renderLegend = ({ payload }) => (
  <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
    {payload.map((entry, i) => (
      <li key={i} className="flex items-center gap-1.5 text-xs text-muted">
        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
        {entry.value}
      </li>
    ))}
  </ul>
)

export function DonutChart({ data = [] }) {
  // data: [{ name, value, pct }]
  if (!data.length || data.every(d => d.value === 0)) return (
    <div className="h-40 flex items-center justify-center text-muted text-sm">No data yet.</div>
  )

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={48}
          outerRadius={72}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  )
}
