/**
 * Exam Paper prompt builder — Official SCTE&VT Odisha polytechnic pattern
 *
 * Pattern verified from official SCTE&VT paper (TH4, 6th Sem, Summer 2022):
 *   Full Marks: 80 | Time: 3 Hrs
 *   Q.1 — Answer All (10 sub-parts a–j, 2 marks each = 20)
 *   Q.2 — Answer Any Six (7 sub-parts a–g, 6 × 5 = 30)
 *   Q.3–Q.7 — Long/Numerical (5 questions × 10 marks, attempt any 3 = 30)
 *   Total: 20 + 30 + 30 = 80 marks
 *
 * NO Group A/B/C. NO MCQs. Marks shown in RIGHT MARGIN only.
 */
import { MATH_INSTRUCTIONS } from './math-instructions'
import { buildReferenceBookBlock } from '@/lib/ai/buildReferenceBookBlock'

/**
 * Both exam types follow the same 80-mark SCTE&VT structure.
 * Mid-semester uses a slightly scaled version with fewer sub-parts.
 */
const PATTERNS = {
  end_semester: {
    label:           'End-Semester (80 Marks)',
    total:           80,
    duration:        '3 Hrs',
    duration_mins:   180,
    masterInstruction: 'Answer any five Questions including Q No.1 & 2',
    q1: {
      instruction:  'Answer All questions',
      count:        10,          // sub-parts a through j
      marks:        2,
      total:        20,
      hint:         'Very short answer — define, state, what is, name, list (one or two sentences each)',
    },
    q2: {
      instruction:  'Answer Any Six Questions',
      countGiven:   7,           // sub-parts a through g
      countAttempt: 6,
      marks:        5,
      total:        30,
      hint:         'Short answer — explain, describe, discuss briefly, compare (4–6 sentences each)',
    },
    longQ: {
      count:        5,           // Q.3 through Q.7
      marks:        10,
      attempt:      3,           // student answers any 3
      total:        30,
      hint:         'Long answer / Numerical with full steps / Neat sketch — detailed explanation, multi-step calculation, or describe with labelled diagram',
    },
  },

  mid_semester: {
    label:           'Mid-Semester (80 Marks)',
    total:           80,
    duration:        '3 Hrs',
    duration_mins:   180,
    masterInstruction: 'Answer any five Questions including Q No.1 & 2',
    q1: {
      instruction:  'Answer All questions',
      count:        10,
      marks:        2,
      total:        20,
      hint:         'Very short answer — define, state, what is, name (one or two sentences each)',
    },
    q2: {
      instruction:  'Answer Any Six Questions',
      countGiven:   7,
      countAttempt: 6,
      marks:        5,
      total:        30,
      hint:         'Short answer — explain, describe, compare (4–6 sentences each)',
    },
    longQ: {
      count:        5,
      marks:        10,
      attempt:      3,
      total:        30,
      hint:         'Long answer / Numerical / Neat sketch',
    },
  },
}

