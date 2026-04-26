export function WebinarStatusBadge({ status }) {
  const config = {
    upcoming:  { label: 'Upcoming',   className: 'bg-blue-50 text-blue-700 border-blue-200' },
    live:      { label: '🔴 Live Now', className: 'bg-red-50 text-red-700 border-red-200 animate-pulse' },
    completed: { label: 'Completed',  className: 'bg-bg text-muted border-border' },
    cancelled: { label: 'Cancelled',  className: 'bg-red-50 text-red-700 border-red-200' },
  }
  const { label, className } = config[status] ?? config.upcoming
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${className}`}>
      {label}
    </span>
  )
}
