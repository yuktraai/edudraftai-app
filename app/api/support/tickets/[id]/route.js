import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

async function getUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await adminSupabase
    .from('users').select('id, role').eq('id', user.id).single()
  return profile ?? null
}

// GET /api/support/tickets/[id] — ticket detail + updates timeline
export async function GET(request, { params }) {
  try {
    const user = await getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { id } = params

    const { data: ticket, error } = await adminSupabase
      .from('support_tickets')
      .select('id, ticket_number, subject, description, category, priority, status, admin_notes, created_at, updated_at, resolved_at, user_id')
      .eq('id', id)
      .single()

    if (error || !ticket)
      return Response.json({ error: 'Ticket not found' }, { status: 404 })

    // Non-admin users can only see their own tickets
    if (user.role !== 'super_admin' && ticket.user_id !== user.id)
      return Response.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch updates timeline
    const { data: updates } = await adminSupabase
      .from('ticket_updates')
      .select('id, message, old_status, new_status, created_at, updated_by, users(name)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    return Response.json({ ticket, updates: updates ?? [] })
  } catch (err) {
    logger.error('[GET /api/support/tickets/[id]]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
