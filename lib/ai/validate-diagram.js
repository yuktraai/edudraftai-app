const VALID_MERMAID_DIRECTIVES = [
  'flowchart', 'graph', 'sequenceDiagram', 'classDiagram',
  'stateDiagram', 'erDiagram', 'gantt', 'pie', 'block-beta',
]

/**
 * Extracts and validates Mermaid code from raw LLM output.
 * Returns { code, valid, error }
 */
export function extractMermaidCode(rawLLMOutput) {
  if (!rawLLMOutput || typeof rawLLMOutput !== 'string') {
    return { code: null, valid: false, error: 'empty_response' }
  }

  // Extract from ```mermaid ... ``` fence
  const fenceMatch = rawLLMOutput.match(/```mermaid\s*([\s\S]*?)```/)
  if (!fenceMatch) {
    return { code: null, valid: false, error: 'no_mermaid_fence' }
  }

  const code = fenceMatch[1].trim()
  if (!code) {
    return { code: null, valid: false, error: 'empty_code' }
  }

  // Check starts with a known Mermaid directive
  const firstWord = code.split(/[\s\n]/)[0].toLowerCase()
  const isValidDirective = VALID_MERMAID_DIRECTIVES.some(d =>
    firstWord.startsWith(d.toLowerCase())
  )
  if (!isValidDirective) {
    return { code, valid: false, error: `unknown_directive:${firstWord}` }
  }

  // Reject if circuit schematic keywords leaked through
  const circuitKeywords = [
    'resistor', 'capacitor', 'inductor', 'transistor', 'diode',
    'op-amp', 'ohm', 'farad', 'mosfet', 'bjt',
  ]
  const hasCircuitContent = circuitKeywords.some(kw => code.toLowerCase().includes(kw))
  if (hasCircuitContent) {
    return { code, valid: false, error: 'circuit_schematic_detected' }
  }

  return { code, valid: true, error: null }
}
