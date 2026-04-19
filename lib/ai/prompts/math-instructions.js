export const MATH_INSTRUCTIONS = `
MATHEMATICAL FORMULA RULES (mandatory):
- Wrap ALL inline formulas with \\( and \\) — example: The formula \\(E = mc^2\\) shows mass-energy equivalence.
- Wrap ALL block/display equations with \\[ and \\] on their own line — example:
  \\[ F = \\frac{mv^2}{r} \\]
- Use proper LaTeX notation: \\frac{}{} for fractions, \\sqrt{} for roots, ^ for superscript, _ for subscript, \\int, \\sum, \\infty, \\alpha, \\beta, \\theta, \\pi, \\Omega, \\mu etc.
- Do NOT write formulas as plain text without delimiters.
- Do NOT use $ or $$ as math delimiters — use \\( \\) and \\[ \\] only.
- Every equation in a question paper or MCQ must use these delimiters.
`.trim()
