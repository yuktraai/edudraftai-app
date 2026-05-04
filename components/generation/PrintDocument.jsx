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
          <div className="print-college-sub">SCTE & VT Affiliated Polytechnic · Odisha</div>
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

// ── Test Plan HTML builder (pure JS → HTML string for dangerouslySetInnerHTML) ──
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildPipeTable(lines) {
  const rows = lines.filter(l => !/^\s*\|[\s\-|:]+\|\s*$/.test(l))
  if (rows.length < 2) return ''
  const parseRow = l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim())
  const [header, ...body] = rows
  const thead = '<thead><tr>' +
    parseRow(header).map(c => `<th>${escHtml(c)}</th>`).join('') +
    '</tr></thead>'
  const tbody = '<tbody>' +
    body.map(row => {
      const cells = parseRow(row)
      const isTotal = cells[0]?.toLowerCase().trim() === 'total'
      return `<tr${isTotal ? ' class="tp-table-total"' : ''}>` +
        cells.map(c => `<td>${escHtml(c)}</td>`).join('') +
        '</tr>'
    }).join('') +
    '</tbody>'
  return `<table class="tp-table">${thead}${tbody}</table>`
}

function buildTestPlanHtml(rawText) {
  if (!rawText) return ''

  // Strip everything before INSTRUCTIONS: — removes the duplicate AI-generated header
  // (college name, subject, marks) since the PrintHeader already shows this info.
  const instrIdx = rawText.search(/^INSTRUCTIONS\s*:/im)
  const body = instrIdx >= 0 ? rawText.slice(instrIdx) : rawText

  const lines = body.split('\n')
  const parts = []
  let i = 0

  while (i < lines.length) {
    const raw     = lines[i]
    const line    = raw.trim()

    // Skip blank lines and raw --- separator lines
    if (!line || /^-{3,}$/.test(line)) { i++; continue }

    // INSTRUCTIONS block — collect numbered items until blank line
    if (/^INSTRUCTIONS\s*:/i.test(line)) {
      const items = []
      i++
      while (i < lines.length && lines[i].trim()) {
        items.push(lines[i].trim().replace(/^\d+\.\s*/, ''))
        i++
      }
      parts.push(
        `<div class="tp-instructions">` +
        `<div class="tp-instr-label">Instructions</div>` +
        `<ol class="tp-instr-list">` +
        items.map(t => `<li>${escHtml(t)}</li>`).join('') +
        `</ol></div>`
      )
      continue
    }

    // SECTION A / B / C header
    if (/^SECTION\s+[A-C]\b/i.test(line)) {
      parts.push(`<div class="tp-section-hdr">${escHtml(line)}</div>`)
      i++
      continue
    }

    // ## Heading (Mark Distribution Table / Topics Coverage Map)
    if (/^#{1,3}\s+/.test(line)) {
      const heading = line.replace(/^#+\s*/, '')
      parts.push(`<div class="tp-table-title">${escHtml(heading)}</div>`)
      i++
      continue
    }

    // Pipe table — collect all consecutive pipe lines
    if (line.startsWith('|')) {
      const tableLines = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      parts.push(buildPipeTable(tableLines))
      continue
    }

    // Question line: Q1. Q2. Q3. etc.
    if (/^Q\d+[.)]/i.test(line)) {
      const marksMatch = line.match(/\[(\d+)\s*[Mm]arks?\]/)
      const qText = marksMatch
        ? line.replace(/\s*\[\d+\s*[Mm]arks?\]/, '').trim()
        : line
      if (marksMatch) {
        parts.push(
          `<div class="tp-question">` +
          `<span class="tp-q-text">${escHtml(qText)}</span>` +
          `<span class="tp-q-marks">[${marksMatch[1]}]</span>` +
          `</div>`
        )
      } else {
        parts.push(
          `<div class="tp-question"><span class="tp-q-text">${escHtml(line)}</span></div>`
        )
      }
      i++
      continue
    }

    // Regular text — bold any **text**
    const boldified = escHtml(line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    parts.push(`<p class="tp-text">${boldified}</p>`)
    i++
  }

  return parts.join('\n')
}

function TestPlanContent({ text, college, generation, subjectInfo, lecturer }) {
  const date  = formatDate(generation.created_at)
  const topic = generation.prompt_params?.topic ?? ''

  // Replace AI-generated placeholders with real values before parsing
  const processed = (text ?? '')
    .replace(/\[COLLEGE NAME\]/gi, college?.name ?? '')
    .replace(/\[DATE\]/gi,         date)
    .replace(/\[Date\]/g,          date)
    .replace(/\[SUBJECT\]/gi,      subjectInfo?.name ?? '')
    .replace(/\[SEMESTER\]/gi,     subjectInfo?.semester ? `Semester ${subjectInfo.semester}` : '')
    .replace(/\[LECTURER\]/gi,     lecturer?.name ?? '')
    .replace(/\[TOPIC\]/gi,        topic)

  return (
    <div
      className="print-test-plan"
      dangerouslySetInnerHTML={{ __html: buildTestPlanHtml(processed) }}
    />
  )
}

// ── Exam Paper HTML builder ────────────────────────────────────────────────────

/**
 * Extract trailing marks notation from a line.
 * Handles: "... 2 x 10", "... 6 x 5", "... 10" (after ≥2 spaces)
 */
function extractTrailingMarks(str) {
  // "N x M" or "N × M" at end after whitespace
  const m1 = str.match(/^(.*?)\s{2,}(\d+\s*[x×]\s*\d+)\s*$/)
  if (m1) return { text: m1[1].trim(), marks: m1[2].replace(/\s*[x×]\s*/g, ' × ') }
  // Single number at end after ≥2 spaces (must be a plausible marks value 2–100)
  const m2 = str.match(/^(.*?)\s{2,}(\d+)\s*$/)
  if (m2 && parseInt(m2[2]) >= 2 && parseInt(m2[2]) <= 100)
    return { text: m2[1].trim(), marks: m2[2] }
  // Inline [N marks] or [N] fallback
  const m3 = str.match(/^(.*?)\s*\[(\d+)(?:\s*[Mm]arks?)?\]\s*$/)
  if (m3) return { text: m3[1].trim(), marks: m3[2] }
  return { text: str.trim(), marks: null }
}

/**
 * Collect sub-parts (a. … j.) from lines starting at startIdx.
 * Stops when a new main question line (2–7) or separator is found.
 */
function collectExamSubParts(lines, startIdx) {
  const subs = []
  let j = startIdx
  while (j < lines.length) {
    const raw = lines[j]
    const ln  = raw.trim()
    // Blank lines: keep scanning (AI often adds blank lines between sub-parts)
    if (!ln) { j++; continue }
    // Stop on separator or next main question
    if (/^[═=─\-]{3,}$/.test(ln) || /^---/.test(ln)) { j++; break }
    if (/^\s*[2-7][.\s]/.test(raw)) break
    // Sub-part letter: "a. text", "b) text", "  a.  text"
    const m = ln.match(/^([a-j])[.)]\s*(.+)/i)
    if (m) { subs.push({ label: m[1].toLowerCase() + '.', text: m[2].trim() }); j++ }
    else { j++ } // skip unrecognised lines inside sub-part block
  }
  return { subs, nextIdx: j }
}

