import Link from 'next/link'
import './landing.css'
import { CountdownTimer }   from '@/components/landing/CountdownTimer'
import { WaitlistSection }  from '@/components/landing/WaitlistSection'

export const metadata = {
  title: 'EduDraftAI — AI Lesson Notes, MCQ & Question Bank Generator for SCTE & VT Colleges',
  description:
    'Generate SCTE & VT syllabus-locked lesson notes, MCQ banks, question banks and internal test papers in seconds. AI-powered teaching content platform for Odisha diploma engineering colleges. Free trial available.',
  alternates: {
    canonical: 'https://edudraftai.com',
  },
  openGraph: {
    title:       'EduDraftAI — AI Teaching Content for SCTE & VT Diploma Colleges',
    description: 'Generate lesson notes, MCQ banks, question banks and test papers instantly. Built for SCTE & VT Odisha diploma engineering lecturers.',
    url:         'https://edudraftai.com',
    type:        'website',
  },
}

export default function LandingPage() {
  return (
    <div className="lp-root">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="lp-header">
        <div className="lp-wrap lp-header-inner">
          <a className="lp-brand" href="#top" aria-label="EduDraftAI home">
            <span className="lp-brand-badge" aria-hidden="true">
              <img src="/logo.png" alt="" width="32" height="32" style={{ borderRadius: '8px' }} />
            </span>
            <span className="lp-brand-text">EduDraft<span>AI</span></span>
          </a>

          <nav className="lp-nav" aria-label="Primary navigation">
            <a href="#why">Why EduDraftAI</a>
            <a href="#demo">Demo</a>
            <a href="#features">Features</a>
            <a href="#roles">For Teams</a>
            <a href="#how">How It Works</a>
            <Link href="/webinar">Webinars</Link>
            <Link href="/careers">Careers</Link>
            <Link className="lp-nav-login" href="/login">Login →</Link>
            <a className="lp-nav-cta" href="mailto:info@yuktraai.com?subject=EduDraftAI%20Demo%20Request">Book a Demo</a>
          </nav>
        </div>
      </header>

      <main id="top">

        {/* ── Hero ───────────────────────────────────────────────────────────── */}
        <section className="lp-hero">
          <div className="lp-wrap">
            <div className="lp-hero-panel">
              <div className="lp-hero-grid">
                <div className="lp-hero-copy">
                  <div className="lp-eyebrow">Built for Diploma Colleges</div>
                  <h1 className="lp-h1">Teach smarter. Draft faster.</h1>
                  <p>
                    EduDraftAI is the AI workspace for lecturers who need high-quality academic drafts
                    without losing syllabus alignment, consistency, or institutional trust.
                  </p>
                  <div className="lp-hero-actions">
                    <a className="lp-btn lp-btn-primary" href="mailto:info@yuktraai.com?subject=I%20want%20an%20EduDraftAI%20demo">
                      Request Early Demo
                    </a>
                    <a className="lp-btn lp-btn-secondary" href="#features">
                      Explore the Product
                    </a>
                  </div>
                  <div className="lp-hero-list">
                    <div className="lp-hero-pill">Lesson Notes</div>
                    <div className="lp-hero-pill">MCQ Sets</div>
                    <div className="lp-hero-pill">Question Banks</div>
                    <div className="lp-hero-pill">Internal Tests</div>
                  </div>
                </div>

                <div className="lp-hero-side">
                  {/* Countdown — client component */}
                  <div className="lp-glass-card lp-countdown">
                    <div className="lp-countdown-top">
                      <span>Launch Countdown</span>
                      <div className="lp-tag">July 7, 2026</div>
                    </div>
                    <CountdownTimer />
                  </div>

                  {/* Product preview mockup */}
                  <div className="lp-glass-card lp-preview">
                    <div className="lp-preview-label">Live Product Feel</div>
                    <div className="lp-workspace">
                      <div className="lp-workspace-top">
                        <strong>Lecturer Workspace</strong>
                        <span className="lp-workspace-badge">Syllabus aligned</span>
                      </div>
                      <div className="lp-workspace-body">
                        <div className="lp-field-row">
                          <div className="lp-field"><strong>Generate</strong><span>Lesson Notes</span></div>
                          <div className="lp-field"><strong>Semester</strong><span>Semester 4</span></div>
                          <div className="lp-field"><strong>Subject</strong><span>Electrical Machines</span></div>
                        </div>
                        <div className="lp-draft">
                          <div className="lp-draft-head">
                            <strong>Draft Ready</strong>
                            <span className="lp-draft-ok">Validated</span>
                          </div>
                          <div className="lp-draft-lines">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                        <div className="lp-stats-row">
                          <div className="lp-stat"><strong>Topic Scope</strong><span>Board-linked</span></div>
                          <div className="lp-stat"><strong>Review</strong><span>Editable draft</span></div>
                          <div className="lp-stat"><strong>History</strong><span>Saved output</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Demo Video ─────────────────────────────────────────────────────── */}
        <section className="lp-section" id="demo">
          <div className="lp-wrap">
            <div className="lp-section-head">
              <div>
                <div className="lp-kicker">See It In Action</div>
                <h2>Watch how it works.</h2>
              </div>
              <p className="lp-section-copy">
                See how lecturers go from topic selection to a ready draft in under a minute —
                no prompting experience needed.
              </p>
            </div>

            <div className="lp-video-wrap">
              <iframe
                src="https://www.youtube.com/embed/mGsqnxWhvGY?rel=0&modestbranding=1"
                title="EduDraftAI Product Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* ── Why EduDraftAI ─────────────────────────────────────────────────── */}
        <section className="lp-section" id="why">
          <div className="lp-wrap">
            <div className="lp-section-head">
              <div>
                <div className="lp-kicker">Why EduDraftAI</div>
                <h2>The AI tool lecturers can actually use every week.</h2>
              </div>
              <p className="lp-section-copy">
                Colleges do not need another generic chatbot. They need a dependable drafting system
                that feels useful for lecturers and safe for institutions.
              </p>
            </div>

            <div className="lp-signal-grid">
              <article className="lp-signal">
                <strong>Less prep time</strong>
                <span>Create teaching material faster, so lecturers can focus more on delivery, revision, and student support.</span>
              </article>
              <article className="lp-signal">
                <strong>Better consistency</strong>
                <span>Keep drafts tied to academic scope instead of getting uneven outputs from open-ended prompting.</span>
              </article>
              <article className="lp-signal">
                <strong>More control</strong>
                <span>Give colleges a system that supports review, visibility, and structured usage rather than informal AI use.</span>
              </article>
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────────────────────── */}
        <section className="lp-section" id="features">
          <div className="lp-wrap">
            <div className="lp-section-head">
              <div>
                <div className="lp-kicker">Features</div>
                <h2>Built around the tasks lecturers already do.</h2>
              </div>
              <p className="lp-section-copy">
                Every section of the product is meant to reduce friction, not add more admin work.
              </p>
            </div>

            <div className="lp-feature-grid">
              <article className="lp-feature-card">
                <div className="lp-feature-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 4.5h9a2 2 0 0 1 2 2V19l-4-2-4 2V6.5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7"/>
                    <path d="M9 8.5h5M9 11.5h5M9 14.5h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>Lesson note drafting</h3>
                <p>Generate structured teaching notes from selected subjects and topics without starting from scratch every time.</p>
              </article>

              <article className="lp-feature-card">
                <div className="lp-feature-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.7"/>
                    <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>Question generation</h3>
                <p>Create MCQs, short-answer sets, and test drafts in a cleaner, more repeatable workflow.</p>
              </article>

              <article className="lp-feature-card">
                <div className="lp-feature-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7"/>
                  </svg>
                </div>
                <h3>Syllabus-aware workflow</h3>
                <p>Work inside approved academic scope instead of relying on random prompts and manual correction loops.</p>
              </article>

              <article className="lp-feature-card">
                <div className="lp-feature-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3l7 3v5c0 4.2-2.7 8-7 10-4.3-2-7-5.8-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.7"/>
                    <path d="m9.5 12 1.7 1.7 3.3-3.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Institution-ready control</h3>
                <p>Support review, visibility, and responsible AI use from the start, which matters for real adoption.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ── For Teams ──────────────────────────────────────────────────────── */}
        <section className="lp-section" id="roles">
          <div className="lp-wrap">
            <div className="lp-section-head">
              <div>
                <div className="lp-kicker">For Teams</div>
                <h2>Useful for lecturers. Reassuring for administrators.</h2>
              </div>
              <p className="lp-section-copy">
                EduDraftAI is designed to work for the people creating academic content and the people
                responsible for academic quality.
              </p>
            </div>

            <div className="lp-roles-grid">
              <article className="lp-role-card">
                <div className="lp-role-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7"/>
                    <path d="M5.5 19c.7-3.1 3.1-5 6.5-5s5.8 1.9 6.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>Lecturers</h3>
                <p>Draft teaching content faster, keep your workflow simple, and turn first drafts into usable material with less repetition.</p>
              </article>

              <article className="lp-role-card">
                <div className="lp-role-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="4" y="4.5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.7"/>
                    <path d="M8 9.5h8M8 13h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>Department heads</h3>
                <p>Bring more consistency to notes, tests, and subject preparation without forcing staff into complicated tools.</p>
              </article>

              <article className="lp-role-card">
                <div className="lp-role-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M4 18V8.5L12 5l8 3.5V18" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                    <path d="M8 18v-5h8v5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>College leadership</h3>
                <p>Adopt AI in a more structured way, with a platform that feels academic, practical, and easier to trust.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ── How It Works ───────────────────────────────────────────────────── */}
        <section className="lp-section" id="how">
          <div className="lp-wrap">
            <div className="lp-section-head">
              <div>
                <div className="lp-kicker">How It Works</div>
                <h2>A simpler path from topic selection to ready draft.</h2>
              </div>
              <p className="lp-section-copy">
                The experience is intentionally direct, so staff can start using it without learning
                a complicated AI workflow.
              </p>
            </div>

            <div className="lp-steps-grid">
              <article className="lp-step-card">
                <div className="lp-step-no">01</div>
                <h3>Choose the subject and topic</h3>
                <p>Select the academic area you are working on instead of writing complex prompts from scratch.</p>
              </article>

              <article className="lp-step-card">
                <div className="lp-step-no">02</div>
                <h3>Generate the first draft</h3>
                <p>Create notes, questions, or test content in seconds with a workflow tailored for teaching preparation.</p>
              </article>

              <article className="lp-step-card">
                <div className="lp-step-no">03</div>
                <h3>Review, refine, and use</h3>
                <p>Edit the output, save what matters, and move faster the next time you prepare material.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ── What It Signals ─────────────────────────────────────────────────── */}
        <section className="lp-section">
          <div className="lp-wrap">
            <div className="lp-section-head">
              <div>
                <div className="lp-kicker">What It Signals</div>
                <h2>A modern academic workflow without the chaos of generic AI use.</h2>
              </div>
              <p className="lp-section-copy">
                Practical, controlled, and built for real education teams.
              </p>
            </div>

            <div className="lp-quotes-grid">
              <article className="lp-quote-card">
                <h3>For colleges</h3>
                <p>Bring AI into your academic workflow with a product that feels purposeful, structured, and institution-friendly.</p>
                <strong>Academic credibility matters.</strong>
              </article>

              <article className="lp-quote-card">
                <h3>For lecturers</h3>
                <p>Stop repeating the same manual drafting work every week and start with a smarter first draft instead.</p>
                <strong>Save effort where it actually counts.</strong>
              </article>

              <article className="lp-quote-card">
                <h3>For early adopters</h3>
                <p>Be part of the first wave of colleges using a dedicated AI drafting layer built for diploma education.</p>
                <strong>Early momentum creates advantage.</strong>
              </article>
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────────── */}
        <section className="lp-launch">
          <div className="lp-wrap">
            <div className="lp-cta-band">
              <div className="lp-cta-strip">
                <div>
                  <h2>Ready to see EduDraftAI in action?</h2>
                  <p>
                    We are opening early conversations with diploma colleges, academic teams, and
                    lecturers who want a cleaner way to create teaching material with AI.
                  </p>
                </div>
                <div className="lp-cta-actions">
                  <a className="lp-contact-pill" href="mailto:info@yuktraai.com?subject=EduDraftAI%20Demo%20Request">
                    info@yuktraai.com
                  </a>
                  <Link className="lp-contact-pill alt" href="/login">
                    Login to App →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Waitlist ───────────────────────────────────────────────────────── */}
        <WaitlistSection />

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="lp-footer-full">
        <div className="lp-wrap">

          {/* Top grid */}
          <div className="lp-footer-grid">

            {/* Brand column */}
            <div className="lp-footer-brand">
              <a className="lp-brand" href="#top" aria-label="EduDraftAI home">
                <span className="lp-brand-badge" aria-hidden="true">
                  <img src="/logo.png" alt="" width="28" height="28" style={{ borderRadius: '7px' }} />
                </span>
                <span className="lp-brand-text">EduDraft<span>AI</span></span>
              </a>
              <p className="lp-footer-tagline">
                AI-powered teaching content for SCTE & VT diploma engineering colleges in Odisha.
                Generate lesson notes, MCQ banks, question papers and test plans — instantly.
              </p>
              <p className="lp-footer-by">
                A product by{' '}
                <a href="https://www.yuktraai.com/" target="_blank" rel="noopener noreferrer" className="lp-footer-yuktra-link">
                  Yuktra AI
                </a>
              </p>
              <a
                href="mailto:info@yuktraai.com"
                className="lp-footer-email"
              >
                info@yuktraai.com
              </a>

              {/* Social links */}
              <div className="lp-footer-socials">
                <a
                  href="https://www.linkedin.com/company/yuktraai"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Yuktra AI on LinkedIn"
                  className="lp-footer-social-link"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/yuktraai"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Yuktra AI on Instagram"
                  className="lp-footer-social-link"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/yuktraai"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Yuktra AI on Facebook"
                  className="lp-footer-social-link"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product links */}
            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">Product</h4>
              <ul className="lp-footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#demo">Demo Video</a></li>
                <li><a href="#how">How It Works</a></li>
                <li><a href="#roles">For Teams</a></li>
                <li><Link href="/webinar">Webinars</Link></li>
                <li><Link href="/careers">Careers</Link></li>
                <li><Link href="/login">Login to App →</Link></li>
              </ul>
            </div>

            {/* Content types */}
            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">What We Generate</h4>
              <ul className="lp-footer-links">
                <li><span>📝 Lesson Notes</span></li>
                <li><span>✅ MCQ Banks</span></li>
                <li><span>📋 Question Banks</span></li>
                <li><span>🗓 Internal Test Papers</span></li>
              </ul>
              <h4 className="lp-footer-col-title" style={{ marginTop: '28px' }}>Built For</h4>
              <ul className="lp-footer-links">
                <li><span>SCTE & VT Odisha Colleges</span></li>
                <li><span>Diploma Engineering</span></li>
                <li><span>Lecturers &amp; HODs</span></li>
              </ul>
            </div>

            {/* Company + legal */}
            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">Company</h4>
              <ul className="lp-footer-links">
                <li><Link href="/college-pilot">College Pilot</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
                <li>
                  <a
                    href="mailto:info@yuktraai.com?subject=EduDraftAI%20Demo%20Request"
                  >
                    Book a Demo
                  </a>
                </li>
                <li>
                  <a href="https://www.yuktraai.com/" target="_blank" rel="noopener noreferrer">
                    Yuktra AI ↗
                  </a>
                </li>
              </ul>
              <h4 className="lp-footer-col-title" style={{ marginTop: '28px' }}>Legal</h4>
              <ul className="lp-footer-links">
                <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms &amp; Conditions</Link></li>
                <li><Link href="/refund-policy">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="lp-footer-bottom">
            <p>© {new Date().getFullYear()} Yuktra AI. All rights reserved.</p>
            <p className="lp-footer-bottom-right">
              Empowering SCTE & VT diploma colleges with AI — Made in Odisha 🇮🇳
            </p>
          </div>

        </div>
      </footer>

    </div>
  )
}
