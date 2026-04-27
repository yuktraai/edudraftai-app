import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import { buildDocx } from '@/lib/export/docx'
import archiver from 'archiver'
import { z } from 'zod'
import { Readable } from 'stream'

const schema = z.object({
  draftIds:       z.array(z.string().uuid()).min(1).max(50),
  includeAnswerKey: z.boolean().optional().default(true),
})

const CONTENT_TYPE_LABELS = {
  lesson_notes:  'LessonNotes',
  mcq_bank:      'MCQBank',
  question_bank: 'QuestionBank',
  test_plan:     'InternalTest',
  exam_paper:    'ExamPaper',
}

function safeName(str) {
  return (str ?? '').replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 40)
}

// POST /api/drafts/bulk-export
// Body: { draftIds: uuid[], includeAnswerKey: boolean }
// Returns: application/zip stream
export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    let body
    try { body = await request.json() } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { draftIds, includeAnswerKey } = parsed.data

    // Fetch all requested drafts — must belong to this user and be completed
    const { data: drafts, error: fetchErr } = await adminSupabase
      .from('content_generations')
      .select(`
        id,
        content_type,
        raw_output,
        prompt_params,
        created_at,
        subjects ( name, code, semester ),
        college:colleges ( name )
      `)
      .in('id', draftIds)
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (fetchErr) {
      logger.error('[bulk-export] fetch drafts', fetchErr.message)
      return Response.json({ error: 'Failed to fetch drafts' }, { status: 500 })
    }

    if (!drafts || drafts.length !== draftIds.length) {
      return Response.json({ error: 'Some drafts were not found or are not owned by you' }, { status: 400 })
    }

    // Build all DOCX buffers
    const files = await Promise.all(drafts.map(async (draft) => {
      try {
        const buffer = await buildDocx({
          generation: { ...draft, raw_output: draft.raw_output ?? '' },
          college:    draft.college ?? null,
          subject:    draft.subjects ?? null,
          showKey:    includeAnswerKey,
        })

        const typeLabel = CONTENT_TYPE_LABELS[draft.content_type] ?? draft.content_type
        const topic     = safeName(draft.prompt_params?.topic ?? draft.subjects?.name ?? 'Topic')
        const date      = new Date(draft.created_at).toISOString().slice(0, 10).replace(/-/g, '')
        const filename  = `${typeLabel}_${topic}_${date}.docx`

        return { filename, buffer }
      } catch (err) {
        logger.error('[bulk-export] docx build failed for draft', draft.id, err.message)
        return null
      }
    }))

    const validFiles = files.filter(Boolean)

    if (validFiles.length === 0) {
      return Response.json({ error: 'No files could be generated' }, { status: 500 })
    }

    // Build ZIP using archiver and collect into buffer
    const zipBuffer = await new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 6 } })
      const chunks  = []

      archive.on('data', chunk => chunks.push(chunk))
      archive.on('end',  ()    => resolve(Buffer.concat(chunks)))
      archive.on('error', reject)

      for (const { filename, buffer } of validFiles) {
        archive.append(Readable.from(buffer), { name: filename })
      }

      archive.finalize()
    })

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/zip',
        'Content-Disposition': `attachment; filename="EduDraftAI_Export_${date}.zip"`,
        'Content-Length':      String(zipBuffer.length),
      },
    })
  } catch (err) {
    logger.error('[POST /api/drafts/bulk-export]', err.message)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
