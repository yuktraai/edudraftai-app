/**
 * Prompt builder for Lesson Notes
 *
 * Phase 10C update: subtopics is always an array (multi-select from TopicPicker).
 * Rendered as a bullet list in the prompt for clarity.
 * Phase 48 update: output contracts, difficulty behavioral contracts.
 */
import { MATH_INSTRUCTIONS } from './math-instructions'
import { buildReferenceBookBlock } from '@/lib/ai/buildReferenceBookBlock'
import { DIFFICULTY_CONTRACTS } from './difficulty-definitions'

export function buildLessonNotesPrompt({ topic, subtopics = [], subject_name, semester, difficulty = 'intermediate', referenceBooks = [] }) {
  const subtopicBlock = subtopics.length > 0
    ? subtopics.map(s => `- ${s}`).join('\n')
    : `- ${topic} (full topic overview)`

  // 48.8 — Difficulty behavioral contract
  const difficultyContract = DIFFICULTY_CONTRACTS['lesson_notes']?.[difficulty] ?? ''

  return [
    {
      role: 'system',
      content: `You are an expert educator creating structured lesson notes for diploma engineering students in Odisha following the SCTE & VT curriculum. Your output must be strictly based on the provided topic and subtopics. Do not include content outside the given scope.

Format your response with these exact sections using markdown headings:
## Learning Objectives
## Key Concepts
## Detailed Explanation
## Worked Examples
## Summary

Use clear, simple language suitable for diploma-level students. Include relevant formulas, diagrams described in text, and practical examples from engineering contexts.

OUTPUT CONTRACTS (mandatory — do not deviate):
- Learning Objectives: exactly 4–6 bullet points starting with an action verb
- Key Concepts: define each key term in 1–2 sentences; minimum 3 terms, maximum 8
- Detailed Explanation: minimum 400 words total; give EACH listed subtopic its own
  sub-heading (### Subtopic Name) and at least 100 words of explanation
- Worked Examples: exactly 2 complete examples, each in this structure:
    **Problem Statement:** [what is to be found]
    **Given:** [data/values provided]
    **Formula:** [formula used, in LaTeX]
    **Solution:** [step-by-step numbered steps]
    **Answer:** [final result with unit]
  Each example must come from a DIFFERENT subtopic.
- Summary: exactly 5–7 bullet points; each bullet recaps one key concept only

${buildReferenceBookBlock(referenceBooks)}
${MATH_INSTRUCTIONS}
DIFFICULTY LEVEL — ${(difficulty ?? 'intermediate').toUpperCase()}:${difficultyContract}`,
    },
    {
      role: 'user',
      content: `Generate comprehensive lesson notes for the following:

**Subject**: ${subject_name} (Semester ${semester})
**Topic**: ${topic}
**Subtopics to cover**:
${subtopicBlock}
**Difficulty level**: ${difficulty}

Ensure all listed subtopics are covered thoroughly in the Detailed Explanation section. Include at least 2 worked examples relevant to the topic.`,
    },
  ]
}
