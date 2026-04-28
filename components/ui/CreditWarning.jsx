'use client'

import { useState } from 'react'
import Link from 'next/link'

export function CreditWarning({ balance, role }) {
  const [dismissed, setDismissed] = useState(() => {
    // Restore dismiss state from sessionStorage
    if (typeof window === 'undefined') return false
    const key = `credit_warning_dismissed_${balance}`
    return sessionStorage.getItem(key) === '1'
  })

  if (balance === null || balance === undefined || balance > 5 || dismissed) return null

  const isZero = balance === 0
  const bg     = isZero ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'
  const icon   = isZero ? 'text-error' : 'text-warning'
  const text   = isZero ? 'text-error' : 'text-amber-700'
  // balance here is effectiveBalance (pool + personal + demo)
  const label  = isZero
    ? 'No credits remaining — content generation is disabled. Buy credits or contact your admin.'
    : `Only ${balance} credit${balance === 1 ? '' : 's'} remaining. Top up soon to keep generating.`

  function handleDismiss() {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`credit_warning_dismissed_${balance}`, '1')
    }
    setDismissed(true)
  }

  return (
    <div className={`mx-6 mt-4 flex items-center gap-3 border rounded-xl px-4 py-3 ${bg}`}>
      <svg className={`w-4 h-4 shrink-0 ${icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <p className={`text-xs font-medium flex-1 ${text}`}>{label}</p>
      {role === 'college_admin' && (
        <Link href="/admin/credits/buy" className={`text-xs font-semibold underline underline-offset-2 shrink-0 ${text}`}>
          Buy Credits
        </Link>
      )}
      <button
        onClick={handleDismiss}
        className={`shrink-0 ${icon} opacity-60 hover:opacity-100 transition-opacity`}
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
