import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import {
  sendCreditAllocatedEmail,
  sendCreditLowEmail,
  sendGenerationFailedEmail,
} from '@/lib/email/resend'

/**
 * Create an in-app notification and optionally send an email alert.
 *
 * @param {{
 *   userId:    string,
 *   collegeId: string,
 *   type:      'credit_allocated' | 'credit_low' | 'generation_failed' | 'system_announcement',
 *   title:     string,
 *   message:   string,
 *   actionUrl: string | null,
 * }} opts
 */
export async function createNotification({
  userId,
  collegeId,
  type,
  title,
  message,
  actionUrl = null,
}) {
  // Insert into notifications table using service-role client
  const { error: insertErr } = await adminSupabase
    .from('notifications')
    .insert({
      user_id:    userId,
      college_id: collegeId,
      type,
      title,
      message,
      action_url: actionUrl,
    })

  if (insertErr) {
    logger.error('[createNotification] Insert failed', insertErr.message)
    // Do not throw — notification failure must never break the calling flow
    return
  }

  // Fetch user profile to determine email preference + address
  const { data: userRecord } = await adminSupabase
    .from('users')
    .select('name, email, preferences')
    .eq('id', userId)
    .single()

  if (!userRecord?.email) return

  // Check per-type email preference (default: true when not explicitly false)
  const emailPrefs = userRecord.preferences?.email_notifications ?? {}
  const emailEnabled = emailPrefs[type] !== false

  if (!emailEnabled) return

  // Send the appropriate branded email — non-fatal
  try {
    const { name = 'there', email } = userRecord

    if (type === 'credit_allocated') {
      // Extract amount from message or fall back to title heuristic
      const match = title.match(/^(\d+)/)
      const amount = match ? parseInt(match[1], 10) : 0
      await sendCreditAllocatedEmail({ to: email, name, amount })
    } else if (type === 'credit_low') {
      const match = message.match(/(\d+) credit/)
      const balance = match ? parseInt(match[1], 10) : 0
      await sendCreditLowEmail({ to: email, name, balance })
    } else if (type === 'generation_failed') {
      await sendGenerationFailedEmail({ to: email, name })
    }
    // 'system_announcement' — no email template (send via dashboard only)
  } catch (emailErr) {
    logger.error('[createNotification] Email send failed', emailErr.message)
  }
}
