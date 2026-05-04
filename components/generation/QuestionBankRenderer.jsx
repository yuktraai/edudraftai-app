'use client'

/**
 * QuestionBankRenderer — viewer-side renderer for question_bank content type.
 *
 * Parses the AI-generated SCTE&VT question bank output and renders it cleanly:
 * - Strips the duplicate AI header block (Subject / Code / Semester / Marks / Instructions)
 * - SECTION A/B/C as navy left-bordered headers with marks badge
 * - Q\d+ questions with right-aligned [N] marks badge and KaTeX for math
 * - *** End of Question Paper *** styled end marker
 * - Answer key on a navy-titled section
 */

import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// ── Math rendering helper ─────────────────────────────────────────────────────

function renderMathText(str) {
  if (!str) return ''
  const slots = []
  let text = str

  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, f) => {
    try { slots.push(`<div class="katex-block">${katex.renderToString(f.trim(), { displayMode: true, throwOnError: false, output: 'html' })}</div>`) }
    catch { slots.push(`<code>\\[${f}\\]</code>`) }
    return `\x00${slots.length - 1}\x00`
  })
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, f) => {
    try { slots.push(katex.renderToString(f.trim(), { displayMode: false, throwOnError: false, output: 'html' })) }
    catch { slots.push(`<code>\\(${f}\\)</code>`) }
    return `\x00${slots.length - 1}\x00`
  })

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  text = escHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\x00(\d+)\x00/g, (_, i) => slots[parseInt(i)])
  return text
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label, marksEach }) {
  return (
    <div className="flex items-center justify-between gap-3 border-l-4 border-navy bg-slate-100 px-3 py-2 rounded-r-md mt-6 mb-3">
      <span className="font-extrabold text-navy text-xs uppercase tracking-wide flex-1">
        {label}
      </span>
      {marksEach && (
        <span className="text-xs font-extrabold text-white bg-navy rounded px-2.5 py-0.5 whitespace-nowrap shrink-0">
          {marksEach} Marks Each
        </span>
      )}
    </div>
  )
}

function QuestionRow({ qText, marks }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = renderMathText(qText)
  }, [qText])

  return (
    <div className="flex items-start justify-between gap-3 my-2 leading-relaxed page-break-inside-avoid">
      <span ref={ref} className="flex-1 text-sm text-text" />
      {marks && (
        <span className="shrink-0 text-xs font-bold text-navy border border-navy rounded px-1.5 py-0.5 whitespace-nowrap">
          [{marks}]
        </span>
      )}
    </div>
  )
}

function MathLine({ text }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = renderMathText(text)
  }, [text])
  return <p ref={ref} className="text-xs text-muted my-1 leading-relaxed" />
}

// ── Answer key section ────────────────────────────────────────────────────────

function QBAnswerKey({ rawText }) {
  if (!rawText?.trim()) return null
  const lines = rawText.split('\n')
  const items = []

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || /^---/.test(line) || /^[═=]{3,}$/.test(line)) continue
    if (/^SECTION\s+[A-C]/i.test(line)) { items.push({ type: 'section', text: line }); continue }
    const qm = line.match(/^(Q\d+)[.)]\s*(.+)/i)
    if (qm) { items.push({ type: 'qitem', label: qm[1], text: qm[2] }); continue }
    const bullet = line.match(/^[•\-\*]\s+(.+)/)
    if (bullet) { items.push({ type: 'bullet', text: bullet[1] }); continue }
    items.push({ type: 'text', text: line })
  }

  return (
    <div className="mt-8 pt-6 border-t-2 border-navy">
      <div className="bg-navy text-white font-extrabold text-xs uppercase tracking-widest px-3 py-2 rounded mb-5">
        Answer Key
      </div>
      {items.map((item, idx) => {
        if (item.type === 'section')
          return (
            <p key={idx} className="font-bold text-navy text-xs uppercase tracking-wide border-b border-border pb-1 mt-5 mb-2">
              {item.text}
            </p>
          )
        if (item.type === 'qitem')
          return (
            <div key={idx} className="flex gap-2 text-xs ml-3 my-1.5 leading-relaxed">
              <strong className="text-navy min-w-[30px] shrink-0">{item.label}.</strong>
              <MathLine text={item.text} />
            </div>
          )
        if (item.type === 'bullet')
          return <p key={idx} className="text-xs ml-6 my-1 text-muted">• <MathLine text={item.text} /></p>
        return <MathLine key={idx} text={item.text} />
      })}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function QuestionBankRenderer({ content }) {
  if (!content) return null

  const DELIM    = '--- ANSWER KEY ---'
  const delimIdx = content.indexOf(DELIM)
  const qPart    = delimIdx !== -1 ? content.slice(0, delimIdx) : content
  const akPart   = delimIdx !== -1 ? content.slice(delimIdx)    : ''

  const lines = qPart.split('\n')
  const blocks = []
  let i = 0

  // Skip duplicate header block — find first SECTION line
  while (i < lines.length && !/^SECTION\s+[A-C]/i.test(lines[i].trim())) { i++ }

  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) { i++; continue }

    if (/^\*+\s*End of Question Paper/i.test(line) || /^End of Question Paper/i.test(line)) {
      blocks.push({ type: 'end' })
      i++; continue
    }

    if (/^SECTION\s+[A-C]/i.test(line)) {
      const marksEach = line.match(/\((\d+)\s*[Mm]arks?\s*[Ee]ach\)/)
      const label     = line.replace(/\(\d+\s*[Mm]arks?\s*[Ee]ach\)/, '').trim()
      blocks.push({ type: 'section', label, marksEach: marksEach?.[1] ?? null })
      i++; continue
    }

    if (/^Q\d+[.)]/i.test(line)) {
      const marksMatch = line.match(/\[(\d+)\s*[Mm]arks?\]\s*$/)
      const marks      = marksMatch ? marksMatch[1] : null
      const qText      = marks
        ? line.replace(/\s*\[\d+\s*[Mm]arks?\]\s*$/, '').trim()
        : line
      blocks.push({ type: 'question', qText, marks })
      i++; continue
    }

    blocks.push({ type: 'text', text: line })
    i++
  }

  return (
    <div className="font-sans text-sm text-text space-y-0.5">
      {blocks.map((block, idx) => {
        if (block.type === 'section')
          return <SectionHeader key={idx} label={block.label} marksEach={block.marksEach} />
        if (block.type === 'question')
          return <QuestionRow key={idx} qText={block.qText} marks={block.marks} />
        if (block.type === 'text')
          return <MathLine key={idx} text={block.text} />
        if (block.type === 'end')
          return (
            <p key={idx} className="text-center text-xs text-muted border-t border-dashed border-border pt-3 mt-6">
              — End of Question Paper —
            </p>
          )
        return null
      })}

      <QBAnswerKey rawText={akPart} />
    </div>
  )
}
