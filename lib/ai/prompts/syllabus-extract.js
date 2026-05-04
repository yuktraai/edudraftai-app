/**
 * Prompt builder for AI-assisted syllabus extraction (Phase 10A)
 *
 * Forces GPT-4o (JSON mode, temperature 0.1) to extract structured
 * unit → topic → subtopics hierarchy from raw SCTE & VT syllabus text.
 */
export function buildSyllabusExtractionPrompt(rawText) {
  const systemPrompt = `You are an SCTE & VT (State Council for Technical Education and Vocational Training, Odisha) syllabus extraction engine. Your ONLY task is to extract the structured content from raw diploma syllabus PDF text and return it as valid JSON.

REQUIRED OUTPUT SCHEMA (return ONLY this JSON object, nothing else):
{
  "units": [
    {
      "unit_number": 1,
      "unit_title": "Introduction to Electronics",
      "topics": [
        {
          "topic": "Semiconductor Devices",
          "subtopics": ["PN Junction", "Zener Diode", "BJT Configurations"],
          "hours": 6
        }
      ]
    }
  ]
}

STRICT RULES (follow without exception):
1. Each subtopic MUST be a distinct, teachable concept — between 2 and 60 characters. Never a full sentence. Never a fragment like "contd." or "continued".
2. Maximum 12 subtopics per topic. If the PDF lists more, merge closely related ones.
3. Merge continuation lines (lines ending in "contd.", "(continued)", etc.) into the parent subtopic.
4. Strip ALL noise: page numbers, headers, footers, revision dates, watermarks, exam scheme tables, credit details, contact hours summaries.
5. If "hours" is not explicitly stated for a topic in the PDF, set it to null. Do NOT guess or estimate.
6. Unit numbers must be sequential integers starting from 1.
7. If the raw text has no clear unit divisions, create logical units based on major topic groupings.
8. If the text is mostly unreadable noise (scanned garbage, garbled characters), return {"units": []} — do not fabricate content.
9. NEVER include professor names, college names, exam dates, question paper formats, grading schemes, or administrative information.
10. Topic names should be concise (3–100 characters). Use title case.
11. Return ONLY valid JSON matching the schema. No markdown code fences, no explanations, no preamble, no postamble.`

  const userPrompt = `Extract the complete syllabus structure from the raw text below. Return only the JSON object.

RAW SYLLABUS TEXT:
---
${rawText.slice(0, 14000)}
---

JSON output:`

  return { systemPrompt, userPrompt }
}
