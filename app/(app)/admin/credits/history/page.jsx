'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STATUS_META = {
  created:  { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid:     { label: 'Paid',     cls: 'bg-teal-light text-teal border-teal' },
  failed:   { label: 'Failed',   cls: 'bg-red-50 text-error border-red-200' },
  refunded: { label: 'Refunded', cls: 'bg-bg text-muted border-border' },
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatPrice(paise) {
  return '₹' + (paise / 100).toLocaleString('en-IN')
}

export default function CreditHistoryPage() {
  const [purchases, setPurchases] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    fetch('/api/payments/history')
      .then(r => r.json())
      .then(({ data, error: e }) => {
        if (e) setError(e)
        else setPurchases(data ?? [])
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Purchase History</h1>
          <p className="text-muted text-sm mt-1">All credit purchases for your college.</p>
        </div>
        <Link href="/admin/credits/buy"
          className="flex items-center gap-2 px-4 py-2 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-2 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Buy Credits
        </Link>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-border rounded animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="px-5 py-6 text-sm text-error">{error}</div>
        ) : purchases.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-bg border border-border flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-text mb-1">No purchases yet</p>
            <p className="text-xs text-muted mb-4">Buy your first credit package to get started.</p>
            <Link href="/admin/credits/buy"
              className="px-4 py-2 bg-teal text-white text-sm font-semibold rounded-xl hover:bg-teal-2 transition-colors">
              View Packages
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Package</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wide">Credits</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Order ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchases.map(p => {
                const s = STATUS_META[p.status] ?? STATUS_META.created
                return (
                  <tr key={p.id} className="hover:bg-bg transition-colors">
                    <td className="px-5 py-3.5 text-muted text-xs">{formatDate(p.created_at)}</td>
                    <td className="px-5 py-3.5 font-medium text-text">
                      {p.credit_packages?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-navy">{p.credits_to_award}</td>
                    <td className="px-5 py-3.5 text-right text-text">{formatPrice(p.amount_paise)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-muted font-mono truncate max-w-[120px] block">
                        {p.razorpay_order_id}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Help note */}
      <p className="text-xs text-muted text-center">
        For refunds or payment issues, contact{' '}
        <a href="mailto:info@yuktraai.com" className="text-teal hover:underline">info@yuktraai.com</a>
        {' '}with your Order ID.
      </p>
    </div>
  )
}
