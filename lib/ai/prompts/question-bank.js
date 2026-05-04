/**
 * Prompt builder for Question Bank (SCTE & VT exam format)
 *
 * Phase 36 update: enforces professional SCTE&VT formatting —
 * exam header block, standard instructions, marks on each question,
 * proper section headers, end-of-paper marker.
 */
import { MATH_INSTRUCTIONS } from './math-instructions'
import { buildReferenceBookBlock } from '@/lib/ai/buildReferenceBookBlock'

export function buildQuestionBankPrompt({
  topic,
  subtopics = [],
  subject_name,
  semester,
  marks_2  = 5,
  marks_5  = 4,
  marks_10 = 2,
  referenceBooks = [],
}) {
  const subtopicBlock = subtopics.length > 0
    ? subtopics.map(s => `- ${s}`).join('\n')
    : `- ${topic} (all aspects)`

  const totalMarks = marks_2 * 2 + marks_5 * 5 + marks_10 * 10

  return [
    {
      role: 'system',
      content: `You are an expert question-setter for SCTE & VT Odisha diploma engineering examinations. Generate a professional question bank strictly following the SCTE&VT format.

Your response MUST begin with an exam header block in EXACTLY this format:
Subject: [subject name]
Subject Code: [derive a plausible code or leave blank if unknown]
Semester: [n]
Full Marks: [total]
Time: [calculate: 2 min per 2-mark Q + 8 min per 5-mark Q + 20 min per 10-mark Q, round to nearest 30 min] Hours

Instructions:
(1) All questions are compulsory.
(2) Figures in brackets indicate marks.
(3) Answer each question in the prescribed format.

Then output sections in EXACTLY this structure:

SECTION A — Very Short Answer Questions (2 Marks Each)

Q1. [question text] [2 Marks]
Q2. [question text] [2 Marks]
(continue for all Section A questions)

SECTION B — Short Answer Questions (5 Marks Each)

Q[n+1]. [question text] [5 Marks]
(continue for all Section B questions)

SECTION C — Long Answer Questions (10 Marks Each)

Q[n+1]. [question text] [10 Marks]
(continue for all Section C questions)

*** End of Question Paper ***

Rules:
- Question numbering is continuous across all sections (Q1, Q2, Q3…)
- Marks MUST appear at the end of every question in format: [X Marks]
- SECTION headers must be ALL CAPS, on their own line, with a blank line before and after
- 2-mark questions: definitions, state/list, short facts, formulae recall
- 5-mark questions: explain, describe, derive, compare, calculate with steps
- 10-mark questions: elaborate, design, solve complex problems, draw and explain
- Questions must only cover the listed subtopics
- Do NOT mix question types within a section

After *** End of Question Paper ***, output the answer key wrapped EXACTLY in:
--- ANSWER KEY ---
SECTION A Answers
Q1. [model answer / key points — 2–3 lines max]
Q2. [model answer]
...

SECTION B Answers
Q[n]. [key points outline — 5–6 bullet points]
...

SECTION C Answers
Q[n]. [detailed outline with all steps/points]
...
--- END ANSWER KEY ---

The --- ANSWER KEY --- block is MANDATORY.

${buildReferenceBookBlock(referenceBooks)}${MATH_INSTRUCTIONS}`,
    },
    {
      role: 'user',
      content: `Generate a complete question bank for:

**Subject**: ${subject_name} (Semester ${semester})
**Topic**: ${topic}
**Subtopics to cover**:
${subtopicBlock}

Required:
- Section A: ${marks_2} questions × 2 marks = ${marks_2 * 2} marks
- Section B: ${marks_5} questions × 5 marks = ${marks_5 * 5} marks
- Section C: ${marks_10} questions × 10 marks = ${marks_10 * 10} marks
- Total: ${totalMarks} marks

Ensure questions span all listed subtopics proportionally and match SCTE & VT difficulty standards.`,
    },
  ]
}
