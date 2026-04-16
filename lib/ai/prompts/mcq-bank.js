/**
 * Prompt builder for MCQ Bank
 */
export function buildMcqBankPrompt({ topic, subtopics = [], subject_name, count = 10, difficulty = 'intermediate', parent_topic }) {
  const subtopicList = subtopics.length > 0 ? subtopics.join(', ') : topic
  const contextLine  = parent_topic
    ? `**Unit**: ${parent_topic}\n**Focused Subtopic**: ${topic}`
    : `**Topic**: ${topic}\n**Subtopics**: ${subtopicList}`

  return [
    {
      role: 'system',
      content: `You are an expert question-setter for SCTEVT diploma engineering examinations in Odisha. Create multiple choice questions (MCQs) that are clear, unambiguous, and strictly based on the provided topic.

Format each MCQ exactly as:
Q{n}. [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

After all questions, add a section:
## Answer Key
Q1. [Correct option letter] - [Brief explanation]
... (one line per question)

Rules:
- All 4 options must be plausible
- Only one option is correct
- No trick questions
- ${parent_topic ? `Focus all questions on the subtopic "${topic}" only` : 'Cover all provided subtopics'}
- Mix different cognitive levels (recall, application, analysis)`,
    },
    {
      role: 'user',
      content: `Generate ${count} MCQs for the following:

**Subject**: ${subject_name}
${contextLine}
**Difficulty**: ${difficulty}

${parent_topic
  ? `All questions must be focused on "${topic}" only (part of unit "${parent_topic}"). Include the complete answer key at the end.`
  : `Distribute questions across all subtopics. Include the complete answer key at the end.`
}`,
    },
  ]
}
