/**
 * Difficulty behavioral contracts per content type.
 * Injected into prompts to translate abstract difficulty labels
 * into concrete output constraints.
 */
export const DIFFICULTY_CONTRACTS = {
  lesson_notes: {
    basic: `
- Use only foundational definitions and introductory explanations
- No derivations — state formulas without proof
- Worked examples use simple integer values and single-step calculation
- Avoid jargon beyond what is in the subtopic name itself`,
    intermediate: `
- Include formula derivation where relevant to understanding (not rote)
- Worked examples require 2–3 step calculation with unit handling
- Connect concepts to real engineering applications in Odisha/India context
- Some "explain why" depth beyond simple definitions`,
    advanced: `
- Include full derivations and proof where the subtopic demands it
- Worked examples: multi-step numericals, unit conversion, non-standard conditions
- Questions within examples require synthesis across two or more concepts
- Include design-oriented or "what-if" analysis in at least one worked example`,
  },
  mcq_bank: {
    basic: `
- Questions require only direct recall: definitions, state, identify, list
- Correct answer is directly available in a single sentence from standard textbook
- No multi-step reasoning; no numerical calculation in the question stem
- Distractors are incorrect but clearly from the same topic domain`,
    intermediate: `
- Mix of recall (40%) and single-step application (60%)
- Some numericals requiring direct formula substitution (no unit conversion)
- Distractors arise from plausible conceptual errors or one-step calculation mistakes`,
    advanced: `
- Majority application and analysis questions (≥ 60%)
- Numericals require multi-step reasoning, unit conversion, or formula selection
- Some questions require comparing or evaluating two correct-seeming statements
- Distractors must arise from specific, realistic errors in multi-step reasoning`,
  },
  question_bank: {
    basic: `
- 2-mark: define, state, list only
- 5-mark: explain or describe with diagram — no numerical
- 10-mark: elaborate on a single concept with example — no design problem`,
    intermediate: `
- 2-mark: include short numerical (direct formula) alongside definitions
- 5-mark: derive OR calculate with 2–3 step numerical
- 10-mark: explain + solve a practical numerical with full steps`,
    advanced: `
- 2-mark: short derivation steps or formula recall under time pressure
- 5-mark: multi-step numerical + explain the engineering significance
- 10-mark: design problem or complex numerical requiring full methodology`,
  },
  exam_paper: {
    basic:        'Q.1 (very short): definitional only. Q.2 (short): explain/describe, no numericals. Q.3–Q.7: elaborate one concept with diagram. Avoid numericals in long questions.',
    intermediate: 'Q.1: mix of recall and application. Q.2: include at least 2 numericals. Q.3–Q.7: one numerical + one design/derivation question.',
    advanced:     'Q.1: majority application/analysis. Q.2: all questions require calculation or derivation. Q.3–Q.7: complex multi-part numericals with full methodology.',
  },
  test_plan: {
    basic:        'Section A: definitions and lists only. Section B: explain/describe, no numericals. Section C: one concept elaboration with diagram.',
    intermediate: 'Section A: short definitions + one formula recall. Section B: mix of theory and 1–2 step numericals. Section C: full numerical or design problem.',
    advanced:     'Section A: formula derivation or short calculation. Section B: multi-step numericals. Section C: complex design problem requiring full methodology.',
  },
}
