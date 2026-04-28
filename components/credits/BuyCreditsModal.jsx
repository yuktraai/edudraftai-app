'use client'

import { useState, useEffect } from 'react'

export function BuyCreditsModal({ open, onClose, onSuccess }) {
  const [packages,     setPackages]     = useState([])
  const [pkgLoading,   setPkgLoading]   = useState(true)
  const [pkgError,     setPkgError]     = useState(null)
  const [loadingPackId, setLoadingPackId] = useState(null)
  const [error,        setError]        = useState(null)

  // Load Razorpay script + fetch packages when modal opens
  useEffect(() => {
    if (!open) return

    if (!window.Razorpay) {
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.head.appendChild(s)
    }

    setPkgLoading(true)
    setPkgError(null)
    fetch('/api/credits/personal/packages')
      .then(r => r.json())
      .then(({ packages: pkgs, error: err }) => {
        if (err || !pkgs) { setPkgError('Could not load packages. Please try again.'); return }
        setPackages(pkgs)
      })
      .catch(() => setPkgError('Could not load packages. Please try again.'))
      .finally(() => setPkgLoading(false))
  }, [open])

  if (!open) return null

  async function handleSelectPack(pack) {
    setError(null)
    setLoadingPackId(pack.id)

    try {
      const res = await fetch('/api/credits/personal/purchase', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pack_id: pack.id }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Failed to initiate payment')
        setLoadingPackId(null)
        return
      }

      const rzp = new window.Razorpay({
        key:         json.key_id,
        order_id:    json.order_id,
        amount:      json.amount,
        currency:    'INR',
        name:        'EduDraftAI',
        description: `${pack.credits} Personal Credits`,
        prefill:     json.prefill,
        theme:       { color: '#00B4A6' },
        handler: async function (response) {
          const verifyRes = await fetch('/api/credits/personal/verify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          })
          const vJson = await verifyRes.json()

          if (verifyRes.ok) {
            onSuccess({ credits_added: vJson.credits_added })
            onClose()
          } else {
            setError(vJson.error ?? 'Verification failed')
            setLoadingPackId(null)
          }
        },
        modal: {
          ondismiss: () => setLoadingPackId(null),
        },
      })

      rzp.open()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoadingPackId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-surface rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-heading font-bold text-text">Buy Credits</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors p-1 rounded-lg hover:bg-bg"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-muted mb-6">
          Credits are personal — only you can use them.
        </p>

        {/* Pack cards */}
        {pkgLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-bg border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : pkgError ? (
          <div className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center">
            {pkgError}
          </div>
        ) : packages.length === 0 ? (
          <div className="text-sm text-muted text-center py-6">
            No credit packages available at the moment.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {packages.map(pack => {
              const isLoading    = loadingPackId === pack.id
              const isDisabled   = loadingPackId !== null
              const priceRupees  = pack.price_paise / 100
              const perCredit    = (priceRupees / pack.credits).toFixed(1)

              return (
                <div
                  key={pack.id}
                  className={`border rounded-xl p-4 flex items-center justify-between transition-colors ${
                    pack.is_popular
                      ? 'border-teal bg-teal-light'
                      : 'border-border bg-surface'
                  }`}
                >
                  {/* Left: credits + pricing */}
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-heading font-bold text-text text-base">{pack.name}</span>
                      {pack.is_popular && (
                        <span className="text-xs font-semibold text-teal bg-white border border-teal px-2 py-0.5 rounded-full">
                          Most Popular
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted">
                      <span className="font-semibold text-text">
                        ₹{priceRupees.toLocaleString('en-IN')}
                      </span>
                      <span className="ml-2">· ₹{perCredit} / credit</span>
                    </div>
                  </div>

                  {/* Right: Select button */}
                  <button
                    onClick={() => handleSelectPack(pack)}
                    disabled={isDisabled}
                    className={`ml-4 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                      isDisabled
                        ? 'bg-bg text-muted cursor-not-allowed'
                        : pack.is_popular
                          ? 'bg-teal text-white hover:bg-teal-2'
                          : 'bg-navy text-white hover:bg-navy-2'
                    }`}
                  >
                    {isLoading && (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    )}
                    {isLoading ? 'Processing…' : 'Select'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="mt-4 text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
