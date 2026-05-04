'use client'

/**
 * TestPlanRenderer — Phase 50
 *
 * Parses the AI-generated internal test plan output and renders it with
 * proper structure: college header, meta row, instructions box, section
 * headers, question list, and pipe-table-to-HTML conversion.
 *
 * Used only when contentType === 'test_plan' in OutputViewer.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converts a markdown pipe-table string into an HTML <table> element.
 * Returns null if the lines don't look like a table.
 */
function PipeTable({ lines }) {
  // Filter out separator rows (---|---|---)
  const rows = lines.filter(l => !/^\s*\|[\s\-|:]+\|\s*$/.test(l))
  if (rows.length < 2) return null

  const parseRow = (line) =>
    line.replace(/^\||\|$/g, '').split('|').map(c => c.trim())

  const [header, ...body] = rows

  return (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse border border-border">
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
          {body.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-surface' : 'bg-bg'}>
              {parseRow(row).map((cell, ci) => (
                <td key={ci} className="border border-border px-3 py-2 text-text">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Groups consecutive lines into logical blocks:
 * - table blocks (lines starting with |)
 * - section headers (SECTION A / B / C)
 * - the paper header block (first lines before INSTRUCTIONS)
 * - instructions block
 * - question lines (Q1. Q2. etc.)
 * - regular text / separators
 */
function parseBlocks(text) {
  const rawLines = text.split('\n')
  const blocks = []
  let i = 0

  while (i < rawLines.length) {
    const line = rawLines[i]

    // Skip raw separator lines (---)
    if (/^---+\s*$/.test(line.trim())) {
      i++
      continue
    }

    // Pipe table — collect all consecutive pipe lines
    if (line.trim().startsWith('|')) {
      const tableLines = []
      while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
        tableLines.push(rawLines[i])
        i++
      }
      blocks.push({ type: 'table', lines: tableLines })
      continue
    }

    // Section header: SECTION A, SECTION B, SECTION C
    if (/^SECTION\s+[A-C]\b/i.test(line.trim())) {
      blocks.push({ type: 'section', text: line.trim() })
      i++
      continue
    }

    // INSTRUCTIONS block
    if (/^INSTRUCTIONS\s*:/i.test(line.trim())) {
      const instrLines = []
      while (i < rawLines.length) {
        const l = rawLines[i].trim()
        // Instructions block ends at first blank line after at least 2 lines
        if (instrLines.length > 1 && l === '') break
        instrLines.push(rawLines[i])
        i++
      }
      blocks.push({ type: 'instructions', lines: instrLines })
      continue
    }

    // Mark Distribution Table / Topics Coverage Map headings (## heading)
    if (/^#{1,3}\s+(Mark Distribution|Topics Coverage)/i.test(line.trim())) {
      blocks.push({ type: 'section-heading', text: line.replace(/^#+\s*/, '').trim() })
      i++
      continue
    }

    // Question line: Q1. / Q2. etc.
    if (/^Q\d+[.)]/i.test(line.trim())) {
      blocks.push({ type: 'question', text: line.trim() })
      i++
      continue
    }

    // Sub-item (a. b. c.) under a question
    if (/^\s{2,}[a-j][.)]/i.test(line)) {
      blocks.push({ type: 'sub-item', text: line.trim() })
      i++
      continue
    }

    // Blank line
    if (line.trim() === '') {
      blocks.push({ type: 'blank' })
      i++
      continue
    }

    // Everything else — plain text
    blocks.push({ type: 'text', text: line })
    i++
  }

  return blocks
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TestPlanRenderer({ content }) {
  if (!content) return null

  // Split into: header block (before INSTRUCTIONS) + body
  const instrIdx = content.search(/^INSTRUCTIONS\s*:/im)
  let headerRaw = instrIdx > -1 ? content.slice(0, instrIdx) : ''
  let bodyRaw   = instrIdx > -1 ? content.slice(instrIdx)    : content

  // Clean leading/trailing --- from header
  headerRaw = headerRaw.replace(/^---+\n?/m, '').replace(/\n?---+$/m, '').trim()

  // Parse the header block into lines
  const headerLines = headerRaw.split('\n').map(l => l.trim()).filter(Boolean)

  // First line = college name + INTERNAL ASSESSMENT TEST
  const collegeLine = headerLines[0] ?? ''
  // Second line = Subject | Semester | Date
  const metaLine    = headerLines[1] ?? ''
  // Third line = Max Marks | Duration | etc.
  const marksLine   = headerLines[2] ?? ''

  const metaParts  = metaLine.split('|').map(p => p.trim()).filter(Boolean)
  const marksParts = marksLine.split('|').map(p => p.trim()).filter(Boolean)

  // Parse blocks for body
  const blocks = parseBlocks(bodyRaw)

  return (
    <div className="font-sans text-sm text-text max-w-3xl mx-auto">

      {/* ── College Header ─────────────────────────────────────────────── */}
      {collegeLine && (
        <div className="text-center mb-3">
          <p className="text-base font-bold text-navy uppercase tracking-wide">
            {collegeLine}
          </p>
        </div>
      )}

      {/* ── Meta rows ─────────────────────────────────────────────────── */}
      {(metaParts.length > 0 || marksParts.length > 0) && (
        <div className="border border-border rounded-lg px-4 py-3 mb-4 bg-bg text-xs space-y-1.5">
          {metaParts.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {metaParts.map((p, i) => {
                const [label, ...rest] = p.split(':')
                const value = rest.join(':').trim()
                return (
                  <span key={i} className="text-muted">
                    <span className="font-semibold text-text">{label.trim()}: </span>
                    {value || label.trim()}
                  </span>
                )
              })}
            </div>
          )}
          {marksParts.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {marksParts.map((p, i) => {
                const [label, ...rest] = p.split(':')
                const value = rest.join(':').trim()
                return (
                  <span key={i} className="text-muted">
                    <span className="font-semibold text-text">{label.trim()}: </span>
                    {value || label.trim()}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Body blocks ───────────────────────────────────────────────── */}
      {blocks.map((block, idx) => {
        switch (block.type) {

          case 'instructions':
            return (
              <div key={idx} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-xs text-amber-900">
                {block.lines.map((l, li) => (
                  <p key={li} className={li === 0 ? 'font-semibold mb-1' : 'ml-1'}>
                    {l.replace(/^INSTRUCTIONS\s*:\s*/i, l.startsWith('INSTRUCTION') ? 'Instructions:' : '')}
                  </p>
                ))}
              </div>
            )

          case 'section':
            return (
              <div key={idx} className="mt-5 mb-2 border-l-4 border-navy pl-3 py-1 bg-navy/5 rounded-r-lg">
                <p className="font-bold text-navy text-sm uppercase tracking-wide">
                  {block.text}
                </p>
              </div>
            )

          case 'section-heading':
            return (
              <div key={idx} className="mt-6 mb-2 pt-4 border-t border-border">
                <p className="font-bold text-navy text-sm">{block.text}</p>
              </div>
            )

          case 'table':
            return <PipeTable key={idx} lines={block.lines} />

          case 'question':
            return (
              <p key={idx} className="my-1.5 font-medium text-text">
                {block.text}
              </p>
            )

          case 'sub-item':
            return (
              <p key={idx} className="ml-6 my-0.5 text-muted">
                {block.text}
              </p>
            )

          case 'blank':
            return <div key={idx} className="h-1" />

          case 'text':
          default:
            if (!block.text?.trim()) return null
            // Bold any **text** markers
            const parts = block.text.split(/\*\*(.+?)\*\*/g)
            return (
              <p key={idx} className="my-1 text-text leading-relaxed">
                {parts.map((part, pi) =>
                  pi % 2 === 1
                    ? <strong key={pi}>{part}</strong>
                    : part
                )}
              </p>
            )
        }
      })}
    </div>
  )
}
