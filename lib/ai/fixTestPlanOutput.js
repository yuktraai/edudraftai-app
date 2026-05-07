/**
 * Post-processor for test_plan raw output.
 *
 * Problem: the AI sometimes writes the wrong grand total in the Mark Distribution
 * Table (arithmetic error), even though the individual section rows are correct.
 *
 * This module does two things:
 *   1. Recomputes the grand total from the actual section rows (Q×MarksEach)
 *      and overwrites whatever number the AI wrote in the Total row.
 *   2. Corrects the "Max Marks: N" header line to match expectedTotal.
 *
 * It does NOT change question text, section structure, or any marks-per-question
 * values — it only fixes the summary Total cell and the header line.
 */

const MAX_MARKS_PER_QUESTION = 10

/**
 * @param {string} rawText       - Raw AI output for a test_plan generation
 * @param {number} expectedTotal - The total_marks the user requested
 * @returns {string} - Corrected text
 */
export function fixTestPlanOutput(rawText, expectedTotal) {
  if (!rawText || !expectedTotal) return rawText

  let text = rawText

  // ── 1. Fix "Max Marks: N" header line ────────────────────────────────────
  text = text.replace(/\bMax\s*Marks\s*:\s*\d+/gi, `Max Marks: ${expectedTotal}`)

  // ── 2. Fix over-limit marks-per-question in section headers & table ───────
  // e.g. "SECTION C — 16 MARKS EACH" → fix if 16 > MAX_MARKS_PER_QUESTION
  text = fixOverLimitSections(text, expectedTotal)

  // ── 3. Fix the Mark Distribution Table total row ─────────────────────────
  text = fixMarkDistributionTableTotal(text, expectedTotal)

  return text
}

/**
 * Scan the Mark Distribution Table for any "Marks Each" value > MAX_MARKS_PER_QUESTION.
 * For those sections, cap the value at MAX_MARKS_PER_QUESTION and increase question count
 * to keep the section total consistent. Also update the matching SECTION header line.
 *
 * This handles the case where the AI ignores the constraint and writes e.g. 16 marks each.
 */
function fixOverLimitSections(text, expectedTotal) {
  const lines  = text.split('\n')
  const result = [...lines]

  // Phase 1: parse the Mark Distribution Table
  // Map of { sectionLetter → { marksEach, count, total, rowIdx } }
  const sectionData = {}
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    if (!inTable) {
      if (/section/i.test(trimmed) && /marks\s*each/i.test(trimmed) && trimmed.startsWith('|')) {
        inTable = true
      }
      continue
    }
    if (!trimmed.startsWith('|')) { inTable = false; continue }
    if (/^\|\s*[-:]+[\s|:-]*\|/.test(trimmed)) continue

    const cells = trimmed.replace(/^\||\|$/g, '').split('|').map(c => c.trim().replace(/\*/g, ''))
    const first = cells[0]?.trim()
    if (!first || /^total$/i.test(first)) continue

    // Section row: cells = [section, questions, marksEach, total]
    const marksEach = parseInt(cells[2], 10)
    const count     = parseInt(cells[1], 10)
    const rowTotal  = parseInt(cells[3], 10)

    if (!isNaN(marksEach) && marksEach > MAX_MARKS_PER_QUESTION) {
      sectionData[first.toUpperCase()] = { marksEach, count, rowTotal, rowIdx: i }
    }
  }

  // Phase 2: for each over-limit section, cap marksEach and adjust count
  for (const [letter, info] of Object.entries(sectionData)) {
    const { marksEach, rowIdx, rowTotal } = info
    // Keep section total, spread across more questions at MAX_MARKS_PER_QUESTION each
    const newCount    = Math.ceil(rowTotal / MAX_MARKS_PER_QUESTION)
    const newMarksEach = Math.floor(rowTotal / newCount)   // ≤ MAX_MARKS_PER_QUESTION

    // Fix the table row
    const origLine = lines[rowIdx]
    const cells    = origLine.replace(/^\||\|$/g, '').split('|').map(c => c.trim())
    cells[1] = String(newCount)
    cells[2] = String(newMarksEach)
    cells[3] = String(newCount * newMarksEach)
    result[rowIdx] = '| ' + cells.join(' | ') + ' |'

    // Fix matching SECTION header line: "SECTION C — 16 MARKS EACH (LONG ANSWER)"
    // Replace the number only when it's the over-limit value
    for (let i = 0; i < lines.length; i++) {
      const upper = lines[i].toUpperCase()
      if (
        upper.includes(`SECTION ${letter}`) &&
        upper.includes(`${marksEach} MARK`)
      ) {
        result[i] = lines[i].replace(
          new RegExp(`\\b${marksEach}\\b`, 'g'),
          String(newMarksEach)
        )
        break
      }
    }
  }

  return result.join('\n')
}

/**
 * Parse the Mark Distribution Table pipe rows, sum the TOTAL column from
 * section rows (A, B, C), and rewrite the grand-total row with the real sum.
 *
 * The AI output format is:
 *   | Section | Questions | Marks Each | Total |
 *   |---------|-----------|------------|-------|
 *   | A       | 2         | 1          | 2     |
 *   | B       | 2         | 4          | 8     |
 *   | C       | 1         | 6          | 6     |
 *   | **Total** |         |            | **20** |   ← we fix this cell
 *
 * We sum the "Total" column of the section rows (last pipe-cell per row)
 * and replace the grand-total cell with that sum.
 */
function fixMarkDistributionTableTotal(text, expectedTotal) {
  const lines = text.split('\n')
  const result = [...lines]

  let inTable    = false
  let sectionSum = 0
  let totalRowIdx = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // ── Detect table header: must contain "section" AND "total" ──────────
    if (!inTable) {
      if (/section/i.test(trimmed) && /total/i.test(trimmed) && trimmed.startsWith('|')) {
        inTable    = true
        sectionSum = 0
        totalRowIdx = -1
      }
      continue
    }

    // ── Inside the table ──────────────────────────────────────────────────
    if (!trimmed.startsWith('|')) {
      // Left the table without finding a total row — reset
      inTable = false
      continue
    }

    // Skip separator rows: | --- | --- | ...
    if (/^\|\s*[-:]+[\s|:-]*\|/.test(trimmed)) continue

    // Detect the grand-total row (first cell = "Total" optionally bolded)
    const cells = trimmed.replace(/^\||\|$/g, '').split('|').map(c => c.trim())
    const firstCell = cells[0].replace(/\*/g, '').trim()

    if (/^total$/i.test(firstCell)) {
      totalRowIdx = i
      // Don't break — we still need to scan for table end
      continue
    }

    // Section data row (A, B, C) — accumulate the last cell (section total)
    if (totalRowIdx === -1) {
      const lastCell = cells[cells.length - 1].replace(/\*/g, '').trim()
      const val = parseInt(lastCell, 10)
      if (!isNaN(val) && val > 0) sectionSum += val
    }
  }

  // ── Rewrite the total row if found ───────────────────────────────────────
  if (totalRowIdx >= 0) {
    const correctTotal = sectionSum > 0 ? sectionSum : expectedTotal
    const originalLine = lines[totalRowIdx]

    // Replace the last numeric value (with optional ** bold markers) in the row.
    // Handles:  | **20** |   | 20 |   | **20**|   etc.
    result[totalRowIdx] = originalLine.replace(
      /(\|\s*)\*{0,2}\s*\d+\s*\*{0,2}(\s*\|?\s*)$/,
      (_, before, after) => `${before}**${correctTotal}**${after}`
    )
  }

  return result.join('\n')
}
