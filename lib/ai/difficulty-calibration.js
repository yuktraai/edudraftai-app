import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const DIFFICULTY_LEVELS = ['basic', 'intermediate', 'advanced']
const LOOK_BACK = 30 // last N feedback entries to consider

/**
 * Returns a recommended difficulty level for the given user + content type
 * based on their thumbs-up/down history.
 *
 * Logic:
 *  - Pull the last LOOK_BACK feedback rows (with difficulty from prompt_params)
 *  - Compute thumbs_up rate per difficulty level
 *  - If a level has ≥ 3 samples and < 40% thumbs_up → mark it as "rejected"
 *  - Recommend the level with the highest thumbs_up rate (min 2 samples)
 *  - Fall back to 'intermediate' when there's not enough signal
 *
 * @param {string} userId
 * @param {string} contentType  'lesson_notes' | 'mcq_bank' | 'question_bank' | 'test_plan'
 * @returns {{ suggested: string, confidence: 'high'|'medium'|'low', stats: object }}
 */
export async function calibrateDifficulty(userId, contentType) {
  try {
    // Fetch recent feedback with the generation's prompt_params
    const { data: rows, error } = await adminSupabase
      .from('content_feedback')
      .select('rating, generation_id, content_generations(prompt_params)')
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .order('updated_at', { ascending: false })
      .limit(LOOK_BACK)

    if (error) throw error
    if (!rows || rows.length === 0) {
      return { suggested: 'intermediate', confidence: 'low', stats: {} }
    }

    // Aggregate stats per difficulty level
    const stats = {}
    for (const row of rows) {
      const difficulty = row.content_generations?.prompt_params?.difficulty ?? 'intermediate'
      if (!DIFFICULTY_LEVELS.includes(difficulty)) continue

      if (!stats[difficulty]) stats[difficulty] = { up: 0, down: 0, total: 0 }
      stats[difficulty].total++
      if (row.rating === 'thumbs_up')   stats[difficulty].up++
      if (row.rating === 'thumbs_down') stats[difficulty].down++
    }

    // Score each level (thumbs_up rate); require at least 2 samples
    let best = null
    let bestRate = -1

    for (const level of DIFFICULTY_LEVELS) {
      const s = stats[level]
      if (!s || s.total < 2) continue
      const rate = s.up / s.total
      if (rate > bestRate) { bestRate = rate; best = level }
    }

    if (!best) {
      return { suggested: 'intermediate', confidence: 'low', stats }
    }

    const totalSamples = Object.values(stats).reduce((a, s) => a + s.total, 0)
    const confidence = totalSamples >= 10 ? 'high' : totalSamples >= 5 ? 'medium' : 'low'

    return { suggested: best, confidence, stats }
  } catch (err) {
    logger.error('[calibrateDifficulty]', err)
    return { suggested: 'intermediate', confidence: 'low', stats: {} }
  }
}

/**
 * Quick helper — just returns the string difficulty label.
 */
export async function getSuggestedDifficulty(userId, contentType) {
  const { suggested } = await calibrateDifficulty(userId, contentType)
  return suggested
}
