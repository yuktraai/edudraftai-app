/**
 * Exam Paper prompt builder — SCTE&VT polytechnic pattern
 * Phase 17 original | Phase 36 overhaul: professional formatting enforcement
 *
 * Enforces:
 * - Exam header block (Subject, Code, Semester, Full Marks, Time)
 * - Standard SCTE&VT instructions
 * - Group A / B / C with marks on every question
 * - End-of-paper marker
 * - Total marks validation instruction in prompt
 */
import { MATH_INSTRUCTIONS } from './math-instructions'

const PATTERNS = {
  mid_semester: {
    label:    'Mid-Semester (50 Marks)',
    groupA:   { count: 10, marks: 1,  type: 'Objective (MCQ)' },
    groupB:   { count: 5,  marks: 4,  type: 'Short Answer' },
    groupC:   { count: 1,  marks: 10, type: 'Long Answer / Numerical' },
    total:    50,
    duration: 90,
    attemptB: 'ALL',
    attemptC: 'ONE',
  },
  end_semester: {
    label:    'End-Semester (100 Marks)',
    groupA:   { count: 10, marks: 1,  type: 'Objective (MCQ)' },
    groupB:   { count: 5,  marks: 6,  type: 'Short Answer / Descriptive' },
    groupC:   { count: 2,  marks: 10, type: 'Long Answer / Numerical / Design' },
    total:    100,
    duration: 180,
    attemptB: 'ANY FIVE',
    attemptC: 'ANY TWO',
  },
}

export function buildExamPaperPrompt({ topics = [], subject_name, semester, exam_type = 'end_semester', total_marks, duration_mins }) {
  const pattern  = PATTERNS[exam_type] ?? PATTERNS.end_semester
  const topicsBlock = topics.length > 0 ? topics.join(', ') : subject_name

  const groupATotal = pattern.groupA.count * pattern.groupA.marks
  const groupBTotal = pattern.groupB.count * pattern.groupB.marks
  const groupCTotal = pattern.groupC.count * pattern.groupC.marks

  return [
    {
      role: 'system',
      content: `You are an expert question-setter for SCTE&VT Odisha diploma engineering examinations. Generate a formal, print-ready examination paper strictly following the SCTE&VT pattern.

Your response MUST begin with this exact header block:
Subject: [subject name]
Subject Code: [derive a plausible code or leave blank]
Semester: [n]
Full Marks: ${pattern.total}
Time Allowed: ${pattern.duration} Minutes

Instructions to Candidates:
(1) Answer ALL questions in Group A. Attempt ${pattern.attemptB} questions from Group B. Attempt ${pattern.attemptC} question(s) from Group C.
(2) Figures in brackets [ ] indicate marks.
(3) All parts of a question should be answered at one place.

Then output questions in EXACTLY this structure:

GROUP A — ${pattern.groupA.type} (${pattern.groupA.count} × ${pattern.groupA.marks} Mark = ${groupATotal} Marks)
(Answer ALL questions)

Q1. [MCQ question text]
    A) [option]    B) [option]    C) [option]    D) [option]
[1 Mark]

Q2. [MCQ question text]
    A) [option]    B) [option]    C) [option]    D) [option]
[1 Mark]

(continue for all ${pattern.groupA.count} questions)

GROUP B — ${pattern.groupB.type} (${pattern.groupB.count} × ${pattern.groupB.marks} Marks = ${groupBTotal} Marks)
(Attempt ${pattern.attemptB} questions)

Q11. [question text] [${pattern.groupB.marks} Marks]
Q12. [question text] [${pattern.groupB.marks} Marks]
(continue for all ${pattern.groupB.count} questions)

GROUP C — ${pattern.groupC.type} (${pattern.groupC.count} × ${pattern.groupC.marks} Marks = ${groupCTotal} Marks)
(Attempt ${pattern.attemptC} question${pattern.groupC.count > 1 ? 's' : ''})

Q${10 + pattern.groupB.count + 1}. [long answer / numerical / design question] [${pattern.groupC.marks} Marks]
(continue for all ${pattern.groupC.count} questions)

*** End of Question Paper ***

Critical rules:
- Question numbering is CONTINUOUS: Q1–Q10 for Group A, Q11 onwards for Group B, then Group C
- [X Marks] indicator is MANDATORY at the end of EVERY question
- GROUP headers must be bold-formatted: GROUP A, GROUP B, GROUP C in CAPS
- Group A: strictly MCQ with exactly 4 options (A B C D) on the same or next line
- Group B: short to medium questions — explain, derive, calculate, compare
- Group C: long descriptive, numerical, design — most challenging questions
- Total marks MUST add up: ${groupATotal} + ${groupBTotal} + ${groupCTotal} = ${pattern.total}. Verify this before outputting.
- Cover all listed topics proportionally across all groups

After *** End of Question Paper ***, output the answer key wrapped EXACTLY in:
--- ANSWER KEY ---
Group A Answers
Q1. [Letter] — [brief explanation, 1 line]
Q2. [Letter] — [brief explanation]
...

Group B Key Points
Q11. [5–7 key points as bullets]
...

Group C Key Points
Q[n]. [detailed outline with all steps, sub-points, formulae]
...
--- END ANSWER KEY ---

The --- ANSWER KEY --- block is MANDATORY.

${MATH_INSTRUCTIONS}`,
    },
    {
      role: 'user',
      content: `Generate a ${pattern.label} examination paper for:

**Subject**: ${subject_name} (Semester ${semester})
**Topics to cover**: ${topicsBlock}
**Exam type**: ${exam_type.replace('_', '-')}
**Total Marks**: ${pattern.total}
**Duration**: ${pattern.duration} minutes

Follow the exact SCTE&VT pattern. All questions must be answerable from the listed topics only.`,
    },
  ]
}
