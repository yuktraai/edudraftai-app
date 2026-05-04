'use client'

/**
 * ExamPaperRenderer — viewer-side renderer for exam_paper content type.
 *
 * Parses the AI-generated SCTE&VT exam paper output and renders it cleanly:
 * - Strips the duplicate AI header block (everything before Q1)
 * - Strips ═══ / ─── / --- separator lines
 * - Q1 group: navy header bar + indented a–j sub-parts
 * - Q2 group: navy header bar + indented a–g sub-parts
 * - Q3–Q7: teal-left-bordered rows with right-aligned marks badge
 * - Answer key on a navy-titled section
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractTrailingMarks(str) {
  const m1 = str.match(/^(.*?)\s{2,}(\d+\s*[x×]\s*\d+)\s*$/)
  if (m1) return { text: m1[1].trim(), marks: m1[2].replace(/\s*[x×]\s*/g, ' × ') }
  const m2 = str.match(/^(.*?)\s{2,}(\d+)\s*$/)
  if (m2 && parseInt(m2[2]) >= 2 && parseInt(m2[2]) <= 100)
    return { text: m2[1].trim(), marks: m2[2] }
  const m3 = str.match(/^(.*?)\s*\[(\d+)(?:\s*[Mm]arks?)?\]\s*$/)
  if (m3) return { text: m3[1].trim(), marks: m3[2] }
  return { text: str.trim(), marks: null }
}

