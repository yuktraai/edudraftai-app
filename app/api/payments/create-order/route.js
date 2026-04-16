import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

// POST /api/payments/create-order
// Body: { package_id }
// Role: college_admin only
export async function POST(request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

    const { data: profile } = await adminSupabase
      .from('users')
      .select('role, college_id, email, name')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'college_admin')
      return Response.json({ error: 'Forbidden — college_admin only' }, { status: 403 })

    const body = await request.json()
    const { package_id } = body
    if (!package_id) return Response.json({ error: 'package_id is required' }, { status: 400 })

    // Fetch the package
    const { data: pkg, error: pkgErr } = await adminSupabase
      .from('credit_packages')
      .select('id, name, credits, price_paise')
      .eq('id', package_id)
      .eq('is_active', true)
      .single()

    if (pkgErr || !pkg)
      return Response.json({ error: 'Package not found' }, { status: 404 })

    // Create Razorpay order (lazy import keeps it server-side only)
    const Razorpay = (await import('razorpay')).default
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const order = await razorpay.orders.create({
      amount:   pkg.price_paise,
      currency: 'INR',
      receipt:  profile.college_id.slice(0, 40), // Razorpay receipt max 40 chars
      notes: {
        college_id:  profile.college_id,
        package_id:  pkg.id,
        package_name: pkg.name,
      },
    })

    // Record the purchase attempt
    const { data: purchase, error: insertErr } = await adminSupabase
      .from('credit_purchases')
      .insert({
        college_id:        profile.college_id,
        purchased_by:      user.id,
        package_id:        pkg.id,
        credits_to_award:  pkg.credits,
        amount_paise:      pkg.price_paise,
        currency:          'INR',
        razorpay_order_id: order.id,
        status:            'created',
      })
      .select('id')
      .single()

    if (insertErr) {
      logger.error('[create-order] insert failed', insertErr)
      return Response.json({ error: 'Failed to record order' }, { status: 500 })
    }

    return Response.json({
      order_id:   order.id,
      purchase_id: purchase.id,
      amount:     pkg.price_paise,
      currency:   'INR',
      key_id:     process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: {
        name:  profile.name,
        email: profile.email ?? '',
      },
      package: {
        name:    pkg.name,
        credits: pkg.credits,
      },
    })
  } catch (err) {
    logger.error('[POST /api/payments/create-order]', err)
    return Response.json({ error: 'Failed to create order', code: err.message }, { status: 500 })
  }
}
