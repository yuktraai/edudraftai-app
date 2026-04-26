import { adminSupabase } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { WebinarStatusBadge } from '@/components/webinar/WebinarStatusBadge'

export const metadata = { title: 'Webinars — EduDraftAI' }

async function getWebinars() {
  const [{ data: webinars }, { data: allRegs }, { data: feedbacks }] = await Promise.all([
    adminSupabase.from('webinars').select('*').order('date', { ascending: false }),
    adminSupabase.from('webinar_registrations').select('webinar_id'),
    adminSupabase.from('webinar_feedback').select('webinar_id'),
  ])

  const regCount = {}
  const fbCount  = {}
  for (const r of allRegs  ?? []) regCount[r.webinar_id] = (regCount[r.webinar_id] ?? 0) + 1
  for (const f of feedbacks ?? []) fbCount[f.webinar_id]  = (fbCount[f.webinar_id]  ?? 0) + 1

  return (webinars ?? []).map(w => ({
    ...w,
    registration_count: regCount[w.id] ?? 0,
    feedback_count:     fbCount[w.id]  ?? 0,
  }))
}

export default async function SuperAdminWebinarsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await adminSupabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const webinars = await getWebinars()

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy font-heading">Webinars</h1>
          <p className="text-sm text-muted mt-0.5">{webinars.length} event{webinars.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/super-admin/webinars/new"
          className="inline-flex items-center gap-2 bg-teal hover:bg-teal-2 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Webinar
        </Link>
      </div>

      {webinars.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-teal/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
            </svg>
          </div>
          <p className="text-navy font-semibold">No webinars yet</p>
          <p className="text-muted text-sm mt-1">Create your first event to start collecting registrations.</p>
          <Link
            href="/super-admin/webinars/new"
            className="inline-block mt-4 bg-teal hover:bg-teal-2 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Create Webinar
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Event</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wide">Registrations</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wide">Feedback</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {webinars.map((w, i) => (
                <tr key={w.id} className={`border-b border-border last:border-0 hover:bg-bg/50 transition-colors ${i % 2 === 0 ? '' : 'bg-bg/20'}`}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-navy">{w.title}</p>
                    {w.tagline && <p className="text-xs text-muted mt-0.5 truncate max-w-xs">{w.tagline}</p>}
                    <p className="text-xs text-muted/70 mt-0.5 font-mono">/webinar/{w.slug}</p>
                  </td>
                  <td className="px-4 py-4 text-muted whitespace-nowrap">
                    {new Date(w.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    <br />
                    <span className="text-xs">{w.time_ist} IST</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <WebinarStatusBadge status={w.status} />
                    {w.feedback_open && (
                      <span className="block mt-1 text-xs text-success font-medium">Feedback open</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-bold text-navy">{w.registration_count}</span>
                    <span className="text-muted text-xs"> / {w.max_registrations}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-semibold text-navy">{w.feedback_count}</span>
                    {w.registration_count > 0 && (
                      <span className="text-muted text-xs ml-1">
                        ({Math.round(w.feedback_count / w.registration_count * 100)}%)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/super-admin/webinars/${w.id}`}
                        className="text-xs font-medium text-teal hover:underline"
                      >
                        Edit
                      </Link>
                      <span className="text-border">·</span>
                      <Link
                        href={`/super-admin/webinars/${w.id}/registrations`}
                        className="text-xs font-medium text-teal hover:underline"
                      >
                        Registrants
                      </Link>
                      <span className="text-border">·</span>
                      <Link
                        href={`/webinar/${w.slug}`}
                        target="_blank"
                        className="text-xs font-medium text-muted hover:text-navy"
                      >
                        View ↗
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
