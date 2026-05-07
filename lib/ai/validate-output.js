const MAX_MARKS_PER_QUESTION = 10

/**
 * Post-generation structural validation.
 * Returns an array of flag strings (empty = clean output).
 */
export function validateOutput(content_type, raw_output, promptParams) {
  const flags = []

  if (content_type === 'test_plan') {
    const expectedTotal = promptParams?.total_marks
    if (expectedTotal) {
      // Check for any section header carrying more than MAX_MARKS_PER_QUESTION marks
      // e.g. "SECTION C — 16 MARKS EACH (LONG ANSWER)"
      const sectionHeaderMatches = [...raw_output.matchAll(/SECTION\s+[A-C][^—\n]*[—-]\s*(\d+)\s*MARKS?\s*EACH/gi)]
      for (const m of sectionHeaderMatches) {
        const marksEach = parseInt(m[1], 10)
        if (marksEach > MAX_MARKS_PER_QUESTION) {
          flags.push(`marks_per_question_exceeded:section_has_${marksEach}_marks_each`)
        }
      }

      // Also check the Mark Distribution Table "Marks Each" column
      const tableRowMatches = [...raw_output.matchAll(/\|\s*[A-C]\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/gi)]
      for (const m of tableRowMatches) {
        const marksEach = parseInt(m[2], 10)
        if (marksEach > MAX_MARKS_PER_QUESTION) {
          flags.push(`marks_per_question_exceeded:table_row_has_${marksEach}_marks_each`)
        }
      }
    }
  }

  if (content_type === 'mcq_bank') {
    if (!raw_output.includes('--- ANSWER KEY ---'))
      flags.push('missing_answer_key')
    const qCount   = (raw_output.match(/^Q\d+\./gm) ?? []).length
    const expected = promptParams?.count ?? 10
    if (qCount < Math.floor(expected * 0.9))
      flags.push(`low_question_count:got_${qCount}_expected_${expected}`)
  }

  if (['exam_paper', 'question_bank'].includes(content_type)) {
    if (!raw_output.includes('--- ANSWER KEY ---'))
      flags.push('missing_answer_key')
    if (!raw_output.match(/end of question paper/i))
      flags.push('missing_end_marker')
  }

  if (content_type === 'lesson_notes') {
    const required = ['## Learning Objectives', '## Key Concepts', '## Detailed Explanation', '## Worked Examples', '## Summary']
    const missing  = required.filter(h => !raw_output.includes(h))
    if (missing.length > 0)
      flags.push(`missing_sections:${missing.map(h => h.replace('## ', '')).join(',')}`)
  }

  return flags
}
