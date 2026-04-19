/**
 * Prompt builder for MCQ Bank
 *
 * Phase 10C update: subtopics is always an array (multi-select from TopicPicker).
 */
import { MATH_INSTRUCTIONS } from './math-instructions'

export function buildMcqBankPrompt({ topic, subtopics = [], subject_name, count = 10, difficulty = 'intermediate' }) {
  const subtopicBlock = subtopics.length > 0
    ? subtopics.map(s => `- ${s}`).join('\n')
    : `- ${topic} (all aspects)`

  return [
    {
      role: 'system',
      content: `You are an expert question-setter for SCTEVT diploma engineering examinations in Odisha. Create multiple choice questions (MCQs) that are clear, unambiguous, and strictly based on the provided topic and subtopics.

Format each MCQ exactly as:
Q{n}. [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

After all questions, add a section:
## Answer Key
Q1. [Correct option letter] - [Brief explanation]
... (one line per question)

Rules:
- All 4 options must be plausible
- Only one option is correct
- No trick questions
- Cover all listed subtopics proportionally
- Mix different cognitive levels (recall, application, analysis)

${MATH_INSTRUCTIONS}`,
    },
    {
      role: 'user',
      content: `Generate ${count} MCQs for the following:

**Subject**: ${subject_name}
**Topic**: ${topic}
**Subtopics to cover**:
${subtopicBlock}
**Difficulty**: ${difficulty}

Distribute questions proportionally across all listed subtopics. Include the complete answer key at the end.`,
    },
  ]
}
