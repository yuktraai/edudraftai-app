/**
 * Prompt builder for Internal Test Plan (SCTEVT format)
 *
 * Phase 10C update: subtopics is always an array (multi-select from TopicPicker).
 */
export function buildTestPlanPrompt({
  subject_name,
  semester,
  topics_covered = [],
  total_marks    = 30,
  duration_mins  = 60,
  topic,
  subtopics      = [],
}) {
  // Prefer topics_covered if passed (from test_plan form), else fall back to subtopics or topic
  const topicList = topics_covered.length > 0
    ? topics_covered.join(', ')
    : subtopics.length > 0
      ? subtopics.join(', ')
      : (topic ?? 'All syllabus topics')

  return [
    {
      role: 'system',
      content: `You are an academic planner creating internal test papers for SCTEVT Odisha diploma engineering colleges. Generate a complete, ready-to-print internal test paper with proper structure.

Format the output as a complete test paper:

---
[COLLEGE NAME] — INTERNAL ASSESSMENT TEST
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
- Use [Date] and [COLLEGE NAME] as placeholders (they will be replaced before printing)
- Vary question types: numerical, theory, application`,
    },
    {
      role: 'user',
      content: `Create an internal test paper for:

**Subject**: ${subject_name} (Semester ${semester})
**Topics covered**: ${topicList}
**Total Marks**: ${total_marks}
**Duration**: ${duration_mins} minutes

Generate the complete test paper with a logical 3-section structure, mark distribution table, and topic coverage map.`,
    },
  ]
}
