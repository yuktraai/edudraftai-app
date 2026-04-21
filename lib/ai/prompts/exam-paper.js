/**
 * Exam Paper prompt builder — SCTE&VT polytechnic pattern
 * Phase 17
 */
import { MATH_INSTRUCTIONS } from './math-instructions'

const PATTERNS = {
  mid_semester: {
    label:    'Mid-Semester (50 Marks)',
    groupA:   { count: 10, marks: 1, type: 'MCQ (Objective)' },
    groupB:   { count: 5,  marks: 4, type: 'Short Answer' },
    groupC:   { count: 1,  marks: 10, type: 'Long Answer / Numerical' },
    total:    50,
    duration: 90,
  },
  end_semester: {
    label:    'End-Semester (100 Marks)',
    groupA:   { count: 10, marks: 1,  type: 'MCQ (Objective)' },
    groupB:   { count: 5,  marks: 6,  type: 'Short Answer / Descriptive' },
    groupC:   { count: 2,  marks: 10, type: 'Long Answer / Numerical / Design' },
    total:    100,
    duration: 180,
  },
}

export function buildExamPaperPrompt({ topics = [], subject_name, semester, exam_type = 'end_semester', total_marks, duration_mins }) {
  const pattern = PATTERNS[exam_type] ?? PATTERNS.end_semester
  const topicsBlock = topics.length > 0 ? topics.join(', ') : subject_name

  return [
    {
      role: 'system',
      content: `You are an expert question-setter for SCTE&VT Odisha diploma engineering examinations. Generate a formal examination paper strictly following the SCTE&VT pattern.

Format your output EXACTLY as:

## Group A — Objective Questions (${pattern.groupA.count} × ${pattern.groupA.marks} Mark = ${pattern.groupA.count * pattern.groupA.marks} Marks)
*(Answer ALL questions)*

1. [MCQ question]
   A) [option]  B) [option]  C) [option]  D) [option]

(continue for all ${pattern.groupA.count} questions)

## Group B — ${pattern.groupB.type} (${pattern.groupB.count} × ${pattern.groupB.marks} Marks = ${pattern.groupB.count * pattern.groupB.marks} Marks)
*(Attempt any FIVE questions)*

1. [Question] [${pattern.groupB.marks} Marks]
(continue for all ${pattern.groupB.count} questions)

## Group C — ${pattern.groupC.type} (${pattern.groupC.count} × ${pattern.groupC.marks} Marks = ${pattern.groupC.count * pattern.groupC.marks} Marks)
*(Attempt any ${pattern.groupC.count === 1 ? 'ONE' : 'TWO'} question${pattern.groupC.count > 1 ? 's' : ''})*

1. [Question] [${pattern.groupC.marks} Marks]
(continue for all ${pattern.groupC.count} questions)

Rules:
- Group A: strictly MCQ with 4 options on one line each. All 10 required.
- Group B: short to medium descriptive questions. All ${pattern.groupB.count} required.
- Group C: long answer, numerical or design questions. All ${pattern.groupC.count} required.
- Cover all listed topics proportionally.
- Questions must match SCTE&VT difficulty and style.

After ALL questions, place the complete answer key wrapped EXACTLY in:
--- ANSWER KEY ---
## Group A Answers
1. [Letter] — [brief reason]
...
## Group B Key Points
1. [key points outline]
...
## Group C Key Points
1. [detailed outline]
...
--- END ANSWER KEY ---

The --- ANSWER KEY --- delimiter is MANDATORY.

${MATH_INSTRUCTIONS}`,
    },
    {
      role: 'user',
      content: `Generate a ${pattern.label} examination paper for:

**Subject**: ${subject_name} (Semester ${semester})
**Topics to cover**: ${topicsBlock}
**Total Marks**: ${pattern.total}
**Duration**: ${pattern.duration} minutes

Follow the exact SCTE&VT pattern. All questions must be answerable from the listed topics only.`,
    },
  ]
}
