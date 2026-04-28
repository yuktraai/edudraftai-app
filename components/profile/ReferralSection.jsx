'use client'

import { useState, useEffect } from 'react'

function StatusBadge({ status }) {
  return status === 'rewarded'
    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal text-white">Rewarded</span>
    : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Pending</span>
}

export function ReferralSection() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied,  setCopied]  = useState(false)

  useEffect(() => {
    fetch('/api/users/referral')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function handleCopy(text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-3 animate-pulse">
        <div className="h-4 w-1/3 bg-border rounded" />
        <div className="h-10 bg-bg border border-border rounded-xl" />
        <div className="h-4 w-1/2 bg-border rounded" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div>
        <h2 className="font-semibold text-text text-base">Refer &amp; Earn</h2>
        <p className="text-sm text-muted mt-0.5">
          Invite colleagues to EduDraftAI. Earn <span className="font-semibold text-teal">{data.referralRewardCredits} free credits</span> when they complete their first generation.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Referred',      value: data.totalReferred },
          { label: 'Rewarded',      value: data.totalRewarded },
          { label: 'Credits Earned', value: data.creditsEarned },
        ].map(({ label, value }) => (
          <div key={label} className="bg-bg border border-border rounded-xl px-4 py-3 text-center">
            <p className="text-xl font-bold text-navy">{value}</p>
            <p className="text-xs text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-text">Your Referral Link</label>
        <div className="flex gap-2">
          <input
            readOnly
            value={data.referralLink ?? ''}
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <button
            onClick={() => handleCopy(data.referralLink)}
            className="px-4 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-2 transition-colors shrink-0"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-muted">
          Code: <span className="font-mono font-semibold text-navy">{data.referralCode}</span>
        </p>
      </div>

      {/* Referrals list */}
      {data.referrals && data.referrals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text">Your Referrals</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {data.referrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg border border-border">
                <span className="text-sm text-text">{r.name}</span>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {data.referrals && data.referrals.length === 0 && (
        <p className="text-sm text-muted text-center py-4">
          No referrals yet. Share your link to start earning!
        </p>
      )}
    </div>
  )
}
