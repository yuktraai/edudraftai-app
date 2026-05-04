/**
 * Post-generation structural validation.
 * Returns an array of flag strings (empty = clean output).
 */
export function validateOutput(content_type, raw_output, promptParams) {
  const flags = []

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
