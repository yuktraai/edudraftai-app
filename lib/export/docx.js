/**
 * lib/export/docx.js — DOCX builder for EduDraftAI (Phase 12)
 *
 * buildDocx({ generation, college, subject, showKey = true })
 *   → returns a Buffer via Packer.toBuffer()
 *
 * Content-type branching:
 *   lesson_notes  → heading hierarchy + paragraphs + bullets
 *   mcq_bank      → numbered questions + indented options + answer key section
 *   question_bank → Section A / B / C headings + numbered questions
 *   test_plan     → instructions block + section headings
 *   exam_paper    → Group A / B / C structured format
 *
 * Math: strip \( \) and \[ \] delimiters, keep LaTeX as plain text
 * Answer key: controlled by showKey param using splitAnswerKey()
 */

import {
  Document, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Packer, BorderStyle, ShadingType,
  UnderlineType,
} from 'docx'
import { splitAnswerKey } from './parseAnswerKey'
import { getAcademicYear } from '@/lib/utils/academicYear'

// ─── Brand colours (as RRGGBB hex, no #) ───────────────────────────────────
const TEAL  = '00B4A6'
const NAVY  = '0D1F3C'
const MUTED = '718096'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Strip LaTeX math delimiters; keep formula text readable as plain text */
function stripMath(text) {
  if (!text) return ''
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, f) => `[${f.trim()}]`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, f) => `(${f.trim()})`)
}

/** Strip inline markdown bold/italic, return plain string */
function plainText(text) {
  return stripMath(text ?? '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
}

/**
 * Parse a line of text with inline bold (**…**) into an array of TextRun objects.
 * Supports: **bold**, *italic*, plain text — all with optional base style.
 */
function inlineRuns(line, baseOpts = {}) {
  const parts = []
  const cleaned = stripMath(line ?? '')
  // Split on **bold** and *italic* markers
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|([^*]+))/g
  let match
  while ((match = regex.exec(cleaned)) !== null) {
    if (match[2] !== undefined) {
      parts.push(new TextRun({ text: match[2], bold: true, ...baseOpts }))
    } else if (match[3] !== undefined) {
      parts.push(new TextRun({ text: match[3], italics: true, ...baseOpts }))
    } else if (match[4] !== undefined) {
      parts.push(new TextRun({ text: match[4], ...baseOpts }))
    }
  }
  return parts.length ? parts : [new TextRun({ text: cleaned, ...baseOpts })]
}

/** Empty paragraph spacer */
const spacer = (pts = 80) => new Paragraph({
  text: '',
  spacing: { after: pts },
})

/** Horizontal rule (thin border paragraph) */
const hr = () => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E2E8F0' } },
  spacing: { after: 120 },
})

// ─── Header builder ──────────────────────────────────────────────────────────

function buildHeader({ college, subject, generation }) {
  const collegeNameText = college?.name ?? 'EduDraftAI College'
  const subjectLine     = [subject?.name, subject?.code].filter(Boolean).join(' · ')
  const semLine         = subject?.semester ? `Semester ${subject.semester}` : ''
  const ayLine          = getAcademicYear()
  const dateLine        = new Date(generation.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const typeLabel       = {
    lesson_notes:  'Lesson Notes',
    mcq_bank:      'MCQ Bank',
    question_bank: 'Question Bank',
    test_plan:     'Internal Assessment Plan',
    exam_paper:    'Exam Paper',
  }[generation.content_type] ?? generation.content_type

  const topicLine = generation.prompt_params?.topic
    ? `Topic: ${generation.prompt_params.topic}`
    : ''

  return [
    // College name — large, navy, centred
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { after: 60 },
      children: [new TextRun({
        text: collegeNameText, bold: true, size: 28, color: NAVY,
        font: 'Calibri',
      })],
    }),

    // Subject line — teal, medium
    ...(subjectLine ? [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { after: 40 },
      children: [new TextRun({ text: subjectLine, size: 22, color: TEAL, font: 'Calibri' })],
    })] : []),

    // Semester + academic year + date
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { after: 40 },
      children: [new TextRun({
        text: [semLine, ayLine, dateLine].filter(Boolean).join('  ·  '),
        size: 20, color: MUTED, font: 'Calibri',
      })],
    }),

    // Content type + topic
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing:   { after: 120 },
      children: [
        new TextRun({ text: typeLabel, bold: true, size: 22, color: NAVY, font: 'Calibri' }),
        ...(topicLine ? [new TextRun({ text: `  —  ${topicLine}`, size: 20, color: MUTED, font: 'Calibri' })] : []),
      ],
    }),

    // Divider line
    hr(),
    spacer(80),
  ]
}

// ─── Footer paragraph ────────────────────────────────────────────────────────

function buildFooter() {
  return [
    spacer(200),
    hr(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({
        text: 'Generated with EduDraftAI · edudraftai.com',
        size: 16, color: MUTED, font: 'Calibri',
      })],
    }),
  ]
}

// ─── Lesson Notes parser ─────────────────────────────────────────────────────

