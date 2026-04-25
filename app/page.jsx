import Link from 'next/link'
import './landing.css'
import { CountdownTimer }   from '@/components/landing/CountdownTimer'
import { WaitlistSection }  from '@/components/landing/WaitlistSection'

export const metadata = {
  title: 'EduDraftAI | AI Drafting for Diploma College Lecturers',
  description:
    'EduDraftAI helps diploma college lecturers create lesson notes, MCQs, question banks, and internal tests faster with syllabus-aligned AI built for institutional use.',
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
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          <div>EduDraftAI by <strong>Yuktra AI</strong></div>
          <div>AI drafting for academic teams that need speed with structure.</div>
        </div>
        <div className="lp-wrap" style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '12px', display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/privacy-policy" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', textDecoration: 'none' }}>Terms &amp; Conditions</Link>
          <Link href="/refund-policy" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', textDecoration: 'none' }}>Refund Policy</Link>
          <Link href="/contact" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', textDecoration: 'none' }}>Contact Us</Link>
        </div>
      </footer>

    </div>
  )
}
