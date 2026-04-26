import { adminSupabase } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { WebinarStatusBadge } from '@/components/webinar/WebinarStatusBadge'
import { CountdownTimer } from '@/components/webinar/CountdownTimer'
import { RegistrationForm } from '@/components/webinar/RegistrationForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { data } = await adminSupabase
    .from('webinars')
    .select('title,tagline')
    .eq('slug', params.slug)
    .single()
  if (!data) return { title: 'Webinar — EduDraftAI' }
  return { title: `${data.title} — EduDraftAI`, description: data.tagline }
}

function buildISTDatetime(date, timeIST) {
  // Parse timeIST like "8:00 PM" or "10:30 AM"
  const [time, meridiem] = timeIST.split(' ')
  let [h, m] = time.split(':').map(Number)
  if (meridiem === 'PM' && h !== 12) h += 12
  if (meridiem === 'AM' && h === 12) h = 0
  // Build UTC equivalent: IST = UTC+5:30
  let utcH = h - 5
  let utcM = m - 30
  if (utcM < 0) {
    utcM += 60
    utcH -= 1
  }
  const dt = new Date(`${date}T${String(utcH).padStart(2, '0')}:${String(utcM).padStart(2, '0')}:00Z`)
  return dt.toISOString()
}

export default async function WebinarDetailPage({ params }) {
  const { data: webinar } = await adminSupabase
    .from('webinars')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!webinar) notFound()

  // Registration count
  const { count: regCount } = await adminSupabase
    .from('webinar_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('webinar_id', webinar.id)

  const formattedDate = new Date(webinar.date).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const eventISO = buildISTDatetime(webinar.date, webinar.time_ist)
  const isRegisterable = ['upcoming', 'live'].includes(webinar.status)
  const agenda = Array.isArray(webinar.agenda) ? webinar.agenda : []

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <header className="bg-navy border-b border-navy-2 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="EduDraftAI" className="w-8 h-8 rounded-lg" />
            <span className="font-heading text-lg font-bold text-white">EduDraftAI</span>
          </Link>
          <Link href="/webinar" className="text-sm text-slate-300 hover:text-white">← All Webinars</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left col: event info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <WebinarStatusBadge status={webinar.status} />
              <h1 className="font-heading text-3xl font-extrabold text-navy">{webinar.title}</h1>
              {webinar.tagline && <p className="text-lg text-muted">{webinar.tagline}</p>}
            </div>

            {/* Countdown */}
            {webinar.status === 'upcoming' && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">Event starts in</p>
                <CountdownTimer eventDateIST={eventISO} />
              </div>
            )}

            {/* Event details */}
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-3">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Event Details</h2>
              {[
                { icon: '📅', label: formattedDate },
                {
                  icon: '🕗',
                  label: `${webinar.time_ist} IST${webinar.time_est ? ` · ${webinar.time_est} EST` : ''}${webinar.time_pst ? ` · ${webinar.time_pst} PST` : ''}`,
                },
                { icon: '⏱', label: `${webinar.duration_mins} minutes` },
                { icon: '📍', label: 'Google Meet (free, online)' },
                { icon: '👥', label: `${regCount ?? 0} people registered` },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3 text-sm text-text">
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {webinar.description && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">About this event</h2>
                <p className="text-text text-sm leading-relaxed">{webinar.description}</p>
              </div>
            )}

            {/* Agenda */}
            {agenda.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">What you'll see</h2>
                <ul className="space-y-2">
                  {agenda.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-text">
                      <span className="w-5 h-5 rounded-full bg-teal-light text-teal text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Feedback banner */}
            {webinar.feedback_open && ['live', 'completed'].includes(webinar.status) && (
              <div className="bg-teal-light border border-teal/30 rounded-2xl p-5">
                <h3 className="font-semibold text-navy mb-1">Share your feedback 💬</h3>
                <p className="text-sm text-text">Check your registration email for your personal feedback link.</p>
              </div>
            )}

            {/* Completed state */}
            {webinar.status === 'completed' && (
              <div className="bg-bg border border-border rounded-2xl p-6 text-center space-y-2">
                <p className="text-muted text-sm">This webinar has ended.</p>
                <Link href="/webinar" className="text-teal text-sm font-medium hover:underline">
                  Check upcoming events →
                </Link>
              </div>
            )}
          </div>

          {/* Right col: registration form */}
          <div className="lg:col-span-1">
            {isRegisterable ? (
              <div className="lg:sticky lg:top-24">
                <RegistrationForm webinarId={webinar.id} webinarSlug={params.slug} />
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-2">
                <p className="text-muted text-sm">Registration is closed for this event.</p>
                <Link href="/webinar" className="text-teal text-sm font-medium hover:underline">
                  See upcoming webinars →
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
