import { adminSupabase } from '@/lib/supabase/admin'

export async function generateInvoiceNumber() {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD

  // Count invoices created today
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const { count } = await adminSupabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startOfDay)

  const seq = String((count ?? 0) + 1).padStart(4, '0')
  return `INV-${dateStr}-${seq}`
}
