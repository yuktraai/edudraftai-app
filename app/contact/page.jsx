import Link from 'next/link'

export const metadata = {
  title: 'Contact Us — EduDraftAI',
  description: 'Get in touch with the EduDraftAI team at Yuktra AI for support, demos, or billing queries.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-navy px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          EduDraft<span className="text-teal">AI</span>
        </Link>
        <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors">
          Login →
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-navy mb-2">Contact Us</h1>
        <p className="text-muted text-sm mb-10">
          We&apos;re here to help. Reach out for support, demo requests, billing queries, or anything else.
        </p>

        <div className="grid sm:grid-cols-2 gap-5 mb-10">

          {/* General / Support */}
          <div className="bg-surface border border-border rounded-xl p-6 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-teal-light flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h2 className="font-bold text-navy">General &amp; Support</h2>
            <p className="text-xs text-muted">For platform issues, access problems, or feature questions.</p>
            <a href="mailto:info@yuktraai.com?subject=EduDraftAI%20Support" className="block text-teal text-sm font-medium hover:underline">
              info@yuktraai.com
            </a>
            <p className="text-xs text-muted">Response within 2 business days</p>
          </div>

          {/* Demo request */}
          <div className="bg-surface border border-border rounded-xl p-6 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-teal-light flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.87V15.13a1 1 0 01-1.447.9L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-bold text-navy">Book a Demo</h2>
            <p className="text-xs text-muted">For college principals or admins interested in onboarding their institution.</p>
            <a href="mailto:info@yuktraai.com?subject=EduDraftAI%20Demo%20Request" className="block text-teal text-sm font-medium hover:underline">
              info@yuktraai.com
            </a>
            <p className="text-xs text-muted">Mention your college name and location</p>
          </div>

          {/* Billing */}
          <div className="bg-surface border border-border rounded-xl p-6 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-teal-light flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="font-bold text-navy">Billing &amp; Payments</h2>
            <p className="text-xs text-muted">For credit purchase issues, refund requests, or invoicing.</p>
            <a href="mailto:info@yuktraai.com?subject=EduDraftAI%20Billing%20Query" className="block text-teal text-sm font-medium hover:underline">
              info@yuktraai.com
            </a>
            <p className="text-xs text-muted">Include Razorpay Order/Payment ID in your email</p>
          </div>

          {/* Organisation info */}
          <div className="bg-surface border border-border rounded-xl p-6 space-y-2">
            <div className="w-9 h-9 rounded-lg bg-teal-light flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="font-bold text-navy">Our Organisation</h2>
            <div className="text-xs text-muted space-y-1">
              <p><strong className="text-text">Yuktra AI</strong></p>
              <p>Sole Proprietorship, India</p>
              <p>Product: EduDraftAI</p>
              <p>
                Website:{' '}
                <a href="https://edudraftai.com" className="text-teal hover:underline">edudraftai.com</a>
              </p>
            </div>
          </div>

        </div>

        {/* Policy links */}
        <div className="bg-bg border border-border rounded-xl px-5 py-4 flex flex-wrap gap-4 text-sm">
          <span className="text-muted text-xs">Legal documents:</span>
          <Link href="/privacy-policy" className="text-teal hover:underline text-xs">Privacy Policy</Link>
          <Link href="/terms" className="text-teal hover:underline text-xs">Terms &amp; Conditions</Link>
          <Link href="/refund-policy" className="text-teal hover:underline text-xs">Refund Policy</Link>
        </div>
      </main>

      <footer className="border-t border-border mt-12 py-6 px-6 text-center text-xs text-muted">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/privacy-policy" className="hover:text-text transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-text transition-colors">Terms &amp; Conditions</Link>
          <Link href="/refund-policy" className="hover:text-text transition-colors">Refund Policy</Link>
        </div>
        © {new Date().getFullYear()} Yuktra AI. All rights reserved.
      </footer>
    </div>
  )
}
