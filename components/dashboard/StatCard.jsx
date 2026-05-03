// components/dashboard/StatCard.jsx

export function StatCard({ label, value, sub, icon, variant = 'default', trend, trendLabel }) {
  const variants = {
    default: 'bg-surface border-border',
    credit:  'bg-teal-light border-teal/30',
    warning: 'bg-amber-50 border-amber-200',
    danger:  'bg-red-50 border-red-200',
  }
  const valueColors = {
    default: 'text-navy',
    credit:  'text-teal',
    warning: 'text-warning',
    danger:  'text-error',
  }

  return (
    <div className={`border rounded-2xl p-5 relative overflow-hidden ${variants[variant]}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      {/* Left accent bar */}
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-teal opacity-60" />

      <div className="flex items-start justify-between gap-2 mb-3 pl-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide leading-tight">{label}</p>
        <div className="w-8 h-8 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>

      <div className="pl-3">
        <p className={`text-3xl font-bold leading-none ${valueColors[variant]}`}>{value}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {sub && <p className="text-xs text-muted">{sub}</p>}
          {trend !== undefined && (
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
              trend > 0 ? 'bg-green-100 text-success' :
              trend < 0 ? 'bg-red-100 text-error' :
              'bg-bg text-muted'
            }`}>
              {trend > 0 ? `+${trend}` : trend} {trendLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
