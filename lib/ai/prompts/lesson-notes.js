/**
 * Prompt builder for Lesson Notes
 *
 * Phase 10C update: subtopics is always an array (multi-select from TopicPicker).
 * Rendered as a bullet list in the prompt for clarity.
 */
import { MATH_INSTRUCTIONS } from './math-instructions'
import { buildReferenceBookBlock } from '@/lib/ai/buildReferenceBookBlock'

export function buildLessonNotesPrompt({ topic, subtopics = [], subject_name, semester, difficulty = 'intermediate', referenceBooks = [] }) {
  const subtopicBlock = subtopics.length > 0
    ? subtopics.map(s => `- ${s}`).join('\n')
    : `- ${topic} (full topic overview)`

  return [
    {
      role: 'system',
      content: `You are an expert educator creating structured lesson notes for diploma engineering students in Odisha following the SCTE & VT curriculum. Your output must be strictly based on the provided topic and subtopics. Do not include content outside the given scope.

Format your response with these exact sections using markdown headings:
## Learning Objectives
## Key Concepts
## Detailed Explanation
## Worked Examples
## Summary

Use clear, simple language suitable for diploma-level students. Include relevant formulas, diagrams described in text, and practical examples from engineering contexts.
${buildReferenceBookBlock(referenceBooks)}
${MATH_INSTRUCTIONS}`,
    },
    {
      role: 'user',
      content: `Generate comprehensive lesson notes for the following:

**Subject**: ${subject_name} (Semester ${semester})
**Topic**: ${topic}
**Subtopics to cover**:
${subtopicBlock}
**Difficulty level**: ${difficulty}

Ensure all listed subtopics are covered thoroughly in the Detailed Explanation section. Include at least 2 worked examples relevant to the topic.`,
    },
  ]
}
