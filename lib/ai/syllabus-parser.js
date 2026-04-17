/**
 * Phase 10A — AI-Assisted Syllabus Parser
 *
 * Two-stage pipeline:
 *   Stage 1: pdf-parse (raw text) — handled by the caller
 *   Stage 2: GPT-4o JSON extraction (this file) → validated chunks
 *
 * Usage:
 *   import { parseSyllabusWithAI } from '@/lib/ai/syllabus-parser'
 *   const chunks = await parseSyllabusWithAI(rawText, subjectId, fileId, collegeId, subjectName)
 */

import OpenAI from 'openai'
import { z } from 'zod'
import { buildSyllabusExtractionPrompt } from '@/lib/ai/prompts/syllabus-extract'
import { logger } from '@/lib/logger'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Zod schema for GPT-4o JSON response ──────────────────────────────────────

const TopicSchema = z.object({
  topic:     z.string().min(1).max(300),
  subtopics: z.array(z.string().min(1).max(200)).max(12).default([]),
  hours:     z.union([z.number().positive(), z.null()]).optional().default(null),
})

const UnitSchema = z.object({
  unit_number: z.number().int().min(1),
  unit_title:  z.string().min(1).max(300),
  topics:      z.array(TopicSchema).min(1),
})

const ExtractionSchema = z.object({
  units: z.array(UnitSchema),
})

// ── Parse confidence scoring ──────────────────────────────────────────────────
// Scores are set programmatically — not by the LLM.
// 1.0 — all fields present, subtopics quality is high
// 0.7 — hours missing but subtopics look good
// 0.4 — subtopics look truncated or too few
// 0.0 — validation/parse failed entirely

const NOISE_PATTERN = /^\d+$|page\s+\d+|contd\.|continued|sl\.?\s*no|s\.?\s*no|^\s*$/i

function scoreConfidence({ topic, subtopics, hours }) {
  if (!subtopics || subtopics.length === 0) return 0.4

  // Check for noise markers
  const hasNoise = subtopics.some(s => NOISE_PATTERN.test(s.trim()))
  if (hasNoise) return 0.4

  // Subtopic quality: 2–60 chars considered "good"
  const good = subtopics.filter(s => {
    const t = s.trim()
    return t.length >= 2 && t.length <= 60
  })
  const quality = good.length / subtopics.length

  if (quality < 0.5 || subtopics.length < 2) return 0.4
  if (hours == null) return 0.7
  return 1.0
}

// ── Find raw source text for a unit (for audit log) ──────────────────────────

function extractUnitRawText(fullText, unitTitle, nextUnitTitle) {
  const haystack = fullText.toLowerCase()
  const needle   = unitTitle.toLowerCase().trim()
  const idx      = haystack.indexOf(needle)
  if (idx < 0) return fullText.slice(0, 3000)

  let end = fullText.length
  if (nextUnitTitle) {
    const nextIdx = haystack.indexOf(nextUnitTitle.toLowerCase().trim(), idx + 1)
    if (nextIdx > idx) end = nextIdx
  }

  return fullText.slice(idx, Math.min(end, idx + 3000))
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Calls GPT-4o with JSON mode to extract structured syllabus chunks.
 * Validates with zod. Retries once on failure.
 *
 * @param {string} rawText       - Full PDF text from pdf-parse
 * @param {string} subjectId     - UUID of the subject
 * @param {string} fileId        - UUID of the syllabus_files row
 * @param {string} collegeId     - UUID of the college
 * @param {string} subjectName   - Fallback name if extraction fails
 * @returns {Promise<Array>}     - Array of DB-ready chunk objects
 */
export async function parseSyllabusWithAI(rawText, subjectId, fileId, collegeId, subjectName) {
  const { systemPrompt, userPrompt } = buildSyllabusExtractionPrompt(rawText)

  let extraction = null
  let lastError  = null

  // Two attempts: normal then stricter nudge
  for (let attempt = 1; attempt <= 2; attempt++) {
    const sysContent = attempt === 2
      ? systemPrompt + '\n\nCRITICAL: Return ONLY valid JSON matching the exact schema. No other text whatsoever.'
      : systemPrompt

    try {
      const response = await openai.chat.completions.create({
        model:           'gpt-4o',
        temperature:     0.1,
        max_tokens:      4096,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sysContent },
          { role: 'user',   content: userPrompt  },
        ],
      })

      const raw = response.choices[0]?.message?.content ?? '{}'

      let parsed
      try {
        parsed = JSON.parse(raw)
      } catch (parseErr) {
        lastError = new Error(`JSON.parse failed on attempt ${attempt}: ${parseErr.message}`)
        logger.warn('[syllabus-parser] JSON parse failed', { attempt, snippet: raw.slice(0, 200) })
        continue
      }

      const result = ExtractionSchema.safeParse(parsed)
      if (!result.success) {
        lastError = new Error(`Zod validation failed on attempt ${attempt}`)
        logger.warn('[syllabus-parser] Zod validation failed', { attempt, errors: result.error.flatten() })
        continue
      }

      extraction = result.data
      logger.info('[syllabus-parser] Success', { attempt, units: extraction.units.length })
      break

    } catch (err) {
      lastError = err
      logger.error('[syllabus-parser] GPT-4o call failed', { attempt, error: err.message })
    }
  }

  // ── Total failure — single fallback chunk ────────────────────────────────
  if (!extraction || extraction.units.length === 0) {
    logger.error('[syllabus-parser] All attempts failed, using fallback chunk', lastError)
    return [{
      subject_id:        subjectId,
      college_id:        collegeId,
      syllabus_file_id:  fileId,
      unit_number:       1,
      topic:             subjectName,
      subtopics:         [],
      raw_text:          rawText.slice(0, 2000),
      raw_source_text:   rawText.slice(0, 2000),
      parse_confidence:  0.0,
    }]
  }

  // ── Flatten units → topics → DB rows ────────────────────────────────────
  const chunks = []

  for (let ui = 0; ui < extraction.units.length; ui++) {
    const unit      = extraction.units[ui]
    const nextUnit  = extraction.units[ui + 1]
    const rawSource = extractUnitRawText(rawText, unit.unit_title, nextUnit?.unit_title)

    for (const t of unit.topics) {
      // Clean subtopics: trim whitespace, dedupe, remove empty
      const cleanSubtopics = [...new Set(
        t.subtopics.map(s => s.trim()).filter(s => s.length >= 2)
      )]

      const confidence = scoreConfidence({ topic: t.topic, subtopics: cleanSubtopics, hours: t.hours })

      chunks.push({
        subject_id:        subjectId,
        college_id:        collegeId,
        syllabus_file_id:  fileId,
        unit_number:       unit.unit_number,
        topic:             t.topic.trim(),
        subtopics:         cleanSubtopics,
        raw_text:          rawSource.slice(0, 2000),
        raw_source_text:   rawSource.slice(0, 3000),
        parse_confidence:  confidence,
      })
    }
  }

  return chunks
}
