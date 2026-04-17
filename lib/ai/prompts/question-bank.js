/**
 * Prompt builder for Question Bank (SCTEVT exam format)
 *
 * Phase 10C update: subtopics is always an array (multi-select from TopicPicker).
 */
export function buildQuestionBankPrompt({
  topic,
  subtopics = [],
  subject_name,
  semester,
  marks_2  = 5,
  marks_5  = 4,
  marks_10 = 2,
}) {
  const subtopicBlock = subtopics.length > 0
    ? subtopics.map(s => `- ${s}`).join('\n')
    : `- ${topic} (all aspects)`

  return [
    {
      role: 'system',
      content: `You are an expert question-setter for SCTEVT Odisha diploma engineering examinations. Create questions strictly based on the given topic in the standard SCTEVT exam format with three sections by marks.

Format your response exactly as:

## Section A — 2-Mark Questions (Short Answer)
1. [Question]
2. [Question]
...

## Section B — 5-Mark Questions (Medium Answer)
1. [Question]
2. [Question]
...

## Section C — 10-Mark Questions (Long Answer / Essay)
1. [Question]
2. [Question]
...

Guidelines:
- 2-mark questions: definitions, short facts, formulae, state/list type
- 5-mark questions: explain, describe, derive, calculate with moderate steps
- 10-mark questions: elaborate, compare, design, solve complex problems
- All questions must be answerable from the listed subtopics only`,
    },
    {
      role: 'user',
      content: `Generate a complete question bank for:

**Subject**: ${subject_name} (Semester ${semester})
**Topic**: ${topic}
**Subtopics to cover**:
${subtopicBlock}

Required questions:
- ${marks_2} questions × 2 marks
- ${marks_5} questions × 5 marks
- ${marks_10} questions × 10 marks

Ensure questions span all listed subtopics and match SCTEVT difficulty standards.`,
    },
  ]
}
