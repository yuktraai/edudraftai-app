'use client'

import Link from 'next/link'

/**
 * CreditWarning — amber/red banner shown to lecturer or college_admin
 * when credit balance is critically low.
 *
 * Props:
 *   balance  {number}  — current credit balance
 *   role     {string}  — 'lecturer' | 'college_admin'
 */
export function CreditWarning({ balance, role }) {
  if (balance === null || balance === undefined) return null
  if (balance > 5) return null // only show at ≤ 5 credits

  const isZero    = balance === 0
  const isLow     = balance > 0 && balance <= 5

  const bg     = isZero ? 'bg-red-50 border-red-300'   : 'bg-amber-50 border-amber-300'
  const icon   = isZero ? 'text-error'                  : 'text-warning'
  const text   = isZero ? 'text-error'                  : 'text-amber-700'
  const label  = isZero
    ? 'You have no credits left. Content generation is disabled.'
    : `Only ${balance} credit${balance === 1 ? '' : 's'} remaining.`

  const ctaHref  = role === 'college_admin' ? '/admin/credits/buy' : null
  const ctaLabel = 'Buy Credits'

  return (
    <div className={`mx-6 mt-4 flex items-center gap-3 border rounded-xl px-4 py-3 ${bg}`}>
      {/* Icon */}
      <svg className={`w-4 h-4 shrink-0 ${icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>

      {/* Message */}
      <p className={`text-xs font-medium flex-1 ${text}`}>{label}</p>

      {/* CTA */}
      {ctaHref && (
        <Link
          href={ctaHref}
          className={`text-xs font-semibold underline underline-offset-2 shrink-0 ${text}`}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
