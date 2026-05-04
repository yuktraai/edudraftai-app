import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — EduDraftAI',
  description: 'Privacy Policy for EduDraftAI by Yuktra AI. Learn how we collect, use, and protect your data.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <header className="bg-navy px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          EduDraft<span className="text-teal">AI</span>
        </Link>
        <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors">
          Login →
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-navy mb-2">Privacy Policy</h1>
        <p className="text-muted text-sm mb-8">Last updated: April 20, 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-text text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">1. About Us</h2>
            <p>
              EduDraftAI is a product of <strong>Yuktra AI</strong> (sole proprietorship), operated at{' '}
              <a href="https://edudraftai.com" className="text-teal hover:underline">edudraftai.com</a>.
              We provide AI-powered content drafting tools for diploma college lecturers affiliated with
              SCTE & VT Odisha institutions. For any privacy-related queries, contact us at{' '}
              <a href="mailto:info@yuktraai.com" className="text-teal hover:underline">info@yuktraai.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account information:</strong> Name, email address, and college affiliation provided at registration.</li>
              <li><strong>Usage data:</strong> Content generation history, draft documents, syllabus interactions.</li>
              <li><strong>Payment information:</strong> Transaction IDs and credit purchase history processed via Razorpay. We do not store card numbers, UPI IDs, or banking credentials.</li>
              <li><strong>Technical data:</strong> IP address, browser type, device information, and session logs for security and debugging.</li>
              <li><strong>Cookies:</strong> Authentication session cookies required for login. We do not use advertising or tracking cookies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and operate the EduDraftAI platform and AI generation features.</li>
              <li>To manage your account, credit balance, and generation history.</li>
              <li>To process payments and maintain credit transaction records.</li>
              <li>To send transactional emails (OTP for login, payment receipts).</li>
              <li>To improve our AI models, prompt quality, and platform features.</li>
              <li>To detect and prevent fraud, abuse, or security threats.</li>
            </ul>
            <p className="mt-2">We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">4. Data Sharing</h2>
            <p>We share data only with the following trusted service providers to operate our platform:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Supabase</strong> — database, authentication, and file storage (servers in the EU/US).</li>
              <li><strong>OpenAI</strong> — AI content generation (prompts and generated text may be processed by OpenAI per their privacy policy).</li>
              <li><strong>Anthropic</strong> — fallback AI generation provider.</li>
              <li><strong>Pinecone</strong> — vector database for reference document retrieval (RAG feature).</li>
              <li><strong>Razorpay</strong> — payment processing for credit purchases (PCI-DSS compliant).</li>
              <li><strong>Vercel</strong> — cloud hosting and edge network.</li>
              <li><strong>Resend</strong> — transactional email delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">5. Data Retention</h2>
            <p>
              We retain your account data and generation history as long as your account is active. If you
              request account deletion, we will delete your personal data within 30 days, except where
              retention is required for legal or financial compliance (e.g., payment records for 7 years
              as required by Indian tax law).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">6. Security</h2>
            <p>
              We use industry-standard security practices including TLS encryption in transit, row-level
              security in our database, and strict role-based access controls. However, no internet
              transmission is 100% secure. We encourage users to keep their login credentials safe.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and personal data.</li>
              <li>Object to processing of your data for non-essential purposes.</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, email us at{' '}
              <a href="mailto:info@yuktraai.com" className="text-teal hover:underline">info@yuktraai.com</a>{' '}
              with subject line &quot;Privacy Request&quot;.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">8. Children&apos;s Privacy</h2>
            <p>
              EduDraftAI is intended for college lecturers and administrators (18+). We do not knowingly
              collect data from individuals under 18 years of age.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify registered users via
              email for material changes. Continued use of the platform after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">10. Contact</h2>
            <p>
              For privacy-related concerns or requests:<br />
              <strong>Yuktra AI</strong><br />
              Email: <a href="mailto:info@yuktraai.com" className="text-teal hover:underline">info@yuktraai.com</a><br />
              Website: <a href="https://edudraftai.com" className="text-teal hover:underline">edudraftai.com</a>
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-border mt-12 py-6 px-6 text-center text-xs text-muted">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/terms" className="hover:text-text transition-colors">Terms &amp; Conditions</Link>
          <Link href="/refund-policy" className="hover:text-text transition-colors">Refund Policy</Link>
          <Link href="/contact" className="hover:text-text transition-colors">Contact Us</Link>
        </div>
        © {new Date().getFullYear()} Yuktra AI. All rights reserved.
      </footer>
    </div>
  )
}