/**
 * Render the answer key block (everything after "--- ANSWER KEY ---").
 */
function buildAnswerKeyHtml(rawText) {
  if (!rawText?.trim()) return ''
  const lines = rawText.split('\n')
  const out   = ['<div class="ep-answer-key page-break">']
  out.push('<div class="ep-ak-title">Answer Key</div>')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || /^---/.test(line) || /^[═=]{3,}$/.test(line)) continue

    // Section header: "Q.1 Answers…" / "Q.3 – Q.7 Outline…"
    if (/^Q[.\s]?\d/i.test(line) && !/^([a-j])[.)]/i.test(line)) {
      out.push(`<div class="ep-ak-section-title">${escHtml(line)}</div>`)
      continue
    }
    // Sub-part answer: "a. answer text"
    const spMatch = line.match(/^([a-j])[.)]\s*(.+)/i)
    if (spMatch) {
      out.push(`<div class="ep-ak-item"><strong>${escHtml(spMatch[1].toLowerCase())}.</strong> ${escHtml(spMatch[2])}</div>`)
      continue
    }
    // Bullet / dash items
    const bullet = line.match(/^[•\-\*]\s+(.+)/)
    if (bullet) {
      out.push(`<div class="ep-ak-item ep-ak-bullet">• ${escHtml(bullet[1])}</div>`)
      continue
    }
    // Regular line — bold **text** markers
    const boldified = escHtml(line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    out.push(`<p class="ep-ak-text">${boldified}</p>`)
  }
  out.push('</div>')
  return out.join('\n')
}

