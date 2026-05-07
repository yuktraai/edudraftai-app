/**
 * Prompt builder for Internal Test Plan (SCTE & VT format)
 *
 * Phase 10C update: subtopics is always an array (multi-select from TopicPicker).
 * Phase 50 update: inject real college_name and referenceBooks into prompt.
 */
import { MATH_INSTRUCTIONS } from './math-instructions'
import { buildReferenceBookBlock } from '@/lib/ai/buildReferenceBookBlock'

// Maximum marks allowed per single question in any section
const MAX_MARKS_PER_QUESTION = 10

/**
 * Compute a valid 3-section mark distribution that sums exactly to total.
 * Returns { a: {count,each,total}, b: {count,each,total}, c: {count,each,total} }.
 *
 * Hard constraints:
 *   - Section A (short): 1–2 marks each, 2–4 questions
 *   - Section B (medium): 3–6 marks each, 1–3 questions
 *   - Section C (long): max MAX_MARKS_PER_QUESTION marks each, 1–3 questions
 *   - No single question may exceed MAX_MARKS_PER_QUESTION marks
 */
function suggestMarkDistribution(total) {
  const candidates = []

  for (let aCount = 2; aCount <= 4; aCount++) {
    for (let aEach of [1, 2]) {
      const aTotal = aCount * aEach
      if (aTotal >= total) continue

      for (let bCount = 1; bCount <= 3; bCount++) {
        for (let bEach of [2, 3, 4, 5, 6]) {
          const bTotal = bCount * bEach
          if (aTotal + bTotal >= total) continue

          const cTotal = total - aTotal - bTotal
          if (cTotal <= 0) continue

          // Section C: each question ≤ MAX_MARKS_PER_QUESTION
          for (let cCount = 1; cCount <= 3; cCount++) {
            if (cTotal % cCount === 0) {
              const cEach = cTotal / cCount
              // Hard cap: no question > MAX_MARKS_PER_QUESTION marks
              if (cEach > MAX_MARKS_PER_QUESTION) continue
              if (cEach < bEach) continue   // C must be ≥ B per question
              const score = aCount + bCount + cCount
              candidates.push({
                a: { count: aCount, each: aEach, total: aTotal },
                b: { count: bCount, each: bEach, total: bTotal },
                c: { count: cCount, each: cEach, total: cTotal },
                score,
              })
            }
          }
        }
      }
    }
  }

  // Pick lowest score (fewest total questions)
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.score - b.score)
    return candidates[0]
  }

  // Safe fallback: spread remaining marks across multiple C questions
  // so no single question exceeds MAX_MARKS_PER_QUESTION
  const aTotal = 2 * 1   // 2 × 1-mark questions
  const bTotal = 2 * 4   // 2 × 4-mark questions
  const cTotal = Math.max(total - aTotal - bTotal, MAX_MARKS_PER_QUESTION)
  const cCount = Math.ceil(cTotal / MAX_MARKS_PER_QUESTION)
  const cEach  = Math.round(cTotal / cCount)
  return {
    a: { count: 2, each: 1,      total: aTotal },
    b: { count: 2, each: 4,      total: bTotal },
    c: { count: cCount, each: cEach, total: cCount * cEach },
  }
}

