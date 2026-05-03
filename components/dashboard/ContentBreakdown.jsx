import Link from 'next/link'

const TYPES = [
  {
    key:  'lesson_notes',
    label: 'Lesson Notes',
    href:  '/generate/lesson_notes',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    key:  'mcq_bank',
    label: 'MCQ Bank',
    href:  '/generate/mcq_bank',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key:  'question_bank',
    label: 'Question Bank',
    href:  '/generate/question_bank',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    key:  'test_plan',
    label: 'Internal Test',
    href:  '/generate/test_plan',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
      </svg>
    ),
  },
]

export function ContentBreakdown({ byType, total }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <h2 className="text-sm font-bold text-navy mb-4">Content Breakdown</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {TYPES.map(({ key, label, href, icon }) => {
          const count = byType[key] ?? 0
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={key} className="relative bg-navy rounded-2xl p-4 overflow-hidden border border-[rgba(0,180,166,0.15)]">
              {/* Watermark icon */}
              <div className="absolute top-2 right-2 text-teal opacity-[0.12] pointer-events-none">
                <div className="w-10 h-10">{icon}</div>
              </div>

              <div className="text-teal mb-2">{icon}</div>
              <p className="text-xs font-semibold text-slate-400 mb-1">{label}</p>
              <p className="text-2xl font-bold text-teal">{count}</p>

              {/* Progress bar */}
              <div className="mt-2.5 h-1 bg-teal/10 rounded-full overflow-hidden">
                <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{pct}% of total</p>

              {count === 0 && (
                <Link
                  href={href}
                  className="mt-2 flex items-center gap-1 text-[11px] text-teal font-medium hover:text-teal-2 transition-colors"
                >
                  Generate first
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
