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

/**
 * @param {string} rawText      - Raw AI output for a test_plan generation
 * @param {number} expectedTotal - The total_marks the user requested
 * @returns {string} - Corrected text
 */
export function fixTestPlanOutput(rawText, expectedTotal) {
  if (!rawText || !expectedTotal) return rawText

  let text = rawText

  // ── 1. Fix "Max Marks: N" header line ────────────────────────────────────
  text = text.replace(/\bMax\s*Marks\s*:\s*\d+/gi, `Max Marks: ${expectedTotal}`)

  // ── 2. Fix the Mark Distribution Table total row ─────────────────────────
  text = fixMarkDistributionTableTotal(text, expectedTotal)

  return text
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
