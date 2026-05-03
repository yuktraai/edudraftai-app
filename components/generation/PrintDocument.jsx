'use client'

import { useEffect } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { splitAnswerKey } from '@/lib/export/parseAnswerKey'
import { getAcademicYear } from '@/lib/utils/academicYear'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function renderContent(text) {
  if (!text) return ''
  let html = text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>(\n|$))+/gs, m => `<ul>${m}</ul>`)
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<[hulo])(.+)$/gm, line => line.trim() ? `<p>${line}</p>` : '')
  // Block math: \[ ... \]
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, formula) => {
    try {
      return '<div class="katex-block">' + katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false, output: 'html' }) + '</div>'
    } catch { return `<div class="math-error">\\[${formula}\\]</div>` }
  })
  // Inline math: \( ... \)
  html = html.replace(/\\\(([\s\S]*?)\\\)/g, (_, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false, output: 'html' })
    } catch { return `<span class="math-error">\\(${formula}\\)</span>` }
  })
  return html
}

const TYPE_LABELS = {
  lesson_notes:  'Lesson Notes',
  mcq_bank:      'MCQ Bank',
  question_bank: 'Question Bank',
  test_plan:     'Internal Assessment Test',
  exam_paper:    'Examination Paper',
}

// ─── Print Header ─────────────────────────────────────────────────────────────

function PrintHeader({ college, subjectInfo, generation }) {
  const date = formatDate(generation.created_at)
  const topic = generation.prompt_params?.topic ?? '—'

  return (
    <div className="print-header">
      {/* Left: logo + college name */}
      <div className="print-header-left">
        {college.logo_url && (
          <img
            src={college.logo_url}
            alt={college.name}
            className="print-logo"
          />
        )}
        <div className="print-college-info">
          <div className="print-college-name">{college.name}</div>
          <div className="print-college-sub">SCTEVT Affiliated Polytechnic · Odisha</div>
        </div>
      </div>

      {/* Vertical divider */}
      <div className="print-header-divider" />

      {/* Right: document metadata */}
      <div className="print-header-right">
        <div className="print-doc-type">{TYPE_LABELS[generation.content_type] ?? generation.content_type}</div>
        {subjectInfo.department_name && (
          <div className="print-meta-line"><strong>Dept:</strong> {subjectInfo.department_name}</div>
        )}
        {subjectInfo.semester && (
          <div className="print-meta-line"><strong>Semester:</strong> {subjectInfo.semester}</div>
        )}
        <div className="print-meta-line"><strong>Subject:</strong> {subjectInfo.name}</div>
        <div className="print-meta-line"><strong>Topic:</strong> {topic}</div>
        <div className="print-meta-line"><strong>Date:</strong> {date}</div>
        <div className="print-meta-line"><strong>Academic Year:</strong> {getAcademicYear()}</div>
      </div>
    </div>
  )
}

// ─── Print Footer ─────────────────────────────────────────────────────────────

function PrintFooter({ lecturer, college }) {
  return (
    <div className="print-footer">
      <div className="print-footer-left">
        {lecturer?.name && (
          <span>Prepared by: <strong>{lecturer.name}</strong></span>
        )}
        {college?.name && (
          <span className="print-footer-sep"> · {college.name}</span>
        )}
      </div>
      <div className="print-footer-center">
        www.edudraftai.com
      </div>
      <div className="print-footer-right">
        <span className="print-page-num" />
      </div>
    </div>
  )
}

// ─── Content Renderers ────────────────────────────────────────────────────────

function LessonNotesContent({ text }) {
  return (
    <div
      className="print-prose"
      dangerouslySetInnerHTML={{ __html: renderContent(text) }}
    />
  )
}

function MCQContent({ text }) {
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
  const sections = text.split(/(?=section\s+[A-Z]|2[\s-]mark|5[\s-]mark|10[\s-]mark)/i)
  return (
    <div className="print-qb">
      {sections.map((section, i) => (
        <div key={i} className="print-qb-section">
          <div dangerouslySetInnerHTML={{ __html: renderContent(section) }} />
        </div>
      ))}
    </div>
  )
}

function TestPlanContent({ text, college, generation, subjectInfo, lecturer }) {
  const date    = formatDate(generation.created_at)
  const topic   = generation.prompt_params?.topic ?? ''

  // Replace common AI-generated placeholders with real values
  const processed = (text ?? '')
    .replace(/\[COLLEGE NAME\]/gi, college?.name ?? '')
    .replace(/\[DATE\]/gi, date)
    .replace(/\[Date\]/g, date)
    .replace(/\[SUBJECT\]/gi, subjectInfo?.name ?? '')
    .replace(/\[SEMESTER\]/gi, subjectInfo?.semester ? `Semester ${subjectInfo.semester}` : '')
    .replace(/\[LECTURER\]/gi, lecturer?.name ?? '')
    .replace(/\[TOPIC\]/gi, topic)

  return (
    <div className="print-test-plan">
      <div dangerouslySetInnerHTML={{ __html: renderContent(processed) }} />
    </div>
  )
}

