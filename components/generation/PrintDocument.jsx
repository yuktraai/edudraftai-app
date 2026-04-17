'use client'

import { useEffect } from 'react'
import { CollegeLogo } from '@/components/ui/CollegeLogo'

function PrintHeader({ college, generation }) {
  const date = generation.created_at
    ? new Date(generation.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''

  return (
    <div className="print-header">
      <div className="print-header-left">
        <CollegeLogo logoUrl={college.logo_url} collegeName={college.name} size="lg" />
        <div>
          <div className="print-college-name">{college.name}</div>
          {college.address && (
            <div className="print-college-address">{college.address}</div>
          )}
        </div>
      </div>
      <div className="print-header-right">
        <div className="print-meta-line"><strong>Subject:</strong> {generation.subject_name ?? '—'}</div>
        <div className="print-meta-line"><strong>Topic:</strong> {generation.topic ?? '—'}</div>
        <div className="print-meta-line"><strong>Date:</strong> {date}</div>
      </div>
    </div>
  )
}

// Simple markdown → HTML for print
function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>(\n|$))+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])(.+)$/gm, (line) => line ? `<p>${line}</p>` : '')
}

function LessonNotesContent({ text }) {
  return (
    <div
      className="print-prose"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  )
}

function MCQContent({ text }) {
  // Separate answer key from questions
  const answerKeyMatch = text.match(/answer\s*key[:\s]*([\s\S]+)$/i)
  const answerKeyText  = answerKeyMatch ? answerKeyMatch[1].trim() : ''
  const questionsText  = answerKeyMatch ? text.slice(0, answerKeyMatch.index) : text

  const questions = questionsText
    .split(/\n(?=Q?\d+[\.\)])/i)
    .map(q => q.trim())
    .filter(Boolean)

  return (
    <>
      <div className="print-mcq-list">
        {questions.map((q, i) => {
          const lines   = q.split('\n').map(l => l.trim()).filter(Boolean)
          const qText   = lines[0]
          const options = lines.slice(1)
          return (
            <div key={i} className="print-mcq-item">
              <div className="print-mcq-question">{qText}</div>
              {options.map((opt, j) => (
                <div key={j} className="print-mcq-option">{opt}</div>
              ))}
            </div>
          )
        })}
      </div>
      {answerKeyText && (
        <div className="print-answer-key page-break">
          <h2>Answer Key</h2>
          <pre className="print-answer-key-pre">{answerKeyText}</pre>
        </div>
      )}
    </>
  )
}

function QuestionBankContent({ text }) {
  // Split by section headings
  const sections = text.split(/(?=section\s+[A-Z]|2[\s-]mark|5[\s-]mark|10[\s-]mark)/i)
  return (
    <div className="print-qb">
      {sections.map((section, i) => (
        <div key={i} className="print-qb-section">
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(section) }} />
        </div>
      ))}
    </div>
  )
}

function TestPlanContent({ text }) {
  return (
    <div className="print-test-plan">
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
    </div>
  )
}

export function PrintDocument({ generation, college, autoprint }) {
  useEffect(() => {
    if (autoprint) {
      const t = setTimeout(() => window.print(), 600)
      return () => clearTimeout(t)
    }
  }, [autoprint])

  const contentType = generation.content_type

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap');

        * { box-sizing: border-box; }

        body { margin: 0; font-family: 'Inter', sans-serif; font-size: 13px; color: #1a202c; background: #f4f7f6; }

        .print-page {
          max-width: 794px;
          margin: 0 auto;
          padding: 40px;
          background: white;
          min-height: 100vh;
        }

        /* Header */
        .print-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #0D1F3C;
          margin-bottom: 28px;
        }
        .print-header-left { display: flex; align-items: center; gap: 14px; }
        .print-college-name { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px; font-weight: 800; color: #0D1F3C; }
        .print-college-address { font-size: 11px; color: #718096; margin-top: 4px; max-width: 260px; }
        .print-header-right { text-align: right; font-size: 12px; color: #4a5568; }
        .print-meta-line { margin-bottom: 3px; }

        /* Prose */
        .print-prose h1 { font-size: 18px; font-weight: 800; color: #0D1F3C; margin: 20px 0 10px; }
        .print-prose h2 { font-size: 15px; font-weight: 700; color: #0D1F3C; margin: 16px 0 8px; }
        .print-prose h3 { font-size: 13px; font-weight: 700; color: #1a202c; margin: 12px 0 6px; }
        .print-prose p  { margin: 0 0 10px; line-height: 1.7; }
        .print-prose ul { margin: 6px 0 10px 20px; }
        .print-prose li { margin-bottom: 4px; line-height: 1.6; }
        .print-prose strong { font-weight: 700; }

        /* MCQ */
        .print-mcq-item { margin-bottom: 18px; }
        .print-mcq-question { font-weight: 600; margin-bottom: 6px; }
        .print-mcq-option { padding-left: 16px; margin-bottom: 3px; }
        .print-answer-key { margin-top: 32px; padding-top: 20px; border-top: 1px dashed #cbd5e0; }
        .print-answer-key h2 { font-size: 15px; font-weight: 700; color: #0D1F3C; margin-bottom: 12px; }
        .print-answer-key-pre { font-family: monospace; font-size: 12px; white-space: pre-wrap; line-height: 1.8; }

        /* Question Bank */
        .print-qb-section { margin-bottom: 24px; }
        .print-qb-section h2 { font-size: 14px; font-weight: 800; color: #0D1F3C; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }

        /* Test plan */
        .print-test-plan h2 { font-size: 15px; font-weight: 700; color: #0D1F3C; margin: 16px 0 8px; }

        /* No-print toolbar */
        .no-print-bar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          background: #0D1F3C;
          color: white;
          padding: 10px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          font-family: 'Inter', sans-serif;
        }
        .no-print-bar button {
          background: #00B4A6;
          color: #082321;
          border: none;
          padding: 8px 18px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }

        .page-break { page-break-before: always; }

        @media print {
          .no-print-bar { display: none !important; }
          body { background: white; }
          .print-page { padding: 20mm 15mm; max-width: none; min-height: auto; }
          @page { margin: 0; size: A4; }
        }
      `}</style>

      {/* Toolbar (hidden when printing) */}
      <div className="no-print-bar">
        <span>
          <strong>Print Preview</strong> — {generation.content_type?.replace('_', ' ')} ·{' '}
          {generation.topic}
        </span>
        <button onClick={() => window.print()}>🖨 Print / Save as PDF</button>
      </div>

      <div className="print-page" style={{ marginTop: 48 }}>
        <PrintHeader college={college} generation={generation} />

        {contentType === 'lesson_notes'  && <LessonNotesContent  text={generation.raw_output} />}
        {contentType === 'mcq_bank'      && <MCQContent           text={generation.raw_output} />}
        {contentType === 'question_bank' && <QuestionBankContent  text={generation.raw_output} />}
        {contentType === 'test_plan'     && <TestPlanContent      text={generation.raw_output} />}
      </div>
    </>
  )
}
