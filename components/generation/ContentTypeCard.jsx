import Link from 'next/link'

const ICONS = {
  lesson_notes: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  mcq_bank: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  question_bank: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  ),
  test_plan: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  exam_paper: (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
}

const META = {
  lesson_notes: {
    title:       'Lesson Notes',
    description: 'Structured notes with learning objectives, key concepts, detailed explanation, worked examples, and summary.',
    tag:         'Teaching aid',
  },
  mcq_bank: {
    title:       'MCQ Bank',
    description: 'Multiple choice questions with 4 options and answer key. Ideal for class tests and practice.',
    tag:         'Assessment',
  },
  question_bank: {
    title:       'Question Bank',
    description: 'SCTE & VT-style 2, 5, and 10-mark questions organised by section for exam preparation.',
    tag:         'Exam prep',
  },
  test_plan: {
    title:       'Internal Test',
    description: 'Ready-to-print internal test paper with mark distribution and topic coverage map.',
    tag:         'Test paper',
  },
  exam_paper: {
    title:       'Exam Paper',
    description: 'Full SCTE&VT 80-mark pattern — Q.1 (Very Short ×10), Q.2 (Short ×7, attempt 6), Q.3–Q.7 (Long, attempt 3). Right-margin marks. Answer key included.',
    tag:         'Exam',
  },
}

export function ContentTypeCard({ type }) {
  const { title, description, tag } = META[type]
  return (
    <Link href={`/generate/${type}`} className="group block">
      <div className="h-full bg-surface border border-border rounded-xl p-6 hover:border-teal hover:shadow-md transition-all duration-200 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-xl bg-teal-light flex items-center justify-center text-teal group-hover:bg-teal group-hover:text-white transition-colors">
            {ICONS[type]}
          </div>
          <span className="text-xs font-medium text-muted bg-bg border border-border px-2 py-1 rounded-full">
            {tag}
          </span>
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-bold text-navy text-lg mb-1">{title}</h3>
          <p className="text-muted text-sm leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center gap-1 text-teal text-sm font-semibold group-hover:gap-2 transition-all">
          Generate
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
