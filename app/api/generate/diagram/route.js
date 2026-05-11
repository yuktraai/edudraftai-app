import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { buildDiagramPrompt } from '@/lib/ai/prompts/diagram'
import { extractMermaidCode } from '@/lib/ai/validate-diagram'
import { checkDiagramFocus } from '@/lib/ai/diagram-guard'

const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const bodySchema = z.object({
  subject_id:        z.string().uuid(),
  chunk_id:          z.string().uuid().nullable().optional(),
  diagram_type:      z.enum(['block_diagram', 'flowchart', 'system_overview']),
  orientation:       z.enum(['LR', 'TD']).optional().default('LR'),
  complexity:        z.enum(['simple', 'detailed']).optional().default('simple'),
  focus_description: z.string().max(200).optional(),
})

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

  const { subject_id, chunk_id, diagram_type, orientation, complexity, focus_description } = parsed.data

  // ── 3. Verify subject belongs to user's college ───────────────────────────
  const { data: subject } = await adminSupabase
    .from('subjects')
    .select('id, name, semester, college_id, code')
    .eq('id', subject_id)
    .eq('college_id', profile.college_id)
    .single()

  if (!subject)
    return Response.json({ error: 'Subject not found in your college', code: 'SUBJECT_NOT_FOUND' }, { status: 404 })

  // ── 4. Credit check ───────────────────────────────────────────────────────
  const { data: balance } = await adminSupabase
    .rpc('get_credit_balance', { p_user_id: user.id })

  // Also check personal credits
  const { data: personalRows } = await adminSupabase
    .from('personal_credit_ledger')
    .select('amount')
    .eq('user_id', user.id)
  const personalBalance = (personalRows ?? []).reduce((s, r) => s + r.amount, 0)

  // Check demo credits
  const { data: userRecord } = await adminSupabase
    .from('users').select('demo_credits_used').eq('id', user.id).single()
  const demoUsed = userRecord?.demo_credits_used ?? 0
  let demoCreditsRemaining = 0
  if (demoUsed < 3) {
    const { data: adminCredits } = await adminSupabase
      .from('credit_ledger').select('id')
      .eq('user_id', user.id)
      .in('reason', ['admin_grant', 'monthly_allocation', 'refund'])
      .limit(1)
    if ((adminCredits?.length ?? 0) === 0) demoCreditsRemaining = 3 - demoUsed
  }

  const totalBalance = (balance ?? 0) + personalBalance + demoCreditsRemaining
  if (totalBalance <= 0)
    return Response.json({ error: 'You have no credits remaining. Contact your college admin.', code: 'NO_CREDITS' }, { status: 402 })

  // ── 4b. Validate focus_description against prompt injection / off-topic ────
  if (focus_description) {
    const guard = await checkDiagramFocus(focus_description, subject.name, subject.name)
    if (!guard.valid) {
      return Response.json(
        {
          error: `Your diagram focus description doesn't seem to be an engineering topic. Please describe what the diagram should show — for example: "All stages of an AM receiver" or "Boot sequence of a microcontroller".`,
          code:  'INVALID_FOCUS_DESCRIPTION',
          reason: guard.reason,
        },
        { status: 422 },
      )
    }
  }

  // ── 5. Fetch syllabus chunk (optional) ────────────────────────────────────
  let topic    = focus_description || subject.name
  let subtopics = []

  if (chunk_id) {
    const { data: chunk } = await adminSupabase
      .from('syllabus_chunks')
      .select('topic, subtopics')
      .eq('id', chunk_id)
      .eq('subject_id', subject_id)
      .single()
    if (chunk) {
      topic     = chunk.topic
      subtopics = Array.isArray(chunk.subtopics) ? chunk.subtopics : []
    }
  }

  // ── 6. Log generation attempt ─────────────────────────────────────────────
  const { data: generation, error: insertErr } = await adminSupabase
    .from('content_generations')
    .insert({
      user_id:      user.id,
      college_id:   profile.college_id,
      subject_id,
      content_type: 'diagram',
      status:       'generating',
      prompt_params: { topic, subtopics, diagram_type, orientation, complexity, focus_description },
      metadata:     { diagram_type, orientation, complexity },
    })
    .select('id')
    .single()

  if (insertErr) {
    logger.error('[diagram] Failed to log generation', insertErr)
    return Response.json({ error: 'Failed to start generation', code: insertErr.message }, { status: 500 })
  }

  const generationId = generation.id

  // ── 7. Build prompt ───────────────────────────────────────────────────────
  const messages = buildDiagramPrompt({
    topic,
    subtopics,
    subject_name:      subject.name,
    diagram_type,
    orientation,
    complexity,
    focus_description,
  })

  // ── 8. Call OpenAI ────────────────────────────────────────────────────────
  let rawOutput = null
  let aiModel   = 'gpt-4o'

  try {
    const completion = await openai.chat.completions.create({
      model:       'gpt-4o',
      messages,
      temperature: 0.3,
      max_tokens:  1000,
    })
    rawOutput = completion.choices[0]?.message?.content ?? ''
  } catch (openaiErr) {
    logger.error('[diagram] OpenAI error', openaiErr.message)
    // Fall through to Anthropic retry
    rawOutput = null
  }

  // ── 9. Extract & validate ─────────────────────────────────────────────────
  let extracted = rawOutput ? extractMermaidCode(rawOutput) : { valid: false, error: 'openai_failed' }

  // ── 10. Retry with Anthropic if OpenAI failed or produced invalid output ──
  if (!extracted.valid) {
    logger.error('[diagram] OpenAI validation failed, retrying with Anthropic', extracted.error)
    aiModel = 'claude-3-5-sonnet-20241022'

    try {
      const anthropicMessages = messages.map(m => ({ role: m.role === 'system' ? 'user' : m.role, content: m.content }))
      const systemMsg = messages.find(m => m.role === 'system')?.content ?? ''

      const resp = await anthropic.messages.create({
        model:      'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system:     systemMsg,
        messages:   messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
      })
      rawOutput  = resp.content[0]?.text ?? ''
      extracted  = extractMermaidCode(rawOutput)
    } catch (anthropicErr) {
      logger.error('[diagram] Anthropic error', anthropicErr.message)
      extracted = { valid: false, error: 'anthropic_failed' }
    }
  }

  // ── 11. Handle final validation failure ───────────────────────────────────
  if (!extracted.valid) {
    await adminSupabase
      .from('content_generations')
      .update({ status: 'failed', metadata: { diagram_type, orientation, complexity, validation_error: extracted.error } })
      .eq('id', generationId)

    await adminSupabase
      .from('system_logs')
      .insert({
        severity: 'error',
        message:  `[diagram] Validation failed after retry: ${extracted.error}`,
        metadata: { generation_id: generationId, user_id: user.id, diagram_type },
      })
      .catch(() => {})

    return Response.json(
      { error: 'Could not generate a valid diagram. Try simplifying the description.', code: 'DIAGRAM_INVALID' },
      { status: 422 },
    )
  }

  // ── 12. Success — persist + deduct credit ─────────────────────────────────
  await adminSupabase
    .from('content_generations')
    .update({
      raw_output: extracted.code,
      status:     'completed',
      ai_model:   aiModel,
      metadata:   { diagram_type, orientation, complexity, validation_passed: true },
    })
    .eq('id', generationId)

  try {
    await adminSupabase.rpc('deduct_credit_and_log', {
      p_user_id:     user.id,
      p_college_id:  profile.college_id,
      p_reason:      'content_generation',
      p_reference_id: generationId,
    })
  } catch (creditErr) {
    logger.error('[diagram] Credit deduction failed', creditErr.message)
  }

  return Response.json({
    generation_id: generationId,
    mermaid_code:  extracted.code,
    diagram_type,
  })
}