// ─── Exam Paper Content ───────────────────────────────────────────────────────

function ExamPaperContent({ text, generation, subjectInfo, showKey }) {
  const examType = generation.prompt_params?.exam_type ?? 'end_semester'
  const totalMarks = generation.prompt_params?.total_marks ?? 100
  const duration = generation.prompt_params?.duration_mins ?? 180

  // Split questions from answer key using delimiter
  const DELIM = '--- ANSWER KEY ---'
  const delimIdx = text?.indexOf(DELIM) ?? -1
  const questionsText = delimIdx !== -1 ? text.slice(0, delimIdx).trimEnd() : (text ?? '')

  return (
    <div className="exam-paper">
      {/* Instructions box */}
      <div className="exam-instructions">
        <div className="exam-instr-row">
          <span><strong>Time:</strong> {Math.floor(duration / 60)} Hour{duration > 60 ? 's' : ''}</span>
          <span><strong>Full Marks:</strong> {totalMarks}</span>
          <span><strong>All questions are compulsory in Group A</strong></span>
        </div>
        <div className="exam-instr-note">
          <strong>Instructions:</strong> Answer all questions in Group A. Attempt any 5 from Group B. Attempt any 2 from Group C. Start each group on a new page.
        </div>
        <div className="exam-roll">Roll No: ___________________________</div>
      </div>

      {/* Questions */}
      <div
        className="print-qb"
        dangerouslySetInnerHTML={{ __html: renderContent(questionsText) }}
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PrintDocument({ generation, college, subjectInfo = {}, lecturer, autoprint, showKey = true }) {
  useEffect(() => {
    if (autoprint) {
      const t = setTimeout(() => window.print(), 700)
      return () => clearTimeout(t)
    }
  }, [autoprint])

  const contentType = generation.content_type

  // Filter answer key from raw_output when showKey=false
  const { content: questionsOnly } = splitAnswerKey(generation.raw_output ?? '')
  const printContent = showKey ? (generation.raw_output ?? '') : questionsOnly

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        body {
          margin: 0;
          font-family: 'Inter', Arial, sans-serif;
          font-size: 13px;
          color: #1a202c;
          background: #f4f7f6;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* ── Screen wrapper ── */
        .print-page {
          max-width: 794px;
          margin: 56px auto 40px;   /* 56px top clears the toolbar */
          padding: 32px 40px 40px;
          background: white;
          min-height: 1123px;       /* A4 height approx */
          box-shadow: 0 4px 32px rgba(0,0,0,.08);
          border-radius: 4px;
        }

        /* ── Header ── */
        .print-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding-bottom: 16px;
          border-bottom: 2.5px solid #0D1F3C;
          margin-bottom: 26px;
        }
        .print-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }
        .print-logo {
          width: 64px;
          height: 64px;
          object-fit: contain;
          border-radius: 8px;
          flex-shrink: 0;
          border: 1px solid #e2e8f0;
          padding: 3px;
          background: #fff;
        }
        .print-college-info { display: flex; flex-direction: column; justify-content: center; min-width: 0; }
        .print-college-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 17px; font-weight: 800; color: #0D1F3C; line-height: 1.25;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .print-college-sub {
          font-size: 11px; color: #718096; margin-top: 3px; font-weight: 500; letter-spacing: .01em;
        }
        .print-header-divider {
          width: 1.5px;
          align-self: stretch;
          background: #e2e8f0;
          flex-shrink: 0;
          border-radius: 2px;
        }
        .print-header-right {
          text-align: right;
          font-size: 11.5px;
          color: #4a5568;
          flex-shrink: 0;
          min-width: 220px;
        }
        .print-doc-type {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px; font-weight: 700; color: #00B4A6;
          text-transform: uppercase; letter-spacing: .06em; margin-bottom: 7px;
        }
        .print-meta-line { margin-bottom: 3px; line-height: 1.6; }

        /* ── Prose ── */
        .print-prose h1 { font-size: 17px; font-weight: 800; color: #0D1F3C; margin: 22px 0 10px; }
        .print-prose h2 { font-size: 14px; font-weight: 700; color: #0D1F3C; margin: 18px 0 8px; }
        .print-prose h3 { font-size: 13px; font-weight: 700; color: #1a202c; margin: 12px 0 6px; }
        .print-prose p  { margin: 0 0 10px; line-height: 1.75; }
        .print-prose ul { margin: 6px 0 12px 20px; }
        .print-prose li { margin-bottom: 4px; line-height: 1.65; }
        .print-prose strong { font-weight: 700; }

        /* ── MCQ ── */
        .print-mcq-item     { margin-bottom: 20px; page-break-inside: avoid; }
        .print-mcq-question { font-weight: 600; margin-bottom: 6px; line-height: 1.5; }
        .print-mcq-option   { padding-left: 20px; margin-bottom: 3px; }
        .print-answer-key   { margin-top: 32px; padding-top: 20px; border-top: 1px dashed #cbd5e0; }
        .print-answer-key h2 { font-size: 14px; font-weight: 700; color: #0D1F3C; margin-bottom: 12px; }
        .print-answer-key-pre { font-family: monospace; font-size: 12px; white-space: pre-wrap; line-height: 1.9; }

        /* ── Question Bank ── */
        .print-qb-section   { margin-bottom: 26px; }
        .print-qb-section h2 {
          font-size: 13px; font-weight: 800; color: #0D1F3C;
          border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px;
        }

        /* ── Test Plan ── */
        .print-test-plan h1 { font-size: 16px; font-weight: 800; color: #0D1F3C; margin: 0 0 14px; text-align: center; }
        .print-test-plan h2 { font-size: 13px; font-weight: 700; color: #0D1F3C; margin: 18px 0 8px; }
        .print-test-plan h3 { font-size: 12px; font-weight: 700; color: #1a202c; margin: 12px 0 6px; }
        .print-test-plan p  { margin: 0 0 8px; line-height: 1.7; }
        .print-test-plan ul,
        .print-test-plan ol { margin: 4px 0 10px 20px; }
        .print-test-plan li { margin-bottom: 4px; line-height: 1.6; }
        .print-test-plan table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
        .print-test-plan td,
        .print-test-plan th  { border: 1px solid #e2e8f0; padding: 6px 10px; text-align: left; }
        .print-test-plan th  { background: #f4f7f6; font-weight: 700; color: #0D1F3C; }

        /* ── Footer ── */
        .print-footer {
          margin-top: 40px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #718096;
        }
        .print-footer-left  { flex: 1; }
        .print-footer-center { flex: 1; text-align: center; color: #00B4A6; font-weight: 600; letter-spacing: .01em; }
        .print-footer-right  { flex: 1; text-align: right; }
        .print-footer-sep { margin-left: 2px; }

        /* CSS counter for page numbers */
        @page { counter-increment: page; }
        .print-page-num::after { content: "Page " counter(page); }

        /* ── Toolbar (screen only) ── */
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
          gap: 12px;
        }
        .no-print-bar-title { font-weight: 600; }
        .no-print-bar-meta  { font-size: 12px; color: #94a3b8; }
        .no-print-bar button {
          background: #00B4A6;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
        }
        .no-print-bar button:hover { background: #00d4c4; }

        .page-break { page-break-before: always; }

        /* ── Exam Paper ── */
        .exam-instructions {
          border: 1.5px solid #0D1F3C;
          border-radius: 4px;
          padding: 12px 16px;
          margin-bottom: 24px;
          font-size: 12px;
        }
        .exam-instr-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 8px;
          font-size: 12px;
        }
        .exam-instr-note { margin-bottom: 8px; line-height: 1.6; }
        .exam-roll { font-size: 12px; margin-top: 8px; }

        /* ── Print media ── */
        @media print {
          .no-print-bar { display: none !important; }
          body          { background: white !important; }
          .print-page   {
            margin: 0 !important;
            padding: 18mm 15mm 20mm 15mm !important;
            max-width: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            min-height: auto !important;
          }
          /* margin: 0 removes the browser's native header/footer (URL, date, title) */
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>

      {/* Screen toolbar — hidden on print */}
      <div className="no-print-bar">
        <div>
          <div className="no-print-bar-title">
            {TYPE_LABELS[contentType] ?? contentType} — Print Preview
            {(contentType === 'mcq_bank' || contentType === 'question_bank') && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: showKey ? '#00B4A6' : '#94a3b8' }}>
                ({showKey ? 'with answer key' : 'questions only'})
              </span>
            )}
          </div>
          <div className="no-print-bar-meta">
            {subjectInfo?.name}{subjectInfo?.semester ? ` · Semester ${subjectInfo.semester}` : ''}
            {generation.prompt_params?.topic ? ` · ${generation.prompt_params.topic}` : ''}
          </div>
        </div>
        <button onClick={() => window.print()}>🖨 Print / Save as PDF</button>
      </div>

      <div className="print-page">
        <PrintHeader
          college={college}
          subjectInfo={subjectInfo}
          generation={generation}
        />

        {contentType === 'lesson_notes'  && <LessonNotesContent text={printContent} />}
        {contentType === 'mcq_bank'      && <MCQContent          text={printContent} />}
        {contentType === 'question_bank' && <QuestionBankContent text={printContent} />}
        {contentType === 'test_plan'     && (
          <TestPlanContent
            text={printContent}
            college={college}
            generation={generation}
            subjectInfo={subjectInfo}
            lecturer={lecturer}
          />
        )}
        {contentType === 'exam_paper' && (
          <ExamPaperContent
            text={printContent}
            generation={generation}
            subjectInfo={subjectInfo}
            showKey={showKey}
          />
        )}

        <PrintFooter lecturer={lecturer} college={college} />
      </div>
    </>
  )
}