/**
 * Main exam paper builder.
 * - Strips the duplicate AI header block (everything before "1.")
 * - Strips ═══ / ─── / --- separator lines
 * - Renders Q1 group (header + indented a–j sub-parts)
 * - Renders Q2 group (header + indented a–g sub-parts)
 * - Renders Q3–Q7 as standalone long-question rows with right-margin marks
 * - Optionally renders the answer key on a new page
 */
function buildExamPaperHtml(rawText) {
  if (!rawText) return ''

  // Split answer key
  const DELIM    = '--- ANSWER KEY ---'
  const delimIdx = rawText.indexOf(DELIM)
  const qPart    = delimIdx !== -1 ? rawText.slice(0, delimIdx) : rawText
  const akPart   = delimIdx !== -1 ? rawText.slice(delimIdx)    : ''

  const lines = qPart.split('\n')
  const parts = []
  let i = 0

  // Skip AI-generated header block — jump to the first "1." main question
  while (i < lines.length && !/^\s*1[.\s]/.test(lines[i])) { i++ }

  while (i < lines.length) {
    const raw  = lines[i]
    const line = raw.trim()

    // Skip blank / separator lines
    if (!line || /^[═=─\-]{3,}$/.test(line) || /^---/.test(line)) { i++; continue }

    // ── Q1 group ──────────────────────────────────────────────────────────────
    if (/^\s*1[.\s]/.test(raw)) {
      const clean = line.replace(/^\s*1[.\s]\s*/, '')
      const { text: label, marks } = extractTrailingMarks(clean)
      i++
      const { subs, nextIdx } = collectExamSubParts(lines, i)
      i = nextIdx

      let html =
        `<div class="ep-q-group">` +
        `<div class="ep-q-header">` +
        `<span class="ep-q-num">1.</span>` +
        `<span class="ep-q-header-text">${escHtml(label)}</span>` +
        (marks ? `<span class="ep-q-marks">${escHtml(marks)}</span>` : '') +
        `</div>`
      if (subs.length) {
        html += `<div class="ep-subparts">`
        subs.forEach(s => {
          html +=
            `<div class="ep-subpart">` +
            `<span class="ep-subpart-label">${escHtml(s.label)}</span>` +
            `<span class="ep-subpart-text">${escHtml(s.text)}</span>` +
            `</div>`
        })
        html += `</div>`
      }
      html += `</div>`
      parts.push(html)
      continue
    }

    // ── Q2 group ──────────────────────────────────────────────────────────────
    if (/^\s*2[.\s]/.test(raw)) {
      const clean = line.replace(/^\s*2[.\s]\s*/, '')
      const { text: label, marks } = extractTrailingMarks(clean)
      i++
      const { subs, nextIdx } = collectExamSubParts(lines, i)
      i = nextIdx

      let html =
        `<div class="ep-q-group">` +
        `<div class="ep-q-header">` +
        `<span class="ep-q-num">2.</span>` +
        `<span class="ep-q-header-text">${escHtml(label)}</span>` +
        (marks ? `<span class="ep-q-marks">${escHtml(marks)}</span>` : '') +
        `</div>`
      if (subs.length) {
        html += `<div class="ep-subparts">`
        subs.forEach(s => {
          html +=
            `<div class="ep-subpart">` +
            `<span class="ep-subpart-label">${escHtml(s.label)}</span>` +
            `<span class="ep-subpart-text">${escHtml(s.text)}</span>` +
            `</div>`
        })
        html += `</div>`
      }
      html += `</div>`

      // Visual divider before long questions
      parts.push(html)
      parts.push('<div class="ep-long-divider"></div>')
      continue
    }

    // ── Q3–Q7 standalone long questions ───────────────────────────────────────
    const longMatch = raw.match(/^\s*([3-7])\s+(.+)$/)
    if (longMatch) {
      const num = longMatch[1]
      const { text, marks } = extractTrailingMarks(longMatch[2].trim())
      parts.push(
        `<div class="ep-long-q">` +
        `<span class="ep-long-q-num">${escHtml(num)}</span>` +
        `<span class="ep-long-q-text">${escHtml(text)}</span>` +
        (marks ? `<span class="ep-long-q-marks">${escHtml(marks)}</span>` : '') +
        `</div>`
      )
      i++
      continue
    }

    i++
  }

  const questionsHtml = `<div class="ep-questions">${parts.join('\n')}</div>`
  const akHtml        = akPart.trim() ? buildAnswerKeyHtml(akPart) : ''
  return questionsHtml + akHtml
}

