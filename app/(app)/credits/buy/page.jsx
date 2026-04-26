'use client'

import { useState, useEffect } from 'react'
import { BuyCreditsModal } from '@/components/credits/BuyCreditsModal'

export default function BuyCreditsPage() {
  const [personalBalance, setPersonalBalance] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [successToast, setSuccessToast] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchBalance() {
    try {
      const res = await fetch('/api/credits/personal/balance')
      const json = await res.json()
      if (res.ok) setPersonalBalance(json.personal_balance)
    } catch {
      // non-fatal
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBalance() }, [])

  function handleSuccess({ credits_added }) {
    setSuccessToast(`${credits_added} credits added to your wallet!`)
    fetchBalance()
    setTimeout(() => setSuccessToast(null), 5000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* Success toast */}
      {successToast && (
        <div className="mb-6 flex items-center gap-3 bg-teal-light border border-teal text-teal rounded-xl px-4 py-3 text-sm font-semibold">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {successToast}
        </div>
      )}

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-text">Buy Credits</h1>
        <p className="text-sm text-muted mt-1">Top up your personal credit wallet to generate content.</p>
      </div>

      {/* Personal balance card */}
      <div className="bg-surface border border-border rounded-2xl p-6 mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted mb-1">Your personal balance</p>
          {loading ? (
            <div className="h-8 w-20 bg-bg rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-heading font-bold text-text">
              {personalBalance ?? 0}
              <span className="text-base font-normal text-muted ml-2">credits</span>
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-teal-light flex items-center justify-center">
          <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-bg border border-border rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
        <svg className="w-5 h-5 text-teal mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
        </svg>
        <p className="text-sm text-muted">
          <span className="font-semibold text-text">Personal credits are yours.</span>{' '}
          They are used first before your college allocation, and only you can use them.
        </p>
      </div>

      {/* Buy button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-teal text-white font-semibold rounded-xl px-6 py-3 hover:bg-teal-2 transition-colors text-base"
      >
        Buy Credits
      </button>

      <BuyCreditsModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
