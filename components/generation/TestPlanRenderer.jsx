'use client'

/**
 * TestPlanRenderer — Phase 50 (revised Phase 50.3)
 *
 * Parses AI-generated internal test plan output and renders it cleanly:
 * - Skips the duplicate AI header (college/subject/marks) — print header shows this
 * - Strips all --- separator lines
 * - Instructions in an amber highlighted box
 * - SECTION A/B/C as navy-bordered prominent headers
 * - Questions with marks right-aligned in brackets
 * - Pipe tables converted to proper <table> elements
 * - Mark Distribution and Topics Coverage styled with navy header row
 */

// ── Pipe table renderer ────────────────────────────────────────────────────────

function PipeTable({ lines }) {
  const rows = lines.filter(l => !/^\s*\|[\s\-|:]+\|\s*$/.test(l))
  if (rows.length < 2) return null

  const parseRow = (line) =>
    line.replace(/^\||\|$/g, '').split('|').map(c => c.trim())

  const [header, ...body] = rows

  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-navy text-white">
            {parseRow(header).map((cell, i) => (
              <th key={i} className="border border-slate-600 px-3 py-2 text-left font-semibold text-xs uppercase tracking-wide">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => {
            const cells = parseRow(row)
            const isTotal = cells[0]?.toLowerCase().trim() === 'total'
            return (
              <tr key={ri} className={
                isTotal
                  ? 'bg-teal-light font-bold border-t-2 border-navy'
                  : ri % 2 === 0 ? 'bg-surface' : 'bg-bg'
              }>
                {cells.map((cell, ci) => (
                  <td key={ci} className="border border-border px-3 py-2 text-text">
                    {cell}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Block parser ───────────────────────────────────────────────────────────────

function parseBlocks(text) {
  // Strip everything before INSTRUCTIONS: — removes the duplicate AI header block
  // (college name, subject, marks) since the outer UI already shows this info.
  const instrIdx = text.search(/^INSTRUCTIONS\s*:/im)
  const body = instrIdx >= 0 ? text.slice(instrIdx) : text

  const rawLines = body.split('\n')
  const blocks = []
  let i = 0

  while (i < rawLines.length) {
    const line = rawLines[i]
    const trimmed = line.trim()

    // Skip blanks and raw --- separator lines
    if (!trimmed || /^-{3,}$/.test(trimmed)) { i++; continue }

    // INSTRUCTIONS block
    if (/^INSTRUCTIONS\s*:/i.test(trimmed)) {
      const items = []
      i++
      while (i < rawLines.length && rawLines[i].trim()) {
        items.push(rawLines[i].trim().replace(/^\d+\.\s*/, ''))
        i++
      }
      blocks.push({ type: 'instructions', items })
      continue
    }

    // SECTION A / B / C
    if (/^SECTION\s+[A-C]\b/i.test(trimmed)) {
      blocks.push({ type: 'section', text: trimmed })
      i++
      continue
    }

    // ## Heading (Mark Distribution / Topics Coverage)
    if (/^#{1,3}\s+/.test(trimmed)) {
      blocks.push({ type: 'heading', text: trimmed.replace(/^#+\s*/, '') })
      i++
      continue
    }

    // Pipe table
    if (trimmed.startsWith('|')) {
      const tableLines = []
      while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
        tableLines.push(rawLines[i])
        i++
      }
      blocks.push({ type: 'table', lines: tableLines })
      continue
    }

    // Question line: Q1. Q2. etc.
    if (/^Q\d+[.)]/i.test(trimmed)) {
      const marksMatch = trimmed.match(/\[(\d+)\s*[Mm]arks?\]/)
      const qText = marksMatch
        ? trimmed.replace(/\s*\[\d+\s*[Mm]arks?\]/, '').trim()
        : trimmed
      blocks.push({ type: 'question', text: qText, marks: marksMatch?.[1] ?? null })
      i++
      continue
    }

    // Regular text
    blocks.push({ type: 'text', text: trimmed })
    i++
  }

  return blocks
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function TestPlanRenderer({ content }) {
  if (!content) return null

  const blocks = parseBlocks(content)

  return (
    <div className="font-sans text-sm text-text space-y-0.5">
      {blocks.map((block, idx) => {
        switch (block.type) {

          case 'instructions':
            return (
              <div key={idx} className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 mb-4 mt-1">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2">
                  Instructions
                </p>
                <ol className="list-decimal list-inside space-y-1 text-amber-900 text-xs">
                  {block.items.map((item, ii) => (
                    <li key={ii}>{item}</li>
                  ))}
                </ol>
              </div>
            )

          case 'section':
            return (
              <div key={idx} className="flex items-center gap-3 mt-5 mb-2 pl-3 border-l-4 border-navy bg-slate-100 py-1.5 rounded-r-lg">
                <p className="font-bold text-navy text-xs uppercase tracking-wider">
                  {block.text}
                </p>
              </div>
            )

          case 'heading':
            return (
              <div key={idx} className="mt-6 mb-2 pb-1.5 border-b-2 border-navy">
                <p className="font-bold text-navy text-sm">{block.text}</p>
              </div>
            )

          case 'table':
            return <PipeTable key={idx} lines={block.lines} />

          case 'question':
            return (
              <div key={idx} className="flex items-start justify-between gap-4 my-1.5 leading-snug">
                <span className="flex-1 font-medium text-text">{block.text}</span>
                {block.marks && (
                  <span className="shrink-0 text-xs font-bold text-navy border border-navy rounded px-1.5 py-0.5">
                    [{block.marks}]
                  </span>
                )}
              </div>
            )

          case 'text':
          default:
            if (!block.text?.trim()) return null
            // Render **bold** markers
            const parts = block.text.split(/\*\*(.+?)\*\*/g)
            return (
              <p key={idx} className="my-1 text-text leading-relaxed text-xs">
                {parts.map((part, pi) =>
                  pi % 2 === 1 ? <strong key={pi}>{part}</strong> : part
                )}
              </p>
            )
        }
      })}
    </div>
  )
}
