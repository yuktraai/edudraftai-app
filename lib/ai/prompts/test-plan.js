/**
 * Prompt builder for Internal Test Plan (SCTE & VT format)
 *
 * Phase 10C update: subtopics is always an array (multi-select from TopicPicker).
 * Phase 50 update: inject real college_name and referenceBooks into prompt.
 */
import { MATH_INSTRUCTIONS } from './math-instructions'
import { buildReferenceBookBlock } from '@/lib/ai/buildReferenceBookBlock'

/**
 * Compute a valid 3-section mark distribution that sums exactly to total.
 * Returns { a: {count,each,total}, b: {count,each,total}, c: {count,each,total} }.
 *
 * Strategy:
 *   - Section A (short): small marks each (1 or 2), 2–4 questions
 *   - Section B (medium): mid marks each, 2 questions
 *   - Section C (long):  remaining marks, 1 question
 *   We solve for Section C remainder = total - A_total - B_total.
 */
function suggestMarkDistribution(total) {
  // Try to build a sensible distribution
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

          // Section C: prefer 1–2 questions with clean marks each
          for (let cCount = 1; cCount <= 2; cCount++) {
            if (cTotal % cCount === 0) {
              const cEach = cTotal / cCount
              if (cEach >= bEach && cEach <= 20) {
                // Score: prefer fewer questions, round marks
                const score = aCount + bCount + cCount
                candidates.push({ a: { count: aCount, each: aEach, total: aTotal },
                                   b: { count: bCount, each: bEach, total: bTotal },
                                   c: { count: cCount, each: cEach, total: cTotal },
                                   score })
              }
            }
          }
        }
      }
    }
  }

  // Pick the candidate with the lowest score (fewest total questions)
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.score - b.score)
    return candidates[0]
  }

  // Fallback: A=2×1, B=2×2, C=remainder/1
  const aTotal = 2, bTotal = 4
  const cTotal = Math.max(total - aTotal - bTotal, 1)
  return {
    a: { count: 2, each: 1,      total: aTotal },
    b: { count: 2, each: 2,      total: bTotal },
    c: { count: 1, each: cTotal, total: cTotal },
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
Total marks = ${total_marks}. The sum of (Questions × Marks Each) across ALL sections MUST equal EXACTLY ${total_marks}. Not ${total_marks + 1}, not ${total_marks - 1} — exactly ${total_marks}.

Use this section breakdown (already verified to sum correctly):
  Section A — ${distribution.a.count} question(s) × ${distribution.a.each} mark(s) each = ${distribution.a.total}
  Section B — ${distribution.b.count} question(s) × ${distribution.b.each} mark(s) each = ${distribution.b.total}
  Section C — ${distribution.c.count} question(s) × ${distribution.c.each} mark(s) each = ${distribution.c.total}
  Grand Total = ${distribution.a.total} + ${distribution.b.total} + ${distribution.c.total} = ${total_marks} ✓

You MAY adjust the question counts / marks-per-question BUT only if your revised distribution also sums exactly to ${total_marks}. VERIFY the arithmetic yourself before writing the Mark Distribution Table.
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
- BEFORE writing the Mark Distribution Table, mentally add: (Q_A × M_A) + (Q_B × M_B) + (Q_C × M_C) and confirm it equals ${total_marks}

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
**Duration**: ${duration_mins} minutes

Suggested section breakdown that sums to ${total_marks}:
- Section A: ${distribution.a.count} × ${distribution.a.each} = ${distribution.a.total}
- Section B: ${distribution.b.count} × ${distribution.b.each} = ${distribution.b.total}
- Section C: ${distribution.c.count} × ${distribution.c.each} = ${distribution.c.total}
- Total: ${total_marks} ✓

Generate the complete test paper. Double-check your Mark Distribution Table arithmetic before outputting it.`,
    },
  ]
}
