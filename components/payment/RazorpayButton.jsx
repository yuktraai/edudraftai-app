'use client'

import { useState } from 'react'
import Script from 'next/script'

/**
 * RazorpayButton
 * Loads checkout.js, creates an order, opens modal, verifies payment.
 *
 * Props:
 *   pkg        — { id, name, credits, price_paise }
 *   onSuccess  — callback({ credits_added }) called after successful payment + verify
 *   isPopular  — bool, affects button styling
 */
export function RazorpayButton({ pkg, onSuccess, isPopular }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleBuy() {
    setError(null)
    setLoading(true)

    try {
      // ── Step 1: Create server-side Razorpay order ─────────────────────────
      const orderRes = await fetch('/api/payments/create-order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ package_id: pkg.id }),
      })
      const orderData = await orderRes.json()

      if (!orderRes.ok) {
        setError(orderData.error ?? 'Failed to create order')
        setLoading(false)
        return
      }

      // ── Step 2: Open Razorpay modal ────────────────────────────────────────
      if (typeof window.Razorpay === 'undefined') {
        setError('Payment SDK not loaded. Please refresh and try again.')
        setLoading(false)
        return
      }

      const options = {
        key:         orderData.key_id,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        'EduDraftAI',
        description: `${orderData.package.name} — ${orderData.package.credits} Credits`,
        order_id:    orderData.order_id,
        prefill: {
          name:  orderData.prefill?.name  ?? '',
          email: orderData.prefill?.email ?? '',
        },
        theme: { color: '#00B4A6' },

        handler: async (response) => {
          // ── Step 3: Verify payment server-side ──────────────────────────
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            })
            const verifyData = await verifyRes.json()

            if (!verifyRes.ok) {
              setError(verifyData.error ?? 'Payment verification failed')
              setLoading(false)
              return
            }

            onSuccess?.({ credits_added: verifyData.credits_added })
          } catch {
            setError('Network error during verification. Please contact support.')
          } finally {
            setLoading(false)
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (resp) => {
        setError(`Payment failed: ${resp.error.description}`)
        setLoading(false)
      })
      rzp.open()

    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Load Razorpay checkout.js once (lazyOnload so it doesn't block render) */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      <div className="space-y-2">
        <button
          onClick={handleBuy}
          disabled={loading}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isPopular
              ? 'bg-teal text-white hover:bg-teal-2'
              : 'bg-navy text-white hover:bg-navy-2'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Processing…
            </span>
          ) : (
            `Buy Now — ₹${(pkg.price_paise / 100).toLocaleString('en-IN')}`
          )}
        </button>

        {error && (
          <p className="text-xs text-error text-center">{error}</p>
        )}
      </div>
    </>
  )
}
