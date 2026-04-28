import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { sendTicketUpdatedEmail } from '@/lib/support/email'

const updateSchema = z.object({
  message:    z.string().min(1).max(2000),
  new_status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
})

async function getSuperAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await adminSupabase
    .from('users').select('id, role').eq('id', user.id).single()
  return profile?.role === 'super_admin' ? { ...user, ...profile } : null
}

// GET /api/super-admin/tickets/[id] — full detail + updates
export async function GET(request, { params }) {
  try {
    const admin = await getSuperAdmin()
    if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = params

    const { data: ticket, error } = await adminSupabase
      .from('support_tickets')
      .select(`
        id, ticket_number, subject, description, category, priority, status,
        admin_notes, role, created_at, updated_at, resolved_at,
        users(id, name, email, role),
        colleges(name)
      `)
      .eq('id', id)
      .single()

    if (error || !ticket)
      return Response.json({ error: 'Ticket not found' }, { status: 404 })

    const { data: updates } = await adminSupabase
      .from('ticket_updates')
      .select('id, message, old_status, new_status, created_at, updated_by, users(name)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    return Response.json({ ticket, updates: updates ?? [] })
  } catch (err) {
    logger.error('[GET /api/super-admin/tickets/[id]]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/super-admin/tickets/[id] — add update + optionally change status
export async function PATCH(request, { params }) {
  try {
    const admin = await getSuperAdmin()
    if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = params

    let body
    try { body = await request.json() } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = updateSchema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { message, new_status } = parsed.data

    // Fetch existing ticket + ticket owner info
    const { data: ticket, error: fetchErr } = await adminSupabase
      .from('support_tickets')
      .select('id, ticket_number, subject, status, users(id, name, email)')
      .eq('id', id)
      .single()

    if (fetchErr || !ticket)
      return Response.json({ error: 'Ticket not found' }, { status: 404 })

    const old_status = ticket.status

    // Insert the update record
    const { error: updateErr } = await adminSupabase
      .from('ticket_updates')
      .insert({
        ticket_id:  id,
        updated_by: admin.id,
        old_status,
        new_status:  new_status ?? null,
        message,
      })
    if (updateErr) throw updateErr

    // Update the ticket row
    const ticketPatch = {
      updated_at: new Date().toISOString(),
    }
    if (new_status) {
      ticketPatch.status = new_status
      if (new_status === 'resolved') ticketPatch.resolved_at = new Date().toISOString()
    }

    const { error: patchErr } = await adminSupabase
      .from('support_tickets')
      .update(ticketPatch)
      .eq('id', id)
    if (patchErr) throw patchErr

    // Email the ticket owner
    const owner = ticket.users
    if (owner?.email) {
      sendTicketUpdatedEmail({
        to:            owner.email,
        userName:      owner.name ?? 'there',
        ticketNumber:  ticket.ticket_number,
        ticketSubject: ticket.subject,
        message,
        newStatus:     new_status ?? null,
        ticketId:      id,
      }).catch(() => {})
    }

    logger.info(`[support] ticket ${ticket.ticket_number} updated by super_admin — status: ${new_status ?? 'unchanged'}`)

    return Response.json({ ok: true })
  } catch (err) {
    logger.error('[PATCH /api/super-admin/tickets/[id]]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
