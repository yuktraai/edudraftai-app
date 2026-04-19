import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { buildLessonNotesPrompt } from '@/lib/ai/prompts/lesson-notes'
import { buildMcqBankPrompt } from '@/lib/ai/prompts/mcq-bank'
import { buildQuestionBankPrompt } from '@/lib/ai/prompts/question-bank'
import { buildTestPlanPrompt } from '@/lib/ai/prompts/test-plan'
import { embedText } from '@/lib/rag/embedder'
import { queryContext } from '@/lib/rag/pinecone'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const OPENAI_MODEL    = 'gpt-4o'
const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022'

const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── In-memory rate limiter — 10 requests per user per 60 minutes ─────────────
const RATE_LIMIT_MAX    = 10
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in ms
const rateLimitMap = new Map() // userId -> { count: number, resetAt: number }

function checkRateLimit(userId) {
  const now    = Date.now()
  const entry  = rateLimitMap.get(userId)

  if (!entry || now > entry.resetAt) {
    // First request in this window or window expired — reset
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const minutesLeft = Math.ceil((entry.resetAt - now) / 60000)
    return { allowed: false, minutesLeft }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count }
}

const bodySchema = z.object({
  content_type: z.enum(['lesson_notes', 'mcq_bank', 'question_bank', 'test_plan']),
  subject_id:   z.string().uuid(),
  chunk_id:     z.string().uuid().nullable().optional(),
  params:       z.record(z.unknown()),
})

