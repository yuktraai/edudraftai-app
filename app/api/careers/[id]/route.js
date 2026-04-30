import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET /api/careers/[id] — public, single active job posting
export async function GET(request, { params }) {
  const { id } = params

  try {
    const { data, error } = await adminSupabase
      .from('job_postings')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return Response.json({ error: 'Job not found', code: 'NOT_FOUND' }, { status: 404 })
    }

    return Response.json({ data })
  } catch (err) {
    logger.error(`GET /api/careers/${id} — unexpected`, err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
