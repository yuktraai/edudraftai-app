/**
 * Phase 13 — Answer Key Parser
 *
 * MCQ and question bank prompts include the answer key wrapped in delimiters:
 *   --- ANSWER KEY ---
 *   ...answers...
 *   --- END ANSWER KEY ---
 *
 * splitAnswerKey(rawOutput) → { content, answerKey }
 *   content   — everything before the delimiter (questions only)
 *   answerKey — the answer key section, or null if not found
 */

const DELIMITER_START = '--- ANSWER KEY ---'
const DELIMITER_END   = '--- END ANSWER KEY ---'

/**
 * @param {string} rawOutput
 * @returns {{ content: string, answerKey: string | null }}
 */
export function splitAnswerKey(rawOutput) {
  if (!rawOutput) return { content: '', answerKey: null }

  const startIdx = rawOutput.indexOf(DELIMITER_START)
  if (startIdx === -1) {
    // No delimiter — check for legacy "## Answer Key" heading used before Phase 13
    const legacyIdx = rawOutput.search(/^#{1,3}\s+Answer Key/im)
    if (legacyIdx === -1) return { content: rawOutput, answerKey: null }
    return {
      content:   rawOutput.slice(0, legacyIdx).trimEnd(),
      answerKey: rawOutput.slice(legacyIdx).trim(),
    }
  }

  const endIdx = rawOutput.indexOf(DELIMITER_END, startIdx)
  const content   = rawOutput.slice(0, startIdx).trimEnd()
  const answerKey = endIdx === -1
    ? rawOutput.slice(startIdx + DELIMITER_START.length).trim()
    : rawOutput.slice(startIdx + DELIMITER_START.length, endIdx).trim()

  return { content, answerKey: answerKey || null }
}