function buildPrompt(content_type, params) {
  switch (content_type) {
    case 'lesson_notes':   return buildLessonNotesPrompt(params)
    case 'mcq_bank':       return buildMcqBankPrompt(params)
    case 'question_bank':  return buildQuestionBankPrompt(params)
    case 'test_plan':      return buildTestPlanPrompt(params)
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

  // ── 2. Rate limit check ───────────────────────────────────────────────────
  const rateCheck = checkRateLimit(user.id)
  if (!rateCheck.allowed) {
    return Response.json(
      { error: `Rate limit exceeded. You can generate up to ${RATE_LIMIT_MAX} times per hour. Try again in ${rateCheck.minutesLeft} minute${rateCheck.minutesLeft !== 1 ? 's' : ''}.`, code: 'RATE_LIMITED' },
      { status: 429 }
    )
  }

  // ── 3. Validate body ──────────────────────────────────────────────────────
  let body
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success)
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const { content_type, subject_id, chunk_id, params } = parsed.data

  // ── 4. Verify subject belongs to user's college ───────────────────────────
  const { data: subject } = await adminSupabase
    .from('subjects')
    .select('id, name, semester, college_id, rag_enabled')
    .eq('id', subject_id)
    .eq('college_id', profile.college_id)
    .single()

  if (!subject)
    return Response.json({ error: 'Subject not found in your college', code: 'SUBJECT_NOT_FOUND' }, { status: 404 })

  // ── 5. Fetch chunk for syllabus context ───────────────────────────────────
  let chunk = null
  if (chunk_id) {
    const { data } = await adminSupabase
      .from('syllabus_chunks')
      .select('id, topic, subtopics, unit_number')
      .eq('id', chunk_id)
      .eq('college_id', profile.college_id)
      .single()
    chunk = data
  }

  // ── 6. Credit balance check ───────────────────────────────────────────────
  const { data: balance } = await adminSupabase
    .rpc('get_credit_balance', { p_user_id: user.id })

  if ((balance ?? 0) <= 0)
    return Response.json(
      { error: 'Insufficient credits. Contact your college admin to top up.', code: 'NO_CREDITS' },
      { status: 402 }
    )

  // ── 7. Build prompt params (merge chunk context + user params) ────────────
  // Phase 10C: TopicPicker now emits multi-selected subtopics as an array.
  // params.subtopics = the user's selection (1–5 items).
  // If params.subtopics has items, use them; otherwise fall back to chunk's full list.
  // params spread last so user values always override computed defaults.
  const selectedSubtopics =
    Array.isArray(params.subtopics) && params.subtopics.length > 0
      ? params.subtopics
      : (chunk?.subtopics ?? [])

  const promptParams = {
    subject_name: subject.name,
    semester:     subject.semester,
    topic:        chunk?.topic ?? params.topic ?? subject.name,
    subtopics:    selectedSubtopics,
    ...params,   // topic + subtopics from params override if present
  }

  // ── 7b. RAG context injection (Phase 11D) ─────────────────────────────────
  // If rag_enabled, embed the topic+subtopics query and retrieve top-5 chunks
  // from Pinecone. Inject into the last user message as reference material.
  // Any Pinecone failure is caught and skipped — generation must never fail due to RAG.
  let ragChunksUsed = 0
  let messagesWithRag = buildPrompt(content_type, promptParams)

  if (subject.rag_enabled) {
    try {
      const ragQuery    = `${promptParams.topic}: ${selectedSubtopics.join(', ')}`
      const queryVec    = await embedText(ragQuery)
      const ragResults  = await queryContext(subject_id, queryVec, 5)

      if (ragResults.length > 0) {
        ragChunksUsed = ragResults.length

        const ragBlock = [
          '',
          '--- REFERENCE MATERIAL (use as context, do not copy verbatim) ---',
          'The following excerpts are from approved reference materials for this subject.',
          'Use them to ensure accuracy and alignment with the prescribed curriculum.',
          'Do NOT reproduce these passages directly. Synthesize and teach from them.',
          '',
          ...ragResults.map((r, i) => `[${i + 1}] ${r.text}`),
          '--- END REFERENCE MATERIAL ---',
        ].join('\n')

        // Append RAG block to the last user message
        messagesWithRag = messagesWithRag.map((msg, i) =>
          i === messagesWithRag.length - 1 && msg.role === 'user'
            ? { ...msg, content: msg.content + ragBlock }
            : msg
        )
      }
    } catch (ragErr) {
      // Non-fatal — log and continue without RAG context
      logger.error('[generate] RAG retrieval failed, continuing without context', ragErr.message)
    }
  }

  const messages = messagesWithRag

  // ── 8a. Detect regeneration ───────────────────────────────────────────────
  // A regeneration is when the same user generates the same content_type for
  // the same syllabus chunk more than once.
  let isRegeneration = false
  if (chunk_id) {
    const { count } = await adminSupabase
      .from('content_generations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('syllabus_chunk_id', chunk_id)
      .eq('content_type', content_type)
      .eq('status', 'completed')

    isRegeneration = (count ?? 0) > 0
  }

  // ── 8b. Create content_generations row (status: generating) ──────────────
  const { data: generation, error: genInsertErr } = await adminSupabase
    .from('content_generations')
    .insert({
      user_id:           user.id,
      college_id:        profile.college_id,
      subject_id,
      syllabus_chunk_id: chunk_id ?? null,
      content_type,
      prompt_params:     { ...promptParams, is_regeneration: isRegeneration },
      status:            'generating',
      metadata:          { rag_chunks_used: ragChunksUsed },
    })
    .select('id')
    .single()

  if (genInsertErr || !generation)
    return Response.json({ error: 'Failed to initialise generation' }, { status: 500 })

  const generationId = generation.id
  const startTime    = Date.now()

  // ── 9. Stream response ────────────────────────────────────────────────────
  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  // Run the AI call + DB save in background (do NOT await — return stream immediately)
  ;(async () => {
    let fullOutput = ''
    let aiModel    = OPENAI_MODEL
    let failed     = false

    try {
      // ── OpenAI primary ──────────────────────────────────────────────────
      try {
        const stream = await openai.chat.completions.create({
          model:    OPENAI_MODEL,
          messages,
          stream:   true,
          max_tokens: 4096,
        })
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            fullOutput += text
            await writer.write(encoder.encode(text))
          }
        }
      } catch (openaiErr) {
        // ── Anthropic fallback on rate-limit or server error ────────────
        if (openaiErr?.status === 429 || openaiErr?.status === 500) {
          logger.info('[generate] OpenAI failed, falling back to Anthropic', { status: openaiErr.status })
          aiModel = ANTHROPIC_MODEL
          fullOutput = ''

          const system = messages.find(m => m.role === 'system')?.content ?? ''
          const user   = messages.find(m => m.role === 'user')?.content ?? ''

          const anthropicStream = anthropic.messages.stream({
            model:      ANTHROPIC_MODEL,
            max_tokens: 4096,
            system,
            messages:   [{ role: 'user', content: user }],
          })

          for await (const event of anthropicStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta?.type === 'text_delta'
            ) {
              const text = event.delta.text
              fullOutput += text
              await writer.write(encoder.encode(text))
            }
          }
        } else {
          throw openaiErr
        }
      }

      // ── 10. Save completed output + deduct credit ────────────────────────
      const ms = Date.now() - startTime

      await adminSupabase
        .from('content_generations')
        .update({
          raw_output:     fullOutput,
          status:         'completed',
          ai_model:       aiModel,
          generation_ms:  ms,
          updated_at:     new Date().toISOString(),
        })
        .eq('id', generationId)

      await adminSupabase.rpc('deduct_credit_and_log', {
        p_user_id:       user.id,
        p_college_id:    profile.college_id,
        p_generation_id: generationId,
      })

    } catch (err) {
      failed = true
      logger.error('[POST /api/generate] AI error', err)

      await adminSupabase
        .from('content_generations')
        .update({
          status:        'failed',
          error_message: err.message,
          updated_at:    new Date().toISOString(),
        })
        .eq('id', generationId)

      // Write a user-facing error marker into the stream so the client can detect it
      await writer.write(encoder.encode(`\n\n[GENERATION_ERROR]: ${err.message}`))
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: {
      'Content-Type':  'text/plain; charset=utf-8',
      'X-Generation-Id': generationId,
      'Cache-Control': 'no-cache',
    },
  })
}
