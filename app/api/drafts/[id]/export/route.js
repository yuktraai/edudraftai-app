/**
 * GET /api/drafts/[id]/export?format=docx&key=1
 *
 * format: 'docx' (only format handled here — txt is client-side, print is separate)
 * key:    '0' → questions only (no answer key)  |  '1' or absent → with answer key
 *
 * Access: owner OR college_admin of same college OR super_admin
 */

import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { buildDocx }    from '@/lib/export/docx'
import { logger }       from '@/lib/logger'

export async function GET(request, { params }) {
  try {
    // ── 1. Auth ────────────────────────────────────────────────────────────
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('role, college_id')
      .eq('id', user.id)
      .single()
    if (!profile) return new Response('Forbidden', { status: 403 })

    // ── 2. Parse query params ──────────────────────────────────────────────
    const { searchParams } = new URL(request.url)
    const format  = searchParams.get('format') ?? 'docx'
    const showKey = searchParams.get('key') !== '0'  // default: include key

    if (format !== 'docx') {
      return Response.json({ error: 'Unsupported format' }, { status: 400 })
    }

    // ── 3. Fetch generation ────────────────────────────────────────────────
    const { data: generation } = await adminSupabase
      .from('content_generations')
      .select('id, content_type, prompt_params, raw_output, created_at, user_id, college_id, subject_id')
      .eq('id', params.id)
      .neq('status', 'deleted')
      .single()

    if (!generation) return new Response('Draft not found', { status: 404 })

    // ── 4. Access check ───────────────────────────────────────────────────
    const isOwner      = generation.user_id === user.id
    const isAdmin      = profile.role === 'college_admin' && generation.college_id === profile.college_id
    const isSuperAdmin = profile.role === 'super_admin'

    if (!isOwner && !isAdmin && !isSuperAdmin)
      return new Response('Forbidden', { status: 403 })

    // ── 5. Fetch college + subject in parallel ────────────────────────────
    const [collegeRes, subjectRes] = await Promise.all([
      adminSupabase
        .from('colleges')
        .select('name, address, district, state')
        .eq('id', generation.college_id)
        .single(),

      generation.subject_id
        ? adminSupabase
            .from('subjects')
            .select('name, code, semester, departments(name)')
            .eq('id', generation.subject_id)
            .single()
        : Promise.resolve({ data: null }),
    ])

    const college = collegeRes.data ?? {}
    const subject = subjectRes.data ?? null

    // ── 6. Build DOCX ─────────────────────────────────────────────────────
    const buffer = await buildDocx({ generation, college, subject, showKey })

    // ── 7. Build filename ─────────────────────────────────────────────────
    const topic    = generation.prompt_params?.topic ?? 'draft'
    const type     = generation.content_type ?? 'content'
    const date     = new Date(generation.created_at).toISOString().slice(0, 10)
    const keySuffix = (type === 'mcq_bank' || type === 'question_bank' || type === 'exam_paper')
      ? (showKey ? '' : '_no_key')
      : ''
    const safeTopic  = topic.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 40)
    const filename   = `${type}_${safeTopic}_${date}${keySuffix}.docx`

    // ── 8. Return file ────────────────────────────────────────────────────
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-store',
      },
    })

  } catch (err) {
    logger.error('[GET /api/drafts/[id]/export]', err)
    return new Response('Export failed', { status: 500 })
  }
}
