import { createClient } from '@/lib/supabase/server'
import { calibrateDifficulty } from '@/lib/ai/difficulty-calibration'
import { logger } from '@/lib/logger'

// GET /api/calibration?content_type=mcq_bank
// Returns suggested difficulty + confidence + per-level stats for the current user
export async function GET(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const contentType = searchParams.get('content_type')

    const valid = ['lesson_notes', 'mcq_bank', 'question_bank', 'test_plan']
    if (!contentType || !valid.includes(contentType)) {
      return Response.json({ suggested: 'intermediate', confidence: 'low', stats: {} })
    }

    const result = await calibrateDifficulty(user.id, contentType)
    return Response.json(result)
  } catch (err) {
    logger.error('[GET /api/calibration]', err)
    return Response.json({ suggested: 'intermediate', confidence: 'low', stats: {} })
  }
}
