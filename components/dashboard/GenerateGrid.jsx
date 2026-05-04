import Link from 'next/link'

const CONTENT_TYPES = [
  {
    type:  'lesson_notes',
    href:  '/generate/lesson_notes',
    label: 'Lesson Notes',
    desc:  'Structured notes tied to your syllabus topic.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    type:  'mcq_bank',
    href:  '/generate/mcq_bank',
    label: 'MCQ Bank',
    desc:  'Multiple-choice questions with answer key.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type:  'question_bank',
    href:  '/generate/question_bank',
    label: 'Question Bank',
    desc:  '2-mark, 5-mark & 10-mark in SCTE & VT format.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    type:  'test_plan',
    href:  '/generate/test_plan',
    label: 'Internal Test',
    desc:  'Full test paper with mark distribution.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
      </svg>
    ),
  },
]

export function GenerateGrid() {
  return (
    <div>
      <h2 className="font-heading text-lg font-bold text-navy mb-3">Generate New</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CONTENT_TYPES.map(({ href, label, desc, icon }) => (
          <Link
            key={href}
            href={href}
            className="group relative block bg-navy-2 rounded-2xl p-5 border border-[rgba(0,180,166,0.15)] hover:border-[rgba(0,180,166,0.5)] transition-all duration-200 hover:-translate-y-0.5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}
          >
            <div className="text-teal mb-3">{icon}</div>
            <h3 className="font-bold text-white text-sm mb-1 group-hover:text-teal transition-colors">
              {label}
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">{desc}</p>
            <svg
              className="absolute bottom-4 right-4 w-4 h-4 text-slate-600 group-hover:text-teal transition-colors"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
