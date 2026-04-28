import { adminSupabase } from '@/lib/supabase/admin'

/**
 * Generate a sequential ticket number for today.
 * Format: TKT-YYYYMMDD-NNNN  (e.g. TKT-20260427-0001)
 * Uses MAX query on today's tickets to derive next seq — safe for low-concurrency.
 */
export async function generateTicketNumber() {
  const today = new Date()
  const y = today.getUTCFullYear()
  const m = String(today.getUTCMonth() + 1).padStart(2, '0')
  const d = String(today.getUTCDate()).padStart(2, '0')
  const dateStr = `${y}${m}${d}`
  const prefix = `TKT-${dateStr}-`

  // Find the highest seq for today
  const { data } = await adminSupabase
    .from('support_tickets')
    .select('ticket_number')
    .like('ticket_number', `${prefix}%`)
    .order('ticket_number', { ascending: false })
    .limit(1)

  let seq = 1
  if (data && data.length > 0) {
    const last = data[0].ticket_number          // e.g. TKT-20260427-0003
    const lastSeq = parseInt(last.split('-')[2], 10)
    if (!isNaN(lastSeq)) seq = lastSeq + 1
  }

  return `${prefix}${String(seq).padStart(4, '0')}`
}
