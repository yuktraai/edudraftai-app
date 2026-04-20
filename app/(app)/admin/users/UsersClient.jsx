'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

// ── Reactivate + Allocate modal ───────────────────────────────────────────────
function ReactivateModal({ user, onClose, onDone }) {
  const [amount,  setAmount]  = useState(10)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleConfirm() {
    setLoading(true); setError(null)
    try {
      // 1. Reactivate user
      const activateRes = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      })
      if (!activateRes.ok) {
        const j = await activateRes.json()
        setError(j.error ?? 'Failed to reactivate'); setLoading(false); return
      }

      // 2. Allocate credits if amount > 0
      if (amount > 0) {
        const allocRes = await fetch('/api/credits/allocate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_user_id: user.id, amount }),
        })
        if (!allocRes.ok) {
          const j = await allocRes.json()
          // User is now active but allocation failed — still counts as partial success
          onDone(`${user.name} reactivated. Credit allocation failed: ${j.error ?? 'unknown error'}`)
          return
        }
      }
      onDone(`${user.name} reactivated${amount > 0 ? ` with ${amount} credits allocated` : ''}.`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-5">
        <div>
          <h3 className="font-heading text-base font-bold text-navy">Reactivate Lecturer</h3>
          <p className="text-xs text-muted mt-1">
            Reactivating <strong>{user.name}</strong>. Allocate credits from the pool now?
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-text mb-1.5">
            Credits to allocate (0 = reactivate without credits)
          </label>
          <div className="flex gap-2 mb-2">
            {[0, 5, 10, 20].map(n => (
              <button key={n} type="button" onClick={() => setAmount(n)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  amount === n ? 'bg-teal text-white border-teal' : 'bg-bg border-border text-muted hover:border-teal hover:text-teal'
                }`}>
                {n}
              </button>
            ))}
          </div>
          <input
            type="number" min="0" value={amount}
            onChange={e => setAmount(Math.max(0, Number(e.target.value)))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
          />
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-muted border border-border rounded-xl hover:text-text transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-teal text-white rounded-xl hover:bg-teal-2 disabled:opacity-50 transition-colors">
            {loading ? 'Processing…' : 'Reactivate'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Deactivate confirmation modal ─────────────────────────────────────────────
function DeactivateModal({ user, onClose, onDone }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleConfirm() {
    setLoading(true); setError(null)
    try {
      let reclaimedCredits = 0

      // 1. Reclaim all credits first (if any)
      const reclaimRes = await fetch('/api/credits/deallocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: user.id }),
      })
      if (reclaimRes.ok) {
        const j = await reclaimRes.json()
        reclaimedCredits = j.credits_reclaimed ?? 0
      }
      // Non-fatal if reclaim fails (user might have 0 credits) — proceed to deactivate

      // 2. Deactivate user
      const deactivateRes = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false }),
      })
      if (!deactivateRes.ok) {
        const j = await deactivateRes.json()
        setError(j.error ?? 'Failed to deactivate'); setLoading(false); return
      }

      const msg = reclaimedCredits > 0
        ? `${user.name} deactivated. ${reclaimedCredits} credits returned to pool.`
        : `${user.name} deactivated.`
      onDone(msg)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-navy">Deactivate {user.name}?</h3>
            <p className="text-xs text-muted mt-1">
              Their remaining credits will be <strong>automatically returned to the college pool</strong>.
              They will lose access to the platform immediately.
            </p>
          </div>
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-muted border border-border rounded-xl hover:text-text transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-error text-white rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors">
            {loading ? 'Processing…' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main exported component ───────────────────────────────────────────────────
export function UsersClient({ userId, userName, isActive, role }) {
  const router = useRouter()
  const [modal, setModal] = useState(null) // 'deactivate' | 'reactivate' | null

  if (role === 'college_admin') return <span className="text-xs text-muted">—</span>

  function handleDone(msg) {
    setModal(null)
    router.refresh()
    // Brief toast via window — avoids prop drilling
    if (msg) alert(msg)
  }

  return (
    <>
      <Button
        variant={isActive ? 'danger' : 'secondary'}
        size="sm"
        onClick={() => setModal(isActive ? 'deactivate' : 'reactivate')}
      >
        {isActive ? 'Deactivate' : 'Reactivate'}
      </Button>

      {modal === 'deactivate' && (
        <DeactivateModal
          user={{ id: userId, name: userName }}
          onClose={() => setModal(null)}
          onDone={handleDone}
        />
      )}
      {modal === 'reactivate' && (
        <ReactivateModal
          user={{ id: userId, name: userName }}
          onClose={() => setModal(null)}
          onDone={handleDone}
        />
      )}
    </>
  )
}
