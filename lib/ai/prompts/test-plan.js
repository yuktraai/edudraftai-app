/**
 * Prompt builder for Internal Test Plan (SCTEVT format)
 *
 * Phase 10C update: subtopics is always an array (multi-select from TopicPicker).
 * Phase 50 update: inject real college_name and referenceBooks into prompt.
 */
import { MATH_INSTRUCTIONS } from './math-instructions'
import { buildReferenceBookBlock } from '@/lib/ai/buildReferenceBookBlock'

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

  return [
    {
      role: 'system',
      content: `You are an academic planner creating internal test papers for SCTEVT Odisha diploma engineering colleges. Generate a complete, ready-to-print internal test paper with proper structure.

The college name is: "${college_name || '[COLLEGE NAME]'}". Use this exact name in the paper header.

Format the output as a complete test paper:

---
${collegeLine}
Subject: [Subject] | Semester: [Sem] | Date: [Date]
Max Marks: [Marks] | Duration: [Duration] | All questions are compulsory

INSTRUCTIONS:
1. Answer all questions.
2. Write neatly and clearly.
3. Assume suitable data wherever necessary.

SECTION A — [Marks distribution] (Short Answer)
Q1. ...
Q2. ...

SECTION B — [Marks distribution] (Medium Answer)
Q3. ...
Q4. ...

SECTION C — [Marks distribution] (Long Answer)
Q5. ...
---

Then add a separate:
## Mark Distribution Table
| Section | Questions | Marks Each | Total |

## Topics Coverage Map
| Topic | Questions Covered |

Rules:
- Marks must add up exactly to total_marks
- Questions must be directly answerable from the topics listed only
- Use [Date] as a placeholder for the exam date (it will be filled before printing)
- Use the real college name provided above — do NOT use [COLLEGE NAME] as a placeholder if a real name is given
- Vary question types: numerical, theory, application

${buildReferenceBookBlock(referenceBooks)}
${MATH_INSTRUCTIONS}`,
    },
    {
      role: 'user',
      content: `Create an internal test paper for:

**College**: ${college_name || '[COLLEGE NAME]'}
**Subject**: ${subject_name} (Semester ${semester})
**Topics covered**: ${topicList}
**Total Marks**: ${total_marks}
**Duration**: ${duration_mins} minutes

Generate the complete test paper with a logical 3-section structure, mark distribution table, and topic coverage map.`,
    },
  ]
}
