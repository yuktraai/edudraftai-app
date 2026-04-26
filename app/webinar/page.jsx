import { adminSupabase } from '@/lib/supabase/admin'
import { WebinarCard } from '@/components/webinar/WebinarCard'
import Link from 'next/link'

export const metadata = { title: 'Webinars — EduDraftAI' }

export default async function WebinarListPage() {
  const { data: webinars } = await adminSupabase
    .from('webinars')
    .select('id, slug, title, tagline, date, time_ist, duration_mins, status, max_registrations')
    .order('date', { ascending: false })

  const upcoming = (webinars ?? []).filter(w => ['upcoming', 'live'].includes(w.status))
  const past     = (webinars ?? []).filter(w => ['completed', 'cancelled'].includes(w.status))

  return (
    <div className="min-h-screen bg-bg">
      {/* Nav bar */}
      <header className="bg-navy border-b border-navy-2 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="EduDraftAI" className="w-8 h-8 rounded-lg" />
            <span className="font-heading text-lg font-bold text-white">EduDraftAI</span>
          </Link>
          <Link href="/login" className="text-sm text-teal font-medium hover:underline">Login →</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-block px-3 py-1 bg-teal-light text-teal text-xs font-semibold rounded-full border border-teal/30">
            Free Live Events
          </div>
          <h1 className="font-heading text-4xl font-extrabold text-navy">EduDraftAI Webinars</h1>
          <p className="text-muted max-w-lg mx-auto">
            Watch live demos, ask questions, and see how AI is transforming teaching in diploma colleges across India.
          </p>
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-navy mb-4">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcoming.map(w => <WebinarCard key={w.id} webinar={w} />)}
            </div>
          </section>
        )}

        {/* Past */}
        {past.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-navy mb-4">Past Webinars</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {past.map(w => <WebinarCard key={w.id} webinar={w} />)}
            </div>
          </section>
        )}

        {(!webinars || webinars.length === 0) && (
          <div className="text-center py-16 text-muted">No webinars scheduled yet. Check back soon.</div>
        )}
      </main>
    </div>
  )
}