function parseLessonNotes(text) {
  const lines = (text ?? '').split('\n')
  const paras = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // H1
    if (/^# /.test(line)) {
      paras.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 80 },
        children: inlineRuns(line.slice(2)),
      }))
    }
    // H2
    else if (/^## /.test(line)) {
      paras.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 160, after: 60 },
        children: inlineRuns(line.slice(3)),
      }))
    }
    // H3
    else if (/^### /.test(line)) {
      paras.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 120, after: 40 },
        children: inlineRuns(line.slice(4)),
      }))
    }
    // Bullet
    else if (/^[-*] /.test(line)) {
      paras.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: inlineRuns(line.slice(2)),
      }))
    }
    // Numbered list
    else if (/^\d+\. /.test(line)) {
      const numMatch = line.match(/^(\d+)\. (.*)/)
      if (numMatch) {
        paras.push(new Paragraph({
          numbering: { reference: 'default-numbering', level: 0 },
          spacing:   { after: 40 },
          children:  inlineRuns(numMatch[2]),
        }))
      }
    }
    // Blank line
    else if (line.trim() === '') {
      paras.push(spacer(60))
    }
    // Normal paragraph
    else {
      paras.push(new Paragraph({
        spacing: { after: 80 },
        children: inlineRuns(line),
      }))
    }
  }

  return paras
}

// ─── MCQ Bank parser ─────────────────────────────────────────────────────────

function parseMcqBank(text) {
  const paras = []
  const lines = (text ?? '').split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // Question line: Q1. ... or 1. ...
    if (/^Q?\d+[\.\)]\s/.test(line)) {
      paras.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [new TextRun({ text: plainText(line), bold: true, size: 22, font: 'Calibri' })],
      }))
    }
    // Option lines: A) / B) / A. / B. etc.
    else if (/^[A-D][\.\)]\s/.test(line)) {
      paras.push(new Paragraph({
        indent:  { left: 360 },
        spacing: { after: 30 },
        children: [new TextRun({ text: plainText(line), size: 22, font: 'Calibri' })],
      }))
    }
    // Blank
    else if (line === '') {
      paras.push(spacer(40))
    }
    // Other text (section headers etc.)
    else {
      paras.push(new Paragraph({
        spacing: { after: 60 },
        children: inlineRuns(lines[i]),
      }))
    }
    i++
  }

  return paras
}

// ─── Question Bank parser ────────────────────────────────────────────────────

function parseQuestionBank(text) {
  const paras = []
  const lines = (text ?? '').split('\n')

  for (const rawLine of lines) {
    const line = rawLine.trim()

    // Section headings (## Section A / ## Section B / ## Section C)
    if (/^#{1,3}\s/.test(line)) {
      paras.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({
          text: line.replace(/^#+\s/, ''), bold: true, color: NAVY, font: 'Calibri',
        })],
      }))
    }
    // Numbered question
    else if (/^\d+\.\s/.test(line)) {
      paras.push(new Paragraph({
        spacing: { before: 80, after: 40 },
        children: inlineRuns(line),
      }))
    }
    // Blank
    else if (line === '') {
      paras.push(spacer(40))
    }
    else {
      paras.push(new Paragraph({
        spacing: { after: 60 },
        children: inlineRuns(rawLine),
      }))
    }
  }

  return paras
}

// ─── Test Plan parser ────────────────────────────────────────────────────────

function parseTestPlan(text) {
  // Reuse lesson notes parser — test plans are prose + tables + headings
  return parseLessonNotes(text ?? '')
}

// ─── Answer Key section ──────────────────────────────────────────────────────

function buildAnswerKeySection(answerKey) {
  if (!answerKey) return []

  return [
    spacer(160),
    new Paragraph({
      pageBreakBefore: true,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      children: [new TextRun({ text: 'Answer Key', bold: true, color: NAVY, font: 'Calibri' })],
    }),
    hr(),
    spacer(60),
    ...answerKey.split('\n').map(line => {
      const trimmed = line.trim()
      if (!trimmed) return spacer(40)
      // Q1. A — explanation  →  bold Q number, regular rest
      const qMatch = trimmed.match(/^(Q?\d+\.)\s+(.*)/)
      if (qMatch) {
        return new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: qMatch[1] + ' ', bold: true, size: 22, font: 'Calibri' }),
            new TextRun({ text: qMatch[2], size: 22, font: 'Calibri' }),
          ],
        })
      }
      return new Paragraph({
        spacing: { after: 60 },
        children: inlineRuns(line),
      })
    }),
  ]
}

// ─── Main builder ────────────────────────────────────────────────────────────

/**
 * @param {{ generation: object, college: object, subject: object, showKey?: boolean }} opts
 * @returns {Promise<Buffer>}
 */
export async function buildDocx({ generation, college, subject, showKey = true }) {
  const { content: questionsOnly, answerKey } = splitAnswerKey(generation.raw_output ?? '')
  const mainContent = showKey ? (generation.raw_output ?? '') : questionsOnly
  const keyContent  = showKey ? answerKey : null

  // Branch on content type
  let contentParas
  switch (generation.content_type) {
    case 'lesson_notes':
      contentParas = parseLessonNotes(mainContent)
      break
    case 'mcq_bank':
      contentParas = parseMcqBank(questionsOnly) // always parse questions-only part
      break
    case 'question_bank':
      contentParas = parseQuestionBank(questionsOnly)
      break
    case 'test_plan':
      contentParas = parseTestPlan(mainContent)
      break
    case 'exam_paper':
      contentParas = parseQuestionBank(questionsOnly) // same structure
      break
    default:
      contentParas = parseLessonNotes(mainContent)
  }

  const answerKeyParas = keyContent
    ? buildAnswerKeySection(keyContent)
    : []

  const doc = new Document({
    numbering: {
      config: [{
        reference: 'default-numbering',
        levels: [{
          level: 0,
          format: 'decimal',
          text: '%1.',
          alignment: AlignmentType.LEFT,
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }, // ~1.9cm margins
        },
      },
      children: [
        ...buildHeader({ college, subject, generation }),
        ...contentParas,
        ...answerKeyParas,
        ...buildFooter(),
      ],
    }],
  })

  return Packer.toBuffer(doc)
}
