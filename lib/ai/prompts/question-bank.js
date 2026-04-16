/**
 * Prompt builder for Question Bank (SCTEVT exam format)
 */
export function buildQuestionBankPrompt({
  topic,
  subtopics = [],
  subject_name,
  semester,
  marks_2 = 5,
  marks_5 = 4,
  marks_10 = 2,
  parent_topic,
}) {
  const subtopicList = subtopics.length > 0 ? subtopics.join(', ') : topic
  const contextLine  = parent_topic
    ? `**Unit**: ${parent_topic}\n**Focused Subtopic**: ${topic}`
    : `**Topic**: ${topic}\n**Subtopics**: ${subtopicList}`

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
- ${parent_topic ? `All questions must be answerable from the subtopic "${topic}" only` : 'All questions must be answerable from the provided subtopics only'}`,
    },
    {
      role: 'user',
      content: `Generate a complete question bank for:

**Subject**: ${subject_name} (Semester ${semester})
${contextLine}

Required questions:
- ${marks_2} questions × 2 marks
- ${marks_5} questions × 5 marks
- ${marks_10} questions × 10 marks

${parent_topic
  ? `Focus all questions on "${topic}" (a subtopic of unit "${parent_topic}"). Match SCTEVT difficulty standards.`
  : `Ensure questions span all listed subtopics and match SCTEVT difficulty standards.`
}`,
    },
  ]
}
