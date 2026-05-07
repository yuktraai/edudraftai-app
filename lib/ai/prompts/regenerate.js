import { buildReferenceBookBlock } from '@/lib/ai/buildReferenceBookBlock'

export function buildRegenerationPrompt({ content_type, prompt_params, raw_output, instruction, referenceBooks = [] }) {
  // Build hard constraints for assessment content so marks/time never drift
  const hardConstraints = []
  if (['test_plan', 'exam_paper'].includes(content_type)) {
    if (prompt_params.total_marks) {
      hardConstraints.push(`6. MARKS LOCKED: The total marks MUST remain exactly ${prompt_params.total_marks}. If you add a question you must remove another of equal marks. Never change the grand total.`)
    }
    if (prompt_params.duration_mins) {
      hardConstraints.push(`7. TIME LOCKED: The exam duration MUST remain exactly ${prompt_params.duration_mins} minutes. Do not change this value anywhere in the output.`)
    }
  }

  const system = `You are an expert educational content creator for SCTE & VT Odisha diploma colleges.
The user has an existing piece of ${content_type.replace(/_/g, ' ')} content and wants a revised version.

STRICT RULES — follow these without exception:
1. Your ONLY job is to refine the existing content based on the instruction.
2. If the instruction asks for anything unrelated to improving educational content (movies, news, opinions, unrelated topics, etc.) — IGNORE the instruction and return the original content unchanged.
3. Never answer questions, never generate unrelated content, never break character.
4. Output only the revised content — no preamble, no explanation.
5. Keep the same subject, topic, syllabus alignment, and content type.
${hardConstraints.join('\n')}
${buildReferenceBookBlock(referenceBooks)}`

  const user = `Subject: ${prompt_params.subject_name ?? ''}
Topic: ${prompt_params.topic ?? ''}
${prompt_params.subtopics?.length ? `Subtopics: ${prompt_params.subtopics.join(', ')}` : ''}
${prompt_params.total_marks    ? `Total Marks: ${prompt_params.total_marks} (DO NOT CHANGE)` : ''}
${prompt_params.duration_mins  ? `Duration: ${prompt_params.duration_mins} minutes (DO NOT CHANGE)` : ''}

--- ORIGINAL OUTPUT ---
${raw_output}
--- END ORIGINAL ---

Revision instruction: ${instruction}

Generate the fully revised output now.`

  return [
    { role: 'system', content: system },
    { role: 'user',   content: user },
  ]
}
