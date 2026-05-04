/**
 * Prompt builder for MCQ Bank
 *
 * Phase 10C update: subtopics is always an array (multi-select from TopicPicker).
 */
import { MATH_INSTRUCTIONS } from './math-instructions'
import { buildReferenceBookBlock } from '@/lib/ai/buildReferenceBookBlock'

export function buildMcqBankPrompt({ topic, subtopics = [], subject_name, count = 10, difficulty = 'intermediate', referenceBooks = [] }) {
  const subtopicBlock = subtopics.length > 0
    ? subtopics.map(s => `- ${s}`).join('\n')
    : `- ${topic} (all aspects)`

  return [
    {
      role: 'system',
      content: `You are an expert question-setter for SCTE & VT diploma engineering examinations in Odisha. Create multiple choice questions (MCQs) that are clear, unambiguous, and strictly based on the provided topic and subtopics.

Format each MCQ exactly as:
Q{n}. [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

After ALL questions, place the complete answer key wrapped EXACTLY in these delimiters (no variation):
--- ANSWER KEY ---
Q1. [Correct option letter] — [Brief explanation]
Q2. [Correct option letter] — [Brief explanation]
... (one line per question)
--- END ANSWER KEY ---

Rules:
- All 4 options must be plausible
- Only one option is correct
- No trick questions
- Cover all listed subtopics proportionally
- Mix different cognitive levels (recall, application, analysis)
- The --- ANSWER KEY --- delimiter is MANDATORY — do not omit it
${buildReferenceBookBlock(referenceBooks)}
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
