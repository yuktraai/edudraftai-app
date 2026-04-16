'use client'

import { useState, useEffect } from 'react'
import { PackageCard } from '@/components/payment/PackageCard'
import Link from 'next/link'

function formatPrice(paise) {
  return '₹' + (paise / 100).toLocaleString('en-IN')
}

export default function BuyCreditsPage() {
  const [packages,     setPackages]     = useState([])
  const [poolBalance,  setPoolBalance]  = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [successToast, setSuccessToast] = useState(null)

  async function loadData() {
    const [pkgRes, poolRes] = await Promise.all([
      fetch('/api/payments/packages'),
      fetch('/api/credits/pool'),
    ])
    const [pkgJson, poolJson] = await Promise.all([pkgRes.json(), poolRes.json()])
    setPackages(pkgJson.data ?? [])
    setPoolBalance(poolJson.pool_balance ?? 0)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function handleSuccess({ credits_added }) {
    setSuccessToast(`🎉 ${credits_added} credits added to your college pool!`)
    setTimeout(() => setSuccessToast(null), 5000)
    loadData() // refresh pool balance
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl">
        <div className="h-8 w-48 bg-border rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-80 bg-border rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl space-y-8">
      {/* Success toast */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-success text-white text-sm font-semibold px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-2.5 max-w-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {successToast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Buy Credits</h1>
          <p className="text-muted text-sm mt-1">
            Credits are purchased at the college level and allocated to lecturers from the pool.
          </p>
        </div>
        <Link href="/admin/credits/history"
          className="text-sm text-teal hover:underline flex items-center gap-1">
          View purchase history →
        </Link>
      </div>

      {/* Current pool balance */}
      <div className="flex items-center gap-4 bg-surface border border-border rounded-xl px-5 py-4">
        <div className="w-10 h-10 rounded-full bg-teal-light flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-muted">Current Pool Balance</p>
          <p className="text-xl font-bold text-navy">{poolBalance} credits</p>
        </div>
        <div className="ml-auto">
          <Link href="/admin/credits"
            className="text-xs text-teal hover:underline">
            Allocate to lecturers →
          </Link>
        </div>
      </div>

      {/* Package cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
        {packages.map(pkg => (
          <PackageCard key={pkg.id} pkg={pkg} onSuccess={handleSuccess} />
        ))}
      </div>

      {/* Info footer */}
      <div className="bg-bg border border-border rounded-xl px-5 py-4 text-xs text-muted space-y-1">
        <p>💡 Credits never expire and roll over month to month.</p>
        <p>🔒 Payments are processed securely via Razorpay. Your card details are never stored on our servers.</p>
        <p>📩 For invoices or bulk purchases, contact <a href="mailto:info@yuktraai.com" className="text-teal hover:underline">info@yuktraai.com</a></p>
      </div>
    </div>
  )
}
