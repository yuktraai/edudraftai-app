import Link from 'next/link'
import { WebinarStatusBadge } from './WebinarStatusBadge'

export function WebinarCard({ webinar }) {
  const formattedDate = new Date(webinar.date).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const isRegisterable = ['upcoming', 'live'].includes(webinar.status)

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 hover:border-teal hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-4 mb-3">
        <WebinarStatusBadge status={webinar.status} />
        <span className="text-xs text-muted">{webinar.duration_mins} min</span>
      </div>
      <h3 className="font-heading text-lg font-bold text-navy mb-1">{webinar.title}</h3>
      {webinar.tagline && <p className="text-sm text-muted mb-3">{webinar.tagline}</p>}
      <div className="flex items-center gap-2 text-xs text-muted mb-4">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
        </svg>
        {formattedDate} · {webinar.time_ist} IST
      </div>
      <Link
        href={`/webinar/${webinar.slug}`}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          isRegisterable
            ? 'bg-teal text-white hover:opacity-90'
            : 'bg-bg text-muted border border-border cursor-default'
        }`}
      >
        {isRegisterable ? 'Register Free →' : 'View Details'}
      </Link>
    </div>
  )
}