function collectSubParts(lines, startIdx) {
  const subs = []
  let j = startIdx
  while (j < lines.length) {
    const raw = lines[j]
    const ln  = raw.trim()
    if (!ln) { j++; continue }
    if (/^[═=─\-]{3,}$/.test(ln) || /^---/.test(ln)) { j++; break }
    if (/^\s*[2-7][.\s]/.test(raw)) break
    const m = ln.match(/^([a-j])[.)]\s*(.+)/i)
    if (m) { subs.push({ label: m[1].toLowerCase() + '.', text: m[2].trim() }); j++ }
    else { j++ }
  }
  return { subs, nextIdx: j }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function QGroup({ num, label, marks, subs }) {
  return (
    <div className="mb-6">
      {/* Group header */}
      <div className="flex items-center gap-2 bg-slate-100 border-l-4 border-navy px-3 py-2 rounded-r-md mb-3">
        <span className="font-extrabold text-navy text-sm min-w-[22px]">{num}.</span>
        <span className="flex-1 font-bold text-navy text-sm">{label}</span>
        {marks && (
          <span className="text-xs font-extrabold text-white bg-navy rounded px-2.5 py-0.5 whitespace-nowrap shrink-0">
            {marks}
          </span>
        )}
      </div>
      {/* Sub-parts */}
      {subs.length > 0 && (
        <div className="pl-8 border-l-2 border-border ml-2.5 space-y-1.5">
          {subs.map((s, i) => (
            <div key={i} className="flex gap-2.5 text-sm leading-relaxed">
              <span className="font-bold text-navy min-w-[22px] shrink-0">{s.label}</span>
              <span className="flex-1 text-text">{s.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LongQuestion({ num, text, marks }) {
  return (
    <div className="flex items-start gap-3 my-2.5 px-3 py-2.5 border border-border rounded-md border-l-4 border-l-teal text-sm leading-relaxed">
      <span className="font-extrabold text-navy min-w-[18px] shrink-0 text-[13px]">{num}</span>
      <span className="flex-1 text-text">{text}</span>
      {marks && (
        <span className="shrink-0 text-xs font-bold text-navy border-1.5 border-navy rounded px-2 py-0.5 whitespace-nowrap">
          [{marks}]
        </span>
      )}
    </div>
  )
}

// ── Answer key section ────────────────────────────────────────────────────────

function AnswerKeySection({ rawText }) {
  if (!rawText?.trim()) return null
  const lines = rawText.split('\n')
  const items = []

  for (const line of lines) {
    const ln = line.trim()
    if (!ln || /^---/.test(ln) || /^[═=]{3,}$/.test(ln)) continue

    if (/^Q[.\s]?\d/i.test(ln) && !/^([a-j])[.)]/i.test(ln)) {
      items.push({ type: 'section', text: ln })
      continue
    }
    const sp = ln.match(/^([a-j])[.)]\s*(.+)/i)
    if (sp) { items.push({ type: 'sub', label: sp[1].toLowerCase() + '.', text: sp[2] }); continue }
    const bullet = ln.match(/^[•\-\*]\s+(.+)/)
    if (bullet) { items.push({ type: 'bullet', text: bullet[1] }); continue }
    items.push({ type: 'text', text: ln })
  }

  return (
    <div className="mt-8 pt-6 border-t-2 border-navy">
      <div className="bg-navy text-white font-extrabold text-xs uppercase tracking-widest px-3 py-2 rounded mb-5">
        Answer Key
      </div>
      {items.map((item, i) => {
        if (item.type === 'section')
          return <p key={i} className="font-bold text-navy text-sm border-b border-border pb-1 mt-5 mb-2">{item.text}</p>
        if (item.type === 'sub')
          return (
            <div key={i} className="flex gap-2 text-xs ml-4 my-1.5 leading-relaxed">
              <strong className="text-navy min-w-[20px]">{item.label}</strong>
              <span className="text-text">{item.text}</span>
            </div>
          )
        if (item.type === 'bullet')
          return <p key={i} className="text-xs ml-4 my-1 text-text">• {item.text}</p>
        // bold **text**
        const parts = item.text.split(/\*\*(.+?)\*\*/g)
        return (
          <p key={i} className="text-xs text-muted my-1 leading-relaxed">
            {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-text">{p}</strong> : p)}
          </p>
        )
      })}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ExamPaperRenderer({ content }) {
  if (!content) return null

  // Split off answer key
  const DELIM    = '--- ANSWER KEY ---'
  const delimIdx = content.indexOf(DELIM)
  const qPart    = delimIdx !== -1 ? content.slice(0, delimIdx) : content
  const akPart   = delimIdx !== -1 ? content.slice(delimIdx)    : ''

  const lines = qPart.split('\n')
  const blocks = []
  let i = 0

  // Skip AI header block — find first "1." line
  while (i < lines.length && !/^\s*1[.\s]/.test(lines[i])) { i++ }

  while (i < lines.length) {
    const raw  = lines[i]
    const line = raw.trim()

    if (!line || /^[═=─\-]{3,}$/.test(line) || /^---/.test(line)) { i++; continue }

    // Q1
    if (/^\s*1[.\s]/.test(raw)) {
      const clean = line.replace(/^\s*1[.\s]\s*/, '')
      const { text: label, marks } = extractTrailingMarks(clean)
      i++
      const { subs, nextIdx } = collectSubParts(lines, i)
      i = nextIdx
      blocks.push({ type: 'qgroup', num: '1', label, marks, subs })
      continue
    }

    // Q2
    if (/^\s*2[.\s]/.test(raw)) {
      const clean = line.replace(/^\s*2[.\s]\s*/, '')
      const { text: label, marks } = extractTrailingMarks(clean)
      i++
      const { subs, nextIdx } = collectSubParts(lines, i)
      i = nextIdx
      blocks.push({ type: 'qgroup', num: '2', label, marks, subs })
      blocks.push({ type: 'divider' })
      continue
    }

    // Q3–Q7
    const longMatch = raw.match(/^\s*([3-7])\s+(.+)$/)
    if (longMatch) {
      const num = longMatch[1]
      const { text, marks } = extractTrailingMarks(longMatch[2].trim())
      blocks.push({ type: 'longq', num, text, marks })
      i++
      continue
    }

    i++
  }

  return (
    <div className="font-sans text-sm text-text space-y-0.5">
      {blocks.map((block, idx) => {
        if (block.type === 'qgroup')
          return <QGroup key={idx} num={block.num} label={block.label} marks={block.marks} subs={block.subs} />
        if (block.type === 'divider')
          return <hr key={idx} className="border-t-2 border-dashed border-border my-5" />
        if (block.type === 'longq')
          return <LongQuestion key={idx} num={block.num} text={block.text} marks={block.marks} />
        return null
      })}

      <AnswerKeySection rawText={akPart} />
    </div>
  )
}
