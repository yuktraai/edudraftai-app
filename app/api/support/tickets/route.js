import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { generateTicketNumber } from '@/lib/support/ticket-number'
import { sendTicketCreatedEmail } from '@/lib/support/email'

const schema = z.object({
  subject:     z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  category:    z.enum(['bug', 'content_quality', 'billing', 'feature_request', 'access', 'other']),
  priority:    z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
})

async function getUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await adminSupabase
    .from('users')
    .select('id, name, email, role, college_id, colleges(name)')
    .eq('id', user.id)
    .single()
  return profile ?? null
}

// POST /api/support/tickets — create a new ticket
export async function POST(request) {
  try {
    const user = await getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    let body
    try { body = await request.json() } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success)
      return Response.json({ error: parsed.error.flatten() }, { status: 400 })

    const { subject, description, category, priority } = parsed.data

    const ticketNumber = await generateTicketNumber()

    const { data: ticket, error } = await adminSupabase
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        user_id:       user.id,
        college_id:    user.college_id ?? null,
        role:          user.role,
        subject,
        description,
        category,
        priority,
        status:        'open',
      })
      .select('id, ticket_number, created_at')
      .single()

    if (error) throw error

    // Fire-and-forget email to Yuktra AI support
    sendTicketCreatedEmail({
      ticketNumber,
      subject,
      description,
      category,
      priority,
      userName:    user.name ?? 'Unknown',
      userEmail:   user.email,
      userRole:    user.role,
      collegeName: user.colleges?.name ?? 'N/A',
      createdAt:   ticket.created_at,
    }).catch(() => {})

    logger.info(`[support] ticket ${ticketNumber} created by ${user.email}`)

    return Response.json({ ticketId: ticket.id, ticketNumber }, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/support/tickets]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/support/tickets — fetch user's own tickets (or all for super_admin)
export async function GET(request) {
  try {
    const user = await getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 200)

    let query = adminSupabase
      .from('support_tickets')
      .select('id, ticket_number, subject, category, priority, status, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Non-super_admin users see only their own tickets
    if (user.role !== 'super_admin') {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query
    if (error) throw error

    return Response.json({ tickets: data ?? [] })
  } catch (err) {
    logger.error('[GET /api/support/tickets]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
