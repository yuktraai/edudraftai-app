/**
 * Prompt builder for Lesson Notes
 * Returns OpenAI-compatible messages array
 */
export function buildLessonNotesPrompt({ topic, subtopics = [], subject_name, semester, difficulty = 'intermediate', parent_topic }) {
  const subtopicList = subtopics.length > 0 ? subtopics.join(', ') : topic
  const contextLine  = parent_topic
    ? `**Unit Topic**: ${parent_topic}\n**Focused Subtopic**: ${topic}`
    : `**Topic**: ${topic}\n**Subtopics to cover**: ${subtopicList}`

  return [
    {
      role: 'system',
      content: `You are an expert educator creating structured lesson notes for diploma engineering students in Odisha following the SCTEVT curriculum. Your output must be strictly based on the provided topic${parent_topic ? ' and subtopic' : ' and subtopics'}. Do not include content outside the given scope.

Format your response with these exact sections using markdown headings:
## Learning Objectives
## Key Concepts
## Detailed Explanation
## Worked Examples
## Summary

Use clear, simple language suitable for diploma-level students. Include relevant formulas, diagrams described in text, and practical examples from engineering contexts.`,
    },
    {
      role: 'user',
      content: `Generate comprehensive lesson notes for the following:

**Subject**: ${subject_name} (Semester ${semester})
${contextLine}
**Difficulty level**: ${difficulty}

${parent_topic
  ? `Focus exclusively on "${topic}" as part of the broader unit "${parent_topic}". Cover this subtopic in depth with at least 2 worked examples.`
  : `Ensure all subtopics are covered in the Detailed Explanation section. Include at least 2 worked examples relevant to the topic.`
}`,
    },
  ]
}
