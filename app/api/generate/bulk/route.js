import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { buildLessonNotesPrompt } from '@/lib/ai/prompts/lesson-notes'
import { buildMcqBankPrompt } from '@/lib/ai/prompts/mcq-bank'
import { buildQuestionBankPrompt } from '@/lib/ai/prompts/question-bank'
import { buildTestPlanPrompt } from '@/lib/ai/prompts/test-plan'
import { buildExamPaperPrompt } from '@/lib/ai/prompts/exam-paper'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const OPENAI_MODEL = 'gpt-4o'

const bodySchema = z.object({
  unit_number:  z.number().int().positive(),
  subject_id:   z.string().uuid(),
  content_type: z.enum(['lesson_notes', 'mcq_bank', 'question_bank', 'test_plan', 'exam_paper']),
  params:       z.record(z.unknown()).optional().default({}),
})

function buildPrompt(content_type, params) {
  switch (content_type) {
    case 'lesson_notes':  return buildLessonNotesPrompt(params)
    case 'mcq_bank':      return buildMcqBankPrompt(params)
    case 'question_bank': return buildQuestionBankPrompt(params)
    case 'test_plan':     return buildTestPlanPrompt(params)
    case 'exam_paper':    return buildExamPaperPrompt(params)
  }
}

export async function POST(request) {
  // ── 1. Auth ───────────────────────────────────────────────────────────────
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: profile } = await adminSupabase
    .from('users')
    .select('id, role, college_id, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active)
    return Response.json({ error: 'Account not active' }, { status: 403 })

  if (!['lecturer', 'college_admin', 'super_admin'].includes(profile.role))
    return Response.json({ error: 'Forbidden' }, { status: 403 })

  // ── 2. Validate body ──────────────────────────────────────────────────────
  let body
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success)
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const { unit_number, subject_id, content_type, params } = parsed.data

  // ── 3. Verify subject belongs to user's college ───────────────────────────
  const { data: subject } = await adminSupabase
    .from('subjects')
    .select('id, name, semester')
    .eq('id', subject_id)
    .eq('college_id', profile.college_id)
    .single()

  if (!subject)
    return Response.json({ error: 'Subject not found in your college', code: 'SUBJECT_NOT_FOUND' }, { status: 404 })

  // ── 4. Fetch all chunks for the unit ─────────────────────────────────────
  const { data: chunks, error: chunksErr } = await adminSupabase
    .from('syllabus_chunks')
    .select('id, topic, subtopics, unit_number')
    .eq('subject_id', subject_id)
    .eq('unit_number', unit_number)
    .order('id')

  if (chunksErr) {
    logger.error('[POST /api/generate/bulk] Failed to fetch chunks', chunksErr)
    return Response.json({ error: 'Failed to fetch syllabus chunks' }, { status: 500 })
  }

  if (!chunks || chunks.length === 0)
    return Response.json({ error: 'No topics found for this unit', code: 'NO_TOPICS' }, { status: 404 })

  // ── 5. Credit balance check ───────────────────────────────────────────────
  const { data: balance } = await adminSupabase
    .rpc('get_credit_balance', { p_user_id: user.id })

  if ((balance ?? 0) < chunks.length) {
    return Response.json(
      {
        error: `Insufficient credits. This unit has ${chunks.length} topics and requires ${chunks.length} credits. You have ${balance ?? 0} credit${(balance ?? 0) !== 1 ? 's' : ''}.`,
        code: 'NO_CREDITS',
        required: chunks.length,
        available: balance ?? 0,
      },
      { status: 402 }
    )
  }

  // ── 6. Insert parent generation row ──────────────────────────────────────
  const { data: parentGeneration, error: parentInsertErr } = await adminSupabase
    .from('content_generations')
    .insert({
      user_id:      user.id,
      college_id:   profile.college_id,
      subject_id,
      content_type,
      status:       'generating',
      prompt_params: { unit_number, ...params },
      metadata:     { is_bulk: true, topic_count: chunks.length, completed_count: 0 },
    })
    .select('id')
    .single()

  if (parentInsertErr || !parentGeneration) {
    logger.error('[POST /api/generate/bulk] Failed to insert parent row', parentInsertErr)
    return Response.json({ error: 'Failed to initialise bulk generation' }, { status: 500 })
  }

  const parentId = parentGeneration.id

  // ── 7. Fire-and-forget async processing ──────────────────────────────────
  ;(async () => {
    let completedCount = 0

    for (const chunk of chunks) {
      const promptParams = {
        subject_name: subject.name,
        semester:     subject.semester,
        topic:        chunk.topic,
        subtopics:    chunk.subtopics ?? [],
        unit_number:  chunk.unit_number,
        ...params,
        // test_plan needs topics_covered
        ...(content_type === 'test_plan' ? { topics_covered: chunk.subtopics ?? [chunk.topic] } : {}),
      }

      // Insert child generation row
      const { data: childGeneration, error: childInsertErr } = await adminSupabase
        .from('content_generations')
        .insert({
          user_id:              user.id,
          college_id:           profile.college_id,
          subject_id,
          syllabus_chunk_id:    chunk.id,
          content_type,
          status:               'generating',
          prompt_params:        promptParams,
          parent_generation_id: parentId,
          metadata:             { is_bulk: true, bulk_parent_id: parentId },
        })
        .select('id')
        .single()

      if (childInsertErr || !childGeneration) {
        logger.error('[bulk] Failed to insert child row for chunk', chunk.id, childInsertErr)
        continue
      }

      const childId    = childGeneration.id
      const startTime  = Date.now()

      try {
        const messages = buildPrompt(content_type, promptParams)

        let fullOutput = ''
        let aiModel    = OPENAI_MODEL

        // ── OpenAI primary ────────────────────────────────────────────────
        try {
          const completion = await openai.chat.completions.create({
            model:      OPENAI_MODEL,
            messages,
            stream:     false,
            max_tokens: 4096,
          })
          fullOutput = completion.choices[0]?.message?.content ?? ''
        } catch (openaiErr) {
          // Anthropic fallback on rate-limit or server error
          if (openaiErr?.status === 429 || openaiErr?.status === 500) {
            logger.info('[bulk] OpenAI failed for chunk, falling back to Anthropic', { chunkId: chunk.id, status: openaiErr.status })
            aiModel = 'claude-3-5-sonnet-20241022'

            const { default: Anthropic } = await import('@anthropic-ai/sdk')
            const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

            const systemMsg = messages.find(m => m.role === 'system')?.content ?? ''
            const userMsg   = messages.find(m => m.role === 'user')?.content ?? ''

            const response = await anthropic.messages.create({
              model:      'claude-3-5-sonnet-20241022',
              max_tokens: 4096,
              system:     systemMsg,
              messages:   [{ role: 'user', content: userMsg }],
            })
            fullOutput = response.content[0]?.text ?? ''
          } else {
            throw openaiErr
          }
        }

        const ms = Date.now() - startTime

        // Update child to completed
        await adminSupabase
          .from('content_generations')
          .update({
            raw_output:    fullOutput,
            status:        'completed',
            ai_model:      aiModel,
            generation_ms: ms,
            tags:          [content_type, subject.name],
            updated_at:    new Date().toISOString(),
          })
          .eq('id', childId)

        // Deduct 1 credit atomically
        await adminSupabase.rpc('deduct_credit_and_log', {
          p_user_id:       user.id,
          p_college_id:    profile.college_id,
          p_generation_id: childId,
        })

        completedCount++

        // Update parent progress
        await adminSupabase
          .from('content_generations')
          .update({
            metadata:   { is_bulk: true, topic_count: chunks.length, completed_count: completedCount },
            updated_at: new Date().toISOString(),
          })
          .eq('id', parentId)

      } catch (err) {
        logger.error('[bulk] Generation failed for chunk', chunk.id, err)

        await adminSupabase
          .from('content_generations')
          .update({
            status:        'failed',
            error_message: err.message,
            updated_at:    new Date().toISOString(),
          })
          .eq('id', childId)
        // Continue with next chunk
      }
    }

    // ── Mark parent completed ─────────────────────────────────────────────
    await adminSupabase
      .from('content_generations')
      .update({
        status:     'completed',
        metadata:   { is_bulk: true, topic_count: chunks.length, completed_count: completedCount },
        updated_at: new Date().toISOString(),
      })
      .eq('id', parentId)

  })()

  // ── 8. Return immediately with parent ID ─────────────────────────────────
  return Response.json(
    { parent_id: parentId, topic_count: chunks.length },
    { status: 202 }
  )
}
