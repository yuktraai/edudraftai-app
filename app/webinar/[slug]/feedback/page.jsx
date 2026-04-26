import { adminSupabase } from '@/lib/supabase/admin'
import { FeedbackForm } from '@/components/webinar/FeedbackForm'
import Link from 'next/link'

export const metadata = { title: 'Feedback — EduDraftAI Webinar' }

function InvalidTokenPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="font-heading text-xl font-bold text-navy">Invalid feedback link</h1>
        <p className="text-muted text-sm">
          This feedback link is invalid or has expired. Please use the link from your registration email.
        </p>
        <Link href="/webinar" className="inline-block text-teal text-sm font-medium hover:underline">
          Browse webinars →
        </Link>
      </div>
    </div>
  )
}

export default async function FeedbackPage({ params, searchParams }) {
  const token = searchParams?.token

  if (!token) {
    return <InvalidTokenPage />
  }

  // Get webinar by slug
  const { data: webinar } = await adminSupabase
    .from('webinars')
    .select('id, title, feedback_open, status')
    .eq('slug', params.slug)
    .single()

  if (!webinar) return <InvalidTokenPage />

  // Validate token
  const { data: reg } = await adminSupabase
    .from('webinar_registrations')
    .select('id, name')
    .eq('feedback_token', token)
    .eq('webinar_id', webinar.id)
    .single()

  if (!reg) return <InvalidTokenPage />

  // Check already submitted
  const { data: existing } = await adminSupabase
    .from('webinar_feedback')
    .select('id')
    .eq('registration_id', reg.id)
    .single()

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-navy border-b border-navy-2">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-2">
          <img src="/logo.png" alt="EduDraftAI" className="w-8 h-8 rounded-lg" />
          <span className="font-heading text-lg font-bold text-white">EduDraftAI</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8 space-y-2">
          <h1 className="font-heading text-2xl font-bold text-navy">How was the demo, {reg.name}?</h1>
          <p className="text-muted text-sm">{webinar.title}</p>
        </div>

        {existing ? (
          <div className="text-center py-12 bg-surface border border-border rounded-2xl space-y-3">
            <div className="text-3xl">✅</div>
            <h3 className="font-semibold text-navy">Already submitted</h3>
            <p className="text-muted text-sm">You have already submitted feedback. Thank you!</p>
          </div>
        ) : !webinar.feedback_open ? (
          <div className="text-center py-12 bg-surface border border-border rounded-2xl space-y-3">
            <p className="text-muted text-sm">Feedback collection hasn't opened yet. Check back after the event.</p>
          </div>
        ) : (
          <FeedbackForm registrationId={reg.id} webinarId={webinar.id} token={token} />
        )}
      </main>
    </div>
  )
}
