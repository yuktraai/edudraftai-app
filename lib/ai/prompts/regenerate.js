export function buildRegenerationPrompt({ content_type, prompt_params, raw_output, instruction }) {
  const system = `You are an expert educational content creator for SCTEVT Odisha diploma colleges.
The user has an existing piece of ${content_type.replace(/_/g, ' ')} content and wants a revised version.
Apply the given instruction carefully while keeping everything else (format, subject, syllabus alignment) the same.
Output only the revised content — no preamble, no explanation.`

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
