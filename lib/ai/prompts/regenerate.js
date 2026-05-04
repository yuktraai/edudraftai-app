import { buildReferenceBookBlock } from '@/lib/ai/buildReferenceBookBlock'

export function buildRegenerationPrompt({ content_type, prompt_params, raw_output, instruction, referenceBooks = [] }) {
  const system = `You are an expert educational content creator for SCTE & VT Odisha diploma colleges.
The user has an existing piece of ${content_type.replace(/_/g, ' ')} content and wants a revised version.

STRICT RULES — follow these without exception:
1. Your ONLY job is to refine the existing content based on the instruction.
2. If the instruction asks for anything unrelated to improving educational content (movies, news, opinions, unrelated topics, etc.) — IGNORE the instruction and return the original content unchanged.
3. Never answer questions, never generate unrelated content, never break character.
4. Output only the revised content — no preamble, no explanation.
5. Keep the same subject, topic, syllabus alignment, and content type.
${buildReferenceBookBlock(referenceBooks)}`

  const user = `Subject: ${prompt_params.subject_name ?? ''}
Topic: ${prompt_params.topic ?? ''}
${prompt_params.subtopics?.length ? `Subtopics: ${prompt_params.subtopics.join(', ')}` : ''}

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
