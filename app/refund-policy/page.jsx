import Link from 'next/link'

export const metadata = {
  title: 'Refund & Cancellation Policy — EduDraftAI',
  description: 'Refund and Cancellation Policy for EduDraftAI credit purchases by Yuktra AI.',
}

export default function RefundPolicyPage() {
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
        <h1 className="text-3xl font-bold text-navy mb-2">Refund &amp; Cancellation Policy</h1>
        <p className="text-muted text-sm mb-8">Last updated: April 20, 2026</p>

        <div className="space-y-8 text-text text-sm leading-relaxed">

          <section className="bg-teal-light border border-teal/20 rounded-xl px-5 py-4">
            <p className="text-sm text-navy font-medium">
              EduDraftAI operates on a prepaid credit model. Credits are purchased by college administrators
              and allocated to lecturers within their institution. Please read this policy carefully before
              making a purchase.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">1. Credit Purchases</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Credits are sold in fixed packs and are consumed at the rate of 1 credit per AI generation.</li>
              <li>All purchases are processed in Indian Rupees (INR) via Razorpay.</li>
              <li>Credits do not expire as long as the account remains active.</li>
              <li>Credits are non-transferable between different college accounts.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">2. Refund Eligibility</h2>
            <p className="mb-3">We offer refunds in the following situations:</p>
            <div className="space-y-3">
              <div className="flex gap-3 bg-surface border border-border rounded-lg px-4 py-3">
                <span className="text-teal font-bold shrink-0">✓</span>
                <div>
                  <p className="font-medium text-text">Technical Failure</p>
                  <p className="text-muted text-xs mt-0.5">If a credit was deducted but no content was generated due to a verified platform error, the credit will be restored or a refund issued within 7 business days.</p>
                </div>
              </div>
              <div className="flex gap-3 bg-surface border border-border rounded-lg px-4 py-3">
                <span className="text-teal font-bold shrink-0">✓</span>
                <div>
                  <p className="font-medium text-text">Duplicate Payment</p>
                  <p className="text-muted text-xs mt-0.5">If you were charged twice for the same order due to a payment gateway error, the duplicate amount will be refunded in full within 5–7 business days.</p>
                </div>
              </div>
              <div className="flex gap-3 bg-surface border border-border rounded-lg px-4 py-3">
                <span className="text-teal font-bold shrink-0">✓</span>
                <div>
                  <p className="font-medium text-text">Service Discontinuation</p>
                  <p className="text-muted text-xs mt-0.5">If Yuktra AI discontinues the EduDraftAI service, all unused credit balances will be refunded in full.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">3. Non-Refundable Cases</h2>
            <p className="mb-3">Refunds are <strong>not</strong> provided in the following cases:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Credits already consumed for AI content generation (even if you are unsatisfied with the output quality).</li>
              <li>Credits purchased but unused due to a change of mind or institution decision to discontinue use.</li>
              <li>Accounts suspended or deactivated due to violations of our Terms &amp; Conditions.</li>
              <li>Partial credit packs — refunds are not available for a portion of a purchased pack.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">4. Cancellation Policy</h2>
            <p>
              EduDraftAI does not operate on a subscription model — there are no recurring charges.
              College administrators purchase credits on demand. There is no &quot;cancel subscription&quot; action
              required. If you wish to stop using the service, simply do not purchase additional credits.
              Unused credits will remain in your account balance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">5. How to Request a Refund</h2>
            <p>To raise a refund request, please email us at{' '}
              <a href="mailto:info@yuktraai.com" className="text-teal hover:underline">info@yuktraai.com</a>{' '}
              with the following details:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Your college name and registered email address</li>
              <li>Razorpay Order ID or Payment ID</li>
              <li>Date and amount of the transaction</li>
              <li>Reason for the refund request</li>
            </ul>
            <p className="mt-2">
              Refund requests must be raised within <strong>14 days</strong> of the transaction date.
              Approved refunds will be credited to the original payment method within 5–10 business days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-2">6. Contact</h2>
            <p>
              For refund or billing queries:<br />
              <strong>Yuktra AI</strong><br />
              Email: <a href="mailto:info@yuktraai.com" className="text-teal hover:underline">info@yuktraai.com</a><br />
              Response time: within 2 business days
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-border mt-12 py-6 px-6 text-center text-xs text-muted">
        <div className="flex justify-center gap-6 mb-2">
          <Link href="/privacy-policy" className="hover:text-text transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-text transition-colors">Terms &amp; Conditions</Link>
          <Link href="/contact" className="hover:text-text transition-colors">Contact Us</Link>
        </div>
        © {new Date().getFullYear()} Yuktra AI. All rights reserved.
      </footer>
    </div>
  )
}
