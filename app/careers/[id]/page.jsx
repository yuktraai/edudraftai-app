import { notFound } from 'next/navigation'
import Link from 'next/link'
import { adminSupabase } from '@/lib/supabase/admin'
import { ApplicationForm } from './ApplicationForm'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
  const { data: job } = await adminSupabase
    .from('job_postings')
    .select('title, department, description')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!job) return { title: 'Job Not Found — EduDraftAI' }

  return {
    title: `${job.title} — Careers at EduDraftAI`,
    description: job.description?.slice(0, 160),
  }
}

export default async function JobDetailPage({ params }) {
  const { data: job } = await adminSupabase
    .from('job_postings')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!job) notFound()

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-navy text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-white hover:text-teal transition-colors">
            <img src="/logo.png" alt="EduDraftAI" className="w-8 h-8 rounded-xl" />
            <span className="font-bold text-lg tracking-tight">EduDraft<span className="text-teal">AI</span></span>
          </Link>
          <Link href="/careers" className="text-sm text-slate-300 hover:text-white transition-colors">
            ← All Positions
          </Link>
        </div>
      </header>

      {/* Job title bar */}
      <div className="bg-navy border-b border-navy-2 pb-10 pt-4">
        <div className="max-w-6xl mx-auto px-6">
          <Link
            href="/careers"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-teal text-sm mb-4 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to all positions
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">{job.title}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal/15 text-teal border border-teal/25">
              {job.department}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/15">
              📍 {job.location}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/15">
              {job.type}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/15">
              🕒 {job.experience}
            </span>
          </div>
        </div>
      </div>

      {/* Main content: 60% job detail + 40% sticky form */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

          {/* Left — Job detail (60%) */}
          <div className="lg:col-span-3 space-y-8">

            {/* Description */}
            <section>
              <h2 className="text-lg font-bold text-navy mb-3">About the Role</h2>
              <div className="text-text text-sm leading-relaxed whitespace-pre-line">
                {job.description}
              </div>
            </section>

            {/* Responsibilities */}
            {job.responsibilities?.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-navy mb-3">What You'll Do</h2>
                <ul className="space-y-2">
                  {job.responsibilities.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-text leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Requirements */}
            {job.requirements?.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-navy mb-3">What We're Looking For</h2>
                <ul className="space-y-2">
                  {job.requirements.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-text leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-navy shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* About company */}
            <section className="bg-surface border border-border rounded-2xl p-6">
              <h2 className="text-base font-bold text-navy mb-2">About Yuktra AI</h2>
              <p className="text-sm text-muted leading-relaxed">
                Yuktra AI is a startup building AI-powered tools for education in India. Our flagship product,
                EduDraftAI, helps SCTE & VT diploma college lecturers generate high-quality teaching content —
                lesson notes, MCQ banks, question papers, and test plans — in minutes instead of hours.
                We're a small team with big ambitions, and every person makes a real impact.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="https://www.yuktraai.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-teal font-medium hover:underline"
                >
                  yuktraai.com ↗
                </a>
                <span className="text-border">·</span>
                <a
                  href="mailto:info@yuktraai.com"
                  className="text-sm text-teal font-medium hover:underline"
                >
                  info@yuktraai.com
                </a>
              </div>
            </section>
          </div>

          {/* Right — Sticky application form (40%) */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-navy mb-1">Apply for this Role</h2>
                <p className="text-sm text-muted mb-5">
                  Fill in your details below. We'll get back to you within 5–7 business days.
                </p>
                <ApplicationForm jobId={job.id} jobTitle={job.title} />
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <p>© {new Date().getFullYear()} Yuktra AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-navy transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-navy transition-colors">Contact</Link>
            <Link href="/careers" className="hover:text-navy transition-colors">All Positions</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
