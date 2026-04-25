import { adminSupabase } from '@/lib/supabase/admin'
import { MathContent } from '@/components/ui/MathContent'
import Link from 'next/link'

const TYPE_META = {
  lesson_notes:  { label: 'Lesson Notes',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
  mcq_bank:      { label: 'MCQ Bank',       color: 'bg-purple-50 text-purple-700 border-purple-200' },
  question_bank: { label: 'Question Bank',  color: 'bg-amber-50 text-amber-700 border-amber-200' },
  test_plan:     { label: 'Internal Test',  color: 'bg-[#E6FFFA] text-[#00B4A6] border-[#00B4A6]' },
  exam_paper:    { label: 'Exam Paper',     color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
}

export default async function SharedDraftPage({ params }) {
  const { token } = params

  const { data, error } = await adminSupabase
    .from('content_generations')
    .select(`
      id,
      raw_output,
      content_type,
      prompt_params,
      created_at,
      share_expires_at,
      subjects ( name, semester ),
      colleges ( name )
    `)
    .eq('share_token', token)
    .single()

  const isExpired = error || !data || new Date(data.share_expires_at) <= new Date()

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 max-w-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-[#1A202C]">Link Expired</h1>
          <p className="text-sm text-[#718096]">This shared draft link has expired or is no longer available.</p>
          <Link href="/" className="text-sm text-[#00B4A6] hover:underline">Go to EduDraftAI</Link>
        </div>
      </div>
    )
  }

  const meta = TYPE_META[data.content_type] ?? { label: data.content_type, color: 'bg-gray-50 text-gray-600 border-gray-200' }
  const topic = data.prompt_params?.topic ?? '—'
  const subject = data.subjects?.name ?? 'Unknown Subject'
  const semester = data.subjects?.semester
  const expiry = new Date(data.share_expires_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-heading font-bold text-[#0D1F3C] text-base">EduDraftAI</span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium border border-gray-200">
            Shared Draft
          </span>
        </div>
        <span className="text-xs text-[#718096]">Expires {expiry}</span>
      </header>

      {/* Content area */}
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Title block */}
        <div className="space-y-2">
          <p className="text-xs text-[#718096]">
            {subject}{semester ? ` · Semester ${semester}` : ''}
          </p>
          <h1 className="font-heading text-2xl font-bold text-[#0D1F3C] leading-snug">{topic}</h1>
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.color}`}>
            {meta.label}
          </span>
        </div>

        <hr className="border-[#E2E8F0]" />

        {/* Generated content */}
        <article>
          <MathContent content={data.raw_output} />
        </article>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[#718096] py-10 border-t border-[#E2E8F0] mt-8">
        Generated with EduDraftAI by Yuktra AI ·{' '}
        <a href="https://edudraftai.com" className="hover:underline">edudraftai.com</a>
      </footer>
    </div>
  )
}
