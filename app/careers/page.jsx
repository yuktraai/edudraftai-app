import Link from 'next/link'
import { adminSupabase } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Careers — EduDraftAI',
  description: 'Join the Yuktra AI team and help build the future of education in Odisha. View open positions at EduDraftAI.',
}

function JobCard({ job }) {
  const excerpt = job.description?.length > 120
    ? job.description.slice(0, 120).trimEnd() + '…'
    : job.description

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 hover:border-teal/40 hover:shadow-md transition-all group">
      <div className="flex flex-col gap-4">
        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-navy group-hover:text-teal transition-colors leading-snug">
            {job.title}
          </h2>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-light text-teal border border-teal/20">
            {job.department}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-muted border border-border">
            📍 {job.location}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-muted border border-border">
            {job.type}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-muted border border-border">
            🕒 {job.experience}
          </span>
        </div>

        {/* Excerpt */}
        <p className="text-sm text-muted leading-relaxed">{excerpt}</p>

        {/* CTA */}
        <div className="pt-1">
          <Link
            href={`/careers/${job.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-2 transition-colors"
          >
            View &amp; Apply
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default async function CareersPage() {
  const { data: jobs } = await adminSupabase
    .from('job_postings')
    .select('id, title, department, location, type, experience, description, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const activeJobs = jobs ?? []

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-navy text-white">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-white hover:text-teal transition-colors">
            <img src="/logo.png" alt="EduDraftAI" className="w-8 h-8 rounded-xl" />
            <span className="font-bold text-lg tracking-tight">EduDraft<span className="text-teal">AI</span></span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-slate-300 hover:text-white transition-colors"
          >
            App Login →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-navy text-white pb-16 pt-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal/10 border border-teal/20 text-teal text-sm font-semibold mb-6">
            🚀 We're hiring
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Join Our Team
          </h1>
          <p className="text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
            Help us build the future of education in Odisha. We're a small, passionate team
            working on AI tools that make a real difference for diploma college educators.
          </p>
        </div>
      </section>

      {/* Jobs list */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {activeJobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-navy mb-2">No open positions right now</h2>
            <p className="text-muted">We're not actively hiring at the moment. Check back soon — we grow fast!</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-8 px-5 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-2 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold text-navy">
                {activeJobs.length} Open {activeJobs.length === 1 ? 'Position' : 'Positions'}
              </h2>
            </div>
            <div className="space-y-5">
              {activeJobs.map(job => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <p>© {new Date().getFullYear()} Yuktra AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-navy transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-navy transition-colors">Contact</Link>
            <Link href="/" className="hover:text-navy transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