export function buildTestPlanPrompt({
  subject_name,
  semester,
  topics_covered = [],
  total_marks    = 30,
  duration_mins  = 60,
  topic,
  subtopics      = [],
  college_name   = '',
  referenceBooks = [],
}) {
  // Prefer topics_covered if passed (from test_plan form), else fall back to subtopics or topic
  const topicList = topics_covered.length > 0
    ? topics_covered.join(', ')
    : subtopics.length > 0
      ? subtopics.join(', ')
      : (topic ?? 'All syllabus topics')

  // Use the real college name — fall back to bracketed placeholder only if blank
  const collegeLine = college_name
    ? `${college_name} — INTERNAL ASSESSMENT TEST`
    : '[COLLEGE NAME] — INTERNAL ASSESSMENT TEST'

  // Pre-compute a valid mark distribution so the AI doesn't invent its own
  const distribution = suggestMarkDistribution(total_marks)

  return [
    {
      role: 'system',
      content: `You are an academic planner creating internal test papers for SCTE & VT Odisha diploma engineering colleges. Generate a complete, ready-to-print internal test paper with proper structure.

The college name is: "${college_name || '[COLLEGE NAME]'}". Use this exact name in the paper header.

════════════════════════════════════════════
ABSOLUTE CONSTRAINT — READ BEFORE WRITING:
CONSTRAINT 1 — TOTAL MARKS:
Total marks = ${total_marks}. The sum of (Questions × Marks Each) across ALL sections MUST equal EXACTLY ${total_marks}. Not ${total_marks + 1}, not ${total_marks - 1} — exactly ${total_marks}.

CONSTRAINT 2 — MAX MARKS PER QUESTION:
No single question may be worth more than ${MAX_MARKS_PER_QUESTION} marks. This applies to ALL sections — Section A, B, and C.
If Section C has ${distribution.c.each} marks each — that is ≤ ${MAX_MARKS_PER_QUESTION}, which is valid.
NEVER write a question worth 11, 12, 15, or 16 marks. Maximum is ${MAX_MARKS_PER_QUESTION} marks per question.

Use this section breakdown (already verified to sum correctly AND respect the per-question cap):
  Section A — ${distribution.a.count} question(s) × ${distribution.a.each} mark(s) each = ${distribution.a.total}
  Section B — ${distribution.b.count} question(s) × ${distribution.b.each} mark(s) each = ${distribution.b.total}
  Section C — ${distribution.c.count} question(s) × ${distribution.c.each} mark(s) each = ${distribution.c.total}
  Grand Total = ${distribution.a.total} + ${distribution.b.total} + ${distribution.c.total} = ${total_marks} ✓

You MAY adjust the counts / marks-per-question ONLY IF: (a) grand total still equals ${total_marks}, AND (b) no question exceeds ${MAX_MARKS_PER_QUESTION} marks.
════════════════════════════════════════════

Format the output as a complete test paper:

---
${collegeLine}
Subject: [Subject] | Semester: [Sem] | Date: [Date]
Max Marks: ${total_marks} | Duration: ${duration_mins} minutes | All questions are compulsory

INSTRUCTIONS:
1. Answer all questions.
2. Write neatly and clearly.
3. Assume suitable data wherever necessary.

SECTION A — [N] MARK(S) EACH (SHORT ANSWER)
Q1. ...

SECTION B — [N] MARKS EACH (MEDIUM ANSWER)
Q2. ...

SECTION C — [N] MARKS EACH (LONG ANSWER)
Q3. ...
---

Then add:
## Mark Distribution Table
| Section | Questions | Marks Each | Total |
(Use the breakdown above. The Total column MUST sum to ${total_marks}.)

## Topics Coverage Map
| Topic | Questions Covered |

Additional rules:
- Questions must be directly answerable from the listed topics only
- Use [Date] as a placeholder for the exam date
- Use the real college name — do NOT use [COLLEGE NAME] if a real name is given
- Vary question types: numerical, theory, application
- HARD LIMIT: No individual question may carry more than ${MAX_MARKS_PER_QUESTION} marks. Enforce this in every section.
- BEFORE writing the Mark Distribution Table, verify two things: (1) grand total = ${total_marks}, and (2) every "Marks Each" value ≤ ${MAX_MARKS_PER_QUESTION}.

${buildReferenceBookBlock(referenceBooks)}
${MATH_INSTRUCTIONS}`,
    },
    {
      role: 'user',
      content: `Create an internal test paper for:

**College**: ${college_name || '[COLLEGE NAME]'}
**Subject**: ${subject_name} (Semester ${semester})
**Topics covered**: ${topicList}
**Total Marks**: ${total_marks} (EXACTLY — this must be the grand total, no more, no less)
**Max marks per question**: ${MAX_MARKS_PER_QUESTION} (no question in any section may exceed this)
**Duration**: ${duration_mins} minutes

Suggested section breakdown (sums to ${total_marks}, all sections ≤ ${MAX_MARKS_PER_QUESTION} marks per question):
- Section A: ${distribution.a.count} × ${distribution.a.each} = ${distribution.a.total}
- Section B: ${distribution.b.count} × ${distribution.b.each} = ${distribution.b.total}
- Section C: ${distribution.c.count} × ${distribution.c.each} = ${distribution.c.total}
- Total: ${total_marks} ✓

Generate the complete test paper. Before finalising, verify: (1) grand total = ${total_marks}, (2) no single question carries more than ${MAX_MARKS_PER_QUESTION} marks.`,
    },
  ]
}
