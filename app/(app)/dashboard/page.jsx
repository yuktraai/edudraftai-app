import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Dashboard — EduDraftAI' }

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, role, college_id')
    .eq('id', user.id)
    .single()

  // Non-lecturers are redirected to their correct home by the callback,
  // but guard here too in case of direct navigation.
  if (profile?.role === 'super_admin')   redirect('/super-admin/colleges')
  if (profile?.role === 'college_admin') redirect('/admin/dashboard')

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-heading text-2xl font-bold text-navy">
        Welcome back, {profile?.name ?? 'Lecturer'} 👋
      </h1>
      <p className="text-muted mt-1 text-sm">
        Ready to generate teaching content? Pick a type below.
      </p>

      {/* Quick action cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { title: 'Lesson Notes',    desc: 'Structured notes tied to your syllabus topic.',           href: '/generate/lesson_notes' },
          { title: 'MCQ Bank',        desc: 'Multiple-choice questions with answer key.',               href: '/generate/mcq_bank' },
          { title: 'Question Bank',   desc: '2-mark, 5-mark & 10-mark questions in SCTEVT format.',    href: '/generate/question_bank' },
          { title: 'Internal Test',   desc: 'Full internal test paper with mark distribution.',         href: '/generate/test_plan' },
        ].map(({ title, desc, href }) => (
          <a
            key={href}
            href={href}
            className="group block bg-surface border border-border rounded-xl p-5 hover:border-teal hover:shadow-sm transition-all"
          >
            <h2 className="font-semibold text-navy group-hover:text-teal transition-colors">
              {title}
            </h2>
            <p className="text-muted text-sm mt-1">{desc}</p>
            <span className="inline-block mt-3 text-teal text-xs font-medium">
              Generate →
            </span>
          </a>
        ))}
      </div>

      {/* Recent drafts placeholder */}
      <div className="mt-10">
        <h2 className="font-heading text-lg font-bold text-navy mb-3">Recent Drafts</h2>
        <div className="bg-surface border border-border rounded-xl p-6 text-center text-muted text-sm">
          No drafts yet — generate your first piece of content above.
        </div>
      </div>
    </div>
  )
}
