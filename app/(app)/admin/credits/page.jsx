'use client'

import { useState, useEffect, useCallback } from 'react'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const REASON_LABELS = {
  initial_grant:      'Initial Grant',
  admin_grant:        'Admin Grant',
  monthly_allocation: 'Monthly Allocation',
  content_generation: 'Generation Used',
  refund:             'Refund',
}

// ── Ledger Drawer ─────────────────────────────────────────────────────────────
function LedgerDrawer({ userId, onClose }) {
  const [rows,    setRows]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/credits/ledger?user_id=${userId}`)
      .then(r => r.json())
      .then(({ data }) => setRows(data ?? []))
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <tr>
      <td colSpan={5} className="px-5 pb-4 bg-bg">
        <div className="border border-border rounded-xl overflow-hidden mt-1">
          <div className="px-4 py-2.5 bg-surface border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">Credit Ledger (last 50)</span>
            <button onClick={onClose} className="text-xs text-muted hover:text-text transition-colors">Close ↑</button>
          </div>
          {loading ? (
            <div className="px-4 py-3 text-xs text-muted animate-pulse">Loading…</div>
          ) : rows?.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted">No transactions yet.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-muted font-semibold">Date</th>
                  <th className="px-4 py-2 text-left text-muted font-semibold">Reason</th>
                  <th className="px-4 py-2 text-right text-muted font-semibold">Amount</th>
                  <th className="px-4 py-2 text-left text-muted font-semibold">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-surface">
                    <td className="px-4 py-2 text-muted">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-2 text-text">{REASON_LABELS[row.reason] ?? row.reason}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${row.amount > 0 ? 'text-success' : 'text-error'}`}>
                      {row.amount > 0 ? `+${row.amount}` : row.amount}
                    </td>
                    <td className="px-4 py-2 text-muted">{row.users?.name ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Allocate Modal ────────────────────────────────────────────────────────────
function AllocateModal({ user, poolBalance, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState(10)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleAllocate() {
    if (!amount || amount <= 0) return
    setError(null)
    setLoading(true)
    try {
      const res  = await fetch('/api/credits/allocate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ target_user_id: user.id, amount }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Allocation failed'); setLoading(false); return }
      onSuccess()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-navy">Allocate Credits</h2>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-bg border border-border rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-text">{user.name}</p>
          <p className="text-xs text-muted">{user.email}</p>
          <p className="text-xs text-muted mt-1">Current balance: <strong className="text-text">{user.balance}</strong></p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Credits to allocate</label>
          <div className="flex gap-2 mb-3">
            {[5, 10, 20, 50].map(n => (
              <button key={n} type="button" onClick={() => setAmount(n)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  amount === n ? 'bg-teal text-white border-teal' : 'bg-bg border-border text-muted hover:border-teal hover:text-teal'
                }`}>
                {n}
              </button>
            ))}
          </div>
          <input
            type="number" min="1" max={poolBalance} value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
          />
          <p className="text-xs text-muted mt-1.5">
            Pool after allocation: <strong>{poolBalance - amount >= 0 ? poolBalance - amount : '⚠ Not enough'}</strong>
          </p>
        </div>

        {error && <p className="text-sm text-error bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-muted border border-border rounded-xl hover:border-text hover:text-text transition-colors">
            Cancel
          </button>
          <button onClick={handleAllocate} disabled={loading || amount <= 0 || amount > poolBalance}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-teal text-white rounded-xl hover:bg-teal-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? 'Allocating…' : `Allocate ${amount} Credits`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminCreditsPage() {
  const [data,          setData]          = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [modal,         setModal]         = useState(null)
  const [expandedUser,  setExpandedUser]  = useState(null)
  const [toast,         setToast]         = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/credits/pool')
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to load'); setLoading(false); return }
      setData(json)
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handleAllocateSuccess() {
    setModal(null)
    setToast('Credits allocated successfully!')
    setTimeout(() => setToast(null), 3000)
    load()
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl space-y-4">
        <div className="h-8 w-48 bg-border rounded animate-pulse" />
        {[1,2,3].map(i => <div key={i} className="h-16 bg-border rounded-xl animate-pulse" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl">
        <p className="text-error text-sm">{error}</p>
        <button onClick={load} className="mt-3 text-sm text-teal hover:underline">Try again</button>
      </div>
    )
  }

  const { pool_balance, users } = data ?? { pool_balance: 0, users: [] }

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-success text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {toast}
        </div>
      )}

      <div>
        <h1 className="font-heading text-2xl font-bold text-navy">Credit Management</h1>
        <p className="text-muted text-sm mt-1">Allocate credits from your college pool to lecturers.</p>
      </div>

      {/* Pool balance card */}
      <div className="bg-surface border border-border rounded-xl p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted font-medium">College Credit Pool</p>
          <p className="text-3xl font-bold text-navy mt-1">{pool_balance}</p>
          <p className="text-xs text-muted mt-0.5">credits available to allocate</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-light flex items-center justify-center">
            <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <button onClick={load} className="text-xs text-muted hover:text-teal transition-colors">↺ Refresh</button>
        </div>
      </div>

      {pool_balance === 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <svg className="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-warning">Pool is empty</p>
            <p className="text-xs text-amber-700 mt-0.5">Contact Yuktra AI at info@yuktraai.com to purchase credits.</p>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Users & Balances</h2>
          <span className="text-xs text-muted">{users.length} active users</span>
        </div>

        {users.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted">No active users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wide">Role</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wide">Balance</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <>
                  <tr key={u.id} className="border-b border-border hover:bg-bg transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-text">{u.name}</p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'college_admin' ? 'bg-navy text-white' : 'bg-teal-light text-teal'
                      }`}>
                        {u.role === 'college_admin' ? 'Admin' : 'Lecturer'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-semibold ${u.balance > 0 ? 'text-success' : 'text-error'}`}>{u.balance}</span>
                      <span className="text-muted text-xs ml-1">credits</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                          className="px-3 py-1.5 text-xs font-medium text-muted border border-border rounded-lg hover:border-navy hover:text-navy transition-colors"
                        >
                          {expandedUser === u.id ? 'Hide' : 'Ledger'}
                        </button>
                        <button
                          onClick={() => setModal(u)}
                          disabled={pool_balance === 0}
                          className="px-3 py-1.5 text-xs font-medium text-teal border border-teal rounded-lg hover:bg-teal hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Allocate
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedUser === u.id && (
                    <LedgerDrawer key={`ledger-${u.id}`} userId={u.id} onClose={() => setExpandedUser(null)} />
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <AllocateModal
          user={modal}
          poolBalance={pool_balance}
          onClose={() => setModal(null)}
          onSuccess={handleAllocateSuccess}
        />
      )}
    </div>
  )
}
