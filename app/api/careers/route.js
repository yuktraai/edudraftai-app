import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET /api/careers — public, list all active job postings
export async function GET() {
  try {
    const { data, error } = await adminSupabase
      .from('job_postings')
      .select('id, title, department, location, type, experience, description, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('GET /api/careers — db error', error)
      return Response.json({ error: 'Failed to fetch jobs', code: 'DB_ERROR' }, { status: 500 })
    }

    return Response.json({ data: data ?? [] })
  } catch (err) {
    logger.error('GET /api/careers — unexpected', err)
    return Response.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
