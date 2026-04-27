/**
 * buildReferenceBookBlock(books)
 *
 * Generates the REFERENCE MATERIALS section injected into every AI prompt
 * when reference books exist for a subject (Phase 40).
 *
 * Primary book gets explicit preferential weighting.
 * Supplementary books are listed after.
 *
 * Returns an empty string when no books are provided.
 */
export function buildReferenceBookBlock(books = []) {
  if (!books || books.length === 0) return ''

  const primary       = books.filter(b => b.is_primary)
  const supplementary = books.filter(b => !b.is_primary)

  const lines = [
    '',
    '--- REFERENCE MATERIALS ---',
    'The following textbooks are the approved reference materials for this subject.',
    'When generating content:',
    '- Use terminology and notation consistent with these reference materials',
    '- For definitions and formulas, prefer the wording from the PRIMARY reference',
    '- Do not contradict standard content from these references',
    '- Follow the chapter/unit ordering as per the primary reference where applicable',
    '',
  ]

  for (const book of primary) {
    lines.push(`[PRIMARY REFERENCE] "${book.title}" by ${book.author}${book.edition ? ` (${book.edition})` : ''}${book.publisher ? `, ${book.publisher}` : ''}`)
    if (book.chapter_hint) {
      lines.push(`  Chapter guidance: ${book.chapter_hint}`)
    }
  }

  for (const book of supplementary) {
    lines.push(`[SUPPLEMENTARY] "${book.title}" by ${book.author}${book.edition ? ` (${book.edition})` : ''}${book.publisher ? `, ${book.publisher}` : ''}`)
    if (book.chapter_hint) {
      lines.push(`  Chapter guidance: ${book.chapter_hint}`)
    }
  }

  lines.push('--- END REFERENCE MATERIALS ---')
  lines.push('')

  return lines.join('\n')
}