// ─── Exam Paper Content ───────────────────────────────────────────────────────

function ExamPaperContent({ text, generation, subjectInfo }) {
  const totalMarks = generation.prompt_params?.total_marks ?? 80
  const duration   = generation.prompt_params?.duration_mins ?? 180
  const hrs        = Math.floor(duration / 60)
  const durationLabel = `${hrs} Hour${hrs !== 1 ? 's' : ''}`

  return (
    <div className="exam-paper">
      {/* Instructions box */}
      <div className="exam-instructions">
        <div className="exam-instr-row">
          <span><strong>Full Marks:</strong> {totalMarks}</span>
          <span><strong>Time:</strong> {durationLabel}</span>
        </div>
        <div className="exam-instr-note">
          <strong>Instructions:</strong> Answer any five Questions including Q No.1 &amp; 2.
          Figures in the right hand margin indicate marks.
        </div>
        <div className="exam-roll">Roll No: ___________________________</div>
      </div>

      {/* Questions + Answer Key */}
      <div dangerouslySetInnerHTML={{ __html: buildExamPaperHtml(text ?? '') }} />
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

        /* ── Test Plan — structured layout ── */
        .print-test-plan { font-size: 12px; }

        .tp-instructions {
          background: #fffbeb; border: 1.5px solid #f59e0b;
          border-radius: 6px; padding: 9px 14px 11px; margin: 10px 0 18px;
        }
        .tp-instr-label {
          font-weight: 700; font-size: 10.5px; text-transform: uppercase;
          letter-spacing: 0.06em; color: #92400e; margin-bottom: 5px;
        }
        .tp-instr-list { margin: 0; padding-left: 18px; color: #78350f; }
        .tp-instr-list li { margin-bottom: 3px; line-height: 1.55; }

        .tp-section-hdr {
          border-left: 4px solid #0D1F3C; padding: 5px 12px;
          background: #f1f5f9; font-weight: 700; font-size: 11.5px;
          text-transform: uppercase; letter-spacing: 0.05em; color: #0D1F3C;
          margin: 18px 0 8px; border-radius: 0 4px 4px 0;
        }

        .tp-question {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin: 7px 0; gap: 16px; line-height: 1.55; page-break-inside: avoid;
        }
        .tp-q-text { flex: 1; }
        .tp-q-marks {
          font-weight: 700; font-size: 10.5px; color: #0D1F3C;
          white-space: nowrap; flex-shrink: 0; border: 1px solid #0D1F3C;
          border-radius: 3px; padding: 1px 6px;
        }

        .tp-table-title {
          font-weight: 700; font-size: 12px; color: #0D1F3C;
          margin: 22px 0 6px; padding-bottom: 4px; border-bottom: 2px solid #0D1F3C;
        }
        .tp-table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin: 4px 0 18px; }
        .tp-table th {
          background: #0D1F3C; color: #fff; padding: 5px 10px;
          font-weight: 600; font-size: 10.5px; text-align: left;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .tp-table td { border: 1px solid #e2e8f0; padding: 5px 10px; }
        .tp-table tr:nth-child(even) td { background: #f8fafc; }
        .tp-table-total td { font-weight: 700; background: #e6fffa !important; border-top: 2px solid #0D1F3C; }
        .tp-text { margin: 0 0 6px; line-height: 1.65; }

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

        /* CSS page counter — use browser's native counter (starts at 1, no reset needed) */
        @media screen { .print-page-num::after { content: ""; } }
        @media print  { .print-page-num::after { content: "Page " counter(page); } }

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

        /* ── Exam Paper — instructions box ── */
        .exam-instructions {
          border: 1.5px solid #0D1F3C; border-radius: 4px;
          padding: 12px 16px; margin-bottom: 24px; font-size: 12px;
        }
        .exam-instr-row {
          display: flex; justify-content: space-between; gap: 16px;
          margin-bottom: 8px; font-size: 12.5px; font-weight: 600;
        }
        .exam-instr-note { margin-bottom: 8px; line-height: 1.6; font-size: 12px; }
        .exam-roll { font-size: 12px; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 8px; }

        /* ── Exam Paper — question body ── */
        .ep-questions { font-size: 12px; }

        /* Q1 / Q2 group */
        .ep-q-group { margin: 20px 0 24px; }
        .ep-q-header {
          display: flex; align-items: center; gap: 10px;
          background: #f1f5f9; border-left: 4px solid #0D1F3C;
          padding: 7px 12px 7px 10px; border-radius: 0 5px 5px 0; margin-bottom: 10px;
        }
        .ep-q-num {
          font-weight: 800; color: #0D1F3C; min-width: 22px;
          font-size: 13.5px; flex-shrink: 0;
        }
        .ep-q-header-text { flex: 1; font-weight: 700; color: #0D1F3C; font-size: 12.5px; }
        .ep-q-marks {
          font-weight: 800; font-size: 11px; color: #fff;
          background: #0D1F3C; border-radius: 4px; padding: 2px 10px;
          white-space: nowrap; flex-shrink: 0; letter-spacing: 0.03em;
        }

        /* Sub-parts (a. … j.) */
        .ep-subparts {
          padding-left: 32px; border-left: 2px solid #e2e8f0; margin-left: 10px;
        }
        .ep-subpart {
          display: flex; gap: 10px; margin: 5px 0; line-height: 1.65;
          font-size: 12px; page-break-inside: avoid;
        }
        .ep-subpart-label {
          font-weight: 700; color: #0D1F3C; min-width: 22px; flex-shrink: 0;
        }
        .ep-subpart-text { flex: 1; }

        /* Divider between Q2 and long questions */
        .ep-long-divider {
          border-top: 1.5px dashed #cbd5e0; margin: 20px 0 16px;
        }

        /* Q3–Q7 long questions */
        .ep-long-q {
          display: flex; align-items: flex-start; gap: 14px;
          margin: 10px 0; padding: 9px 12px 9px 10px;
          line-height: 1.65; font-size: 12px; page-break-inside: avoid;
          border: 1px solid #e2e8f0; border-radius: 4px;
          border-left: 4px solid #00B4A6;
        }
        .ep-long-q-num {
          font-weight: 800; color: #0D1F3C; min-width: 18px; flex-shrink: 0;
          font-size: 13px;
        }
        .ep-long-q-text { flex: 1; color: #1a202c; }
        .ep-long-q-marks {
          font-weight: 700; font-size: 11px; color: #0D1F3C;
          border: 1.5px solid #0D1F3C; border-radius: 4px; padding: 2px 8px;
          white-space: nowrap; flex-shrink: 0;
        }

        /* Answer key section */
        .ep-answer-key { margin-top: 36px; }
        .ep-ak-title {
          background: #0D1F3C; color: #fff; font-weight: 800; font-size: 13px;
          padding: 8px 14px; border-radius: 4px; margin-bottom: 20px;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .ep-ak-section-title {
          font-weight: 700; font-size: 12.5px; color: #0D1F3C;
          border-bottom: 1.5px solid #e2e8f0; padding: 10px 0 5px; margin: 20px 0 8px;
        }
        .ep-ak-item {
          margin: 6px 0 6px 16px; font-size: 12px; line-height: 1.7;
        }
        .ep-ak-bullet { list-style: none; }
        .ep-ak-text { margin: 4px 0; font-size: 12px; line-height: 1.65; color: #4a5568; }

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
          />
        )}

        <PrintFooter lecturer={lecturer} college={college} />
      </div>
    </>
  )
}
