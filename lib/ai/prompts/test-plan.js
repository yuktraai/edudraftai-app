/**
 * Prompt builder for Internal Test Plan (SCTEVT format)
 */
export function buildTestPlanPrompt({
  subject_name,
  semester,
  topics_covered = [],
  total_marks = 30,
  duration_mins = 60,
  topic,
  parent_topic,
}) {
  // If subtopic focused, topics_covered = [subtopic]; show unit context too
  const topicList = topics_covered.length > 0
    ? topics_covered.join(', ')
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
- Questions must be directly answerable from the topics_covered list only
- Use [Date] and [COLLEGE NAME] as placeholders
- Vary question types: numerical, theory, application`,
    },
    {
      role: 'user',
      content: `Create an internal test paper for:

**Subject**: ${subject_name} (Semester ${semester})
**Topics covered**: ${topicList}${parent_topic ? `\n**Unit context**: ${parent_topic}` : ''}
**Total Marks**: ${total_marks}
**Duration**: ${duration_mins} minutes

Generate the complete test paper with a logical 3-section structure, mark distribution table, and topic coverage map.`,
    },
  ]
}
