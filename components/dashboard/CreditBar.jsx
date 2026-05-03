// components/dashboard/CreditBar.jsx

export function CreditBar({ used, balance, demoRemaining = 0 }) {
  const total     = used + balance
  const effective = balance + demoRemaining
  const pct       = total > 0 ? Math.min(100, Math.round((balance / total) * 100)) : 0

  const variant =
    effective <= 0  ? 'danger'  :
    pct        <= 10 ? 'danger'  :
    pct        <= 30 ? 'warning' :
    'credit'

  const barColor =
    variant === 'danger'  ? 'bg-error'   :
    variant === 'warning' ? 'bg-warning'  :
    'bg-teal'

  const textColor =
    variant === 'danger'  ? 'text-error'   :
    variant === 'warning' ? 'text-warning'  :
    'text-teal'

  const bgVariant =
    variant === 'danger'  ? 'bg-red-50 border-red-200'     :
    variant === 'warning' ? 'bg-amber-50 border-amber-200'  :
    'bg-teal-light border-teal/30'

  return (
    <div className={`border rounded-2xl p-5 relative overflow-hidden ${bgVariant}`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-teal opacity-60" />

      <div className="flex items-start justify-between gap-2 mb-3 pl-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Credits Left</p>
        <div className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </div>
      </div>

      <div className="pl-3">
        <p className={`text-3xl font-bold leading-none ${textColor}`}>{effective}</p>

        {/* Consumption bar */}
        {total > 0 && (
          <div className="mt-3">
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[11px] text-muted mt-1">
              {pct}% remaining · {used} used
            </p>
          </div>
        )}

        {total === 0 && demoRemaining > 0 && (
          <p className="text-xs text-teal mt-1">{demoRemaining} demo credits</p>
        )}
        {effective <= 0 && (
          <p className="text-xs text-error mt-1">Contact admin to top up</p>
        )}
      </div>
    </div>
  )
}