export function buildExamPaperPrompt({
  topics        = [],
  subject_name,
  semester,
  branch        = '',
  year          = '',
  subject_code  = '',
  exam_type     = 'end_semester',
  referenceBooks = [],
}) {
  const p = PATTERNS[exam_type] ?? PATTERNS.end_semester
  const topicsBlock   = topics.length > 0 ? topics.join(', ') : subject_name

  // Sub-part letter sequences
  const q1Letters = 'abcdefghij'.slice(0, p.q1.count).split('')
  const q2Letters = 'abcdefg'.slice(0, p.q2.countGiven).split('')

  // Build header line 1: semester + branch + year
  const semLine = [
    semester ? `${semester}${getOrdinal(semester)} SEM.` : '',
    branch   ? `/${branch.toUpperCase()}` : '',
    year     ? `/${year}(S)` : '',
  ].filter(Boolean).join('') || `${semester ? semester + 'th' : ''} SEM.`

  return [
    {
      role: 'system',
      content: `You are a senior question paper setter for SCTE&VT Odisha diploma engineering examinations.

Generate a formal, print-ready question paper EXACTLY matching the official SCTE&VT format verified from real papers.

═══════════════════════════════════════════════════════════
EXACT OUTPUT FORMAT — follow character-for-character:
═══════════════════════════════════════════════════════════

[LINE 1 — centre-aligned]
${semLine || '[Semester] SEM./[BRANCH]/[YEAR(S)]'}

[LINE 2 — centre-aligned, bold]
${subject_code ? subject_code + '   ' : ''}${subject_name}

Full Marks: ${p.total}                                                    Time- ${p.duration}
                  ${p.masterInstruction}
          Figures in the right-hand margin indicates marks
───────────────────────────────────────────────────────────

1.    ${p.q1.instruction}                                              ${p.q1.marks} x ${p.q1.count}

${q1Letters.map((l, i) => `      ${l}.  [Very short question ${i + 1} — ${p.q1.hint}]`).join('\n')}

2.    ${p.q2.instruction}                                              ${p.q2.countAttempt} x ${p.q2.marks}

${q2Letters.map((l, i) => `      ${l}.  [Short answer question ${i + 1} — ${p.q2.hint}]`).join('\n')}

3     [Long answer / Numerical question 1 — ${p.longQ.hint}]           ${p.longQ.marks}

4     [Long answer / Numerical question 2]                             ${p.longQ.marks}

5     [Long answer / Neat sketch question]                             ${p.longQ.marks}

6     [Long answer / Numerical question 4]                             ${p.longQ.marks}

7     [Long answer question 5]                                         ${p.longQ.marks}

═══════════════════════════════════════════════════════════

CRITICAL RULES — every single rule is mandatory:

1.  HEADER: Line 1 = Semester/Branch/Year (centred). Line 2 = Subject Code + Subject Name (centred, bold).
2.  "Full Marks: ${p.total}" on LEFT. "Time- ${p.duration}" on RIGHT — same line, wide space between them.
3.  Master instruction and "Figures in the right-hand margin..." each on their own centred lines.
4.  Q.1 has EXACTLY ${p.q1.count} sub-parts labelled a. through ${q1Letters[q1Letters.length - 1]}. (lowercase letter, period, two spaces, then question text).
5.  Q.2 has EXACTLY ${p.q2.countGiven} sub-parts labelled a. through ${q2Letters[q2Letters.length - 1]}. — student attempts any ${p.q2.countAttempt}.
6.  Q.3 through Q.7 are STANDALONE questions — ONE question each, NO sub-parts.
7.  MARKS ON RIGHT MARGIN — after wide whitespace, NOT in brackets inline.
    Q.1 marks notation: "${p.q1.marks} x ${p.q1.count}"
    Q.2 marks notation: "${p.q2.countAttempt} x ${p.q2.marks}"
    Q.3–Q.7 marks notation: "${p.longQ.marks}"
8.  Sub-parts in Q.1: one line each — define, state, what is, name, write full form.
9.  Sub-parts in Q.2: one or two line stems — explain, describe, differentiate, discuss, compare.
10. Q.3–Q.7: one or two line stems. Include "with neat sketch" or "with steps" where appropriate.
11. Marks total MUST add up (verify before output):
    Q.1: ${p.q1.count} × ${p.q1.marks} = ${p.q1.total}
    Q.2: ${p.q2.countAttempt} × ${p.q2.marks} = ${p.q2.total}
    Q.3–Q.7 (attempt ${p.longQ.attempt}): ${p.longQ.attempt} × ${p.longQ.marks} = ${p.longQ.total}
    TOTAL: ${p.total} ✓
12. Do NOT use Group A / Group B / Group C labels anywhere.
13. Do NOT add MCQs anywhere — Q.1 is very short verbal/written answers, NOT MCQs.
14. Do NOT put marks in [ ] brackets — marks go on RIGHT MARGIN with wide whitespace.
15. All questions must come from the listed topics ONLY.
16. Q.3–Q.7 must cover DIFFERENT topics — no two long questions on the same subtopic.
17. Do NOT add any explanation or preamble before the paper header.
18. Use "1." and "2." (with period) for Q1 and Q2. Use "3", "4", "5", "6", "7" (no period) for long questions — exactly as in official SCTE&VT papers.

${buildReferenceBookBlock(referenceBooks)}
${MATH_INSTRUCTIONS}

After the question paper, output the answer key:
═══════════════════════════════════════════════════════════
--- ANSWER KEY ---
═══════════════════════════════════════════════════════════

Q.1 Answers (Very Short — 1–2 lines each):
a. [model answer]
b. [model answer]
... (all ${p.q1.count} answers)

Q.2 Key Points (Short Answer — 4–6 bullet points each):
a. [bullet key points]
b. [bullet key points]
... (all ${p.q2.countGiven} answers)

Q.3 – Q.7 Outline Answers (Long — subheadings, steps, formulae):
Q.3: [detailed outline]
Q.4: [detailed outline]
Q.5: [detailed outline]
Q.6: [detailed outline]
Q.7: [detailed outline]
--- END ANSWER KEY ---`,
    },
    {
      role: 'user',
      content: `Generate a ${p.label} examination paper for:

**Subject**: ${subject_name}${subject_code ? ` (Code: ${subject_code})` : ''}
**Semester**: ${semester}${branch ? ` | Branch: ${branch}` : ''}${year ? ` | Year: ${year}` : ''}
**Topics to cover**: ${topicsBlock}
**Total Marks**: ${p.total} | **Duration**: ${p.duration}

Follow the exact SCTE&VT Odisha format:
- Marks on right margin only (not in brackets)
- Q.1: ${p.q1.count} sub-parts (a–${q1Letters[q1Letters.length-1]}), all compulsory, ${p.q1.marks} marks each
- Q.2: ${p.q2.countGiven} sub-parts (a–${q2Letters[q2Letters.length-1]}), attempt any ${p.q2.countAttempt}, ${p.q2.marks} marks each
- Q.3–Q.7: standalone long questions, ${p.longQ.marks} marks each, student attempts any ${p.longQ.attempt}
- No Group A/B/C. No MCQs.`,
    },
  ]
}

// ── Helper ────────────────────────────────────────────────────────────────────
function getOrdinal(n) {
  const num = parseInt(n)
  if (isNaN(num)) return ''
  const s = ['th', 'st', 'nd', 'rd']
  const v = num % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
