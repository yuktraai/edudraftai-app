import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

const PERSONAL_PACKS = [
  { id: 'p10',  credits: 10,  price_paise: 4900,  label: '10 Credits',  popular: false },
  { id: 'p25',  credits: 25,  price_paise: 10900, label: '25 Credits',  popular: true  },
  { id: 'p50',  credits: 50,  price_paise: 18900, label: '50 Credits',  popular: false },
]

// POST /api/credits/personal/purchase
// Body: { pack_id }
// Role: lecturer only
// Creates a Razorpay order for a personal credit pack
export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('role, college_id, name, email')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'lecturer')
      return Response.json({ error: 'Forbidden — lecturer only' }, { status: 403 })

    const body = await request.json()
    const { pack_id } = body
    if (!pack_id) return Response.json({ error: 'pack_id is required' }, { status: 400 })

    const pack = PERSONAL_PACKS.find(p => p.id === pack_id)
    if (!pack) return Response.json({ error: 'Invalid pack_id' }, { status: 404 })

    // Create Razorpay order (lazy import keeps it server-side only)
    const Razorpay = (await import('razorpay')).default
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const order = await razorpay.orders.create({
      amount:   pack.price_paise,
      currency: 'INR',
      receipt:  user.id.slice(0, 40),
      notes: {
        user_id:    user.id,
        college_id: profile.college_id,
        pack_id:    pack.id,
      },
    })

    // Record the purchase attempt
    const { data: purchase, error: insertErr } = await adminSupabase
      .from('personal_credit_purchases')
      .insert({
        user_id:           user.id,
        college_id:        profile.college_id,
        credits_to_award:  pack.credits,
        amount_paise:      pack.price_paise,
        currency:          'INR',
        razorpay_order_id: order.id,
        status:            'created',
      })
      .select('id')
      .single()

    if (insertErr) {
      logger.error('[personal/purchase] insert failed', insertErr)
      return Response.json({ error: 'Failed to record order' }, { status: 500 })
    }

    return Response.json({
      order_id:    order.id,
      purchase_id: purchase.id,
      amount:      pack.price_paise,
      currency:    'INR',
      key_id:      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: {
        name:  profile.name ?? '',
        email: profile.email ?? '',
      },
    })
  } catch (err) {
    logger.error('[POST /api/credits/personal/purchase]', err)
    return Response.json({ error: 'Failed to create order', code: err.message }, { status: 500 })
  }
}
