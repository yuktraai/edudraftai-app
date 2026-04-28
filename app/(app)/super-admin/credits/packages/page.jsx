'use client'

import { useState, useEffect } from 'react'

function formatPrice(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

function perCreditPrice(paise, credits) {
  return `₹${(paise / 100 / credits).toFixed(1)}`
}

// ── Package form (add / edit) ─────────────────────────────────────────────────
function PackageForm({ initial, onSave, onCancel, saving }) {
  const [name,       setName]       = useState(initial?.name       ?? '')
  const [credits,    setCredits]    = useState(initial?.credits    ?? '')
  const [priceRs,    setPriceRs]    = useState(initial ? (initial.price_paise / 100) : '')
  const [isPopular,  setIsPopular]  = useState(initial?.is_popular ?? false)
  const [sortOrder,  setSortOrder]  = useState(initial?.sort_order ?? 0)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !credits || !priceRs) return
    onSave({
      name:        name.trim(),
      credits:     parseInt(credits, 10),
      price_paise: Math.round(parseFloat(priceRs) * 100),
      is_popular:  isPopular,
      sort_order:  parseInt(sortOrder, 10) || 0,
    })
  }

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-teal'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-semibold text-text">Package Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. 25 Credits"
            maxLength={100}
            required
            className={inputCls}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-text">Credits</label>
          <input
            type="number"
            value={credits}
            onChange={e => setCredits(e.target.value)}
            placeholder="e.g. 25"
            min={1}
            required
            className={inputCls}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-text">Price (₹)</label>
          <input
            type="number"
            value={priceRs}
            onChange={e => setPriceRs(e.target.value)}
            placeholder="e.g. 109"
            min={1}
            step="0.01"
            required
            className={inputCls}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-text">Sort Order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            min={0}
            className={inputCls}
          />
        </div>
        <div className="flex items-center gap-3 pt-5">
          <button
            type="button"
            onClick={() => setIsPopular(!isPopular)}
            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${isPopular ? 'bg-teal' : 'bg-border'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPopular ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-sm text-text">Mark as Most Popular</span>
        </div>
      </div>

      {/* Per-credit preview */}
      {credits && priceRs && (
        <p className="text-xs text-muted">
          ₹{(parseFloat(priceRs) / parseInt(credits, 10)).toFixed(2)} per credit
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-2 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Package'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-border text-sm text-text hover:bg-bg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PersonalPackagesPage() {
  const [packages,   setPackages]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showAdd,    setShowAdd]    = useState(false)
  const [editPkg,    setEditPkg]    = useState(null)  // package object being edited
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)
  const [success,    setSuccess]    = useState(null)

  function loadPackages() {
    setLoading(true)
    fetch('/api/credits/personal/packages')
      .then(r => r.json())
      .then(({ packages: pkgs }) => { setPackages(pkgs ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadPackages() }, [])

  async function handleAdd(data) {
    setSaving(true); setError(null)
    const res  = await fetch('/api/credits/personal/packages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Failed to add package'); return }
    setSuccess('Package added.')
    setShowAdd(false)
    loadPackages()
    setTimeout(() => setSuccess(null), 3000)
  }

  async function handleEdit(data) {
    if (!editPkg) return
    setSaving(true); setError(null)
    const res  = await fetch(`/api/credits/personal/packages/${editPkg.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error ?? 'Failed to update'); return }
    setSuccess('Package updated.')
    setEditPkg(null)
    loadPackages()
    setTimeout(() => setSuccess(null), 3000)
  }

  async function handleDeactivate(pkg) {
    if (!confirm(`Deactivate "${pkg.name}"? Lecturers will no longer see it.`)) return
    const res  = await fetch(`/api/credits/personal/packages/${pkg.id}`, { method: 'DELETE' })
    if (res.ok) { setSuccess('Package deactivated.'); loadPackages(); setTimeout(() => setSuccess(null), 3000) }
    else setError('Failed to deactivate package.')
  }

  async function handleTogglePopular(pkg) {
    await fetch(`/api/credits/personal/packages/${pkg.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ is_popular: !pkg.is_popular }),
    })
    loadPackages()
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy">Personal Credit Packages</h1>
          <p className="text-muted text-sm mt-1">Manage what lecturers see when they buy credits individually.</p>
        </div>
        {!showAdd && !editPkg && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Package
          </button>
        )}
      </div>

      {/* Status messages */}
      {error   && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-error">{error}</div>}
      {success && <div className="px-4 py-3 rounded-xl bg-teal/10 border border-teal/20 text-sm text-teal font-medium">{success}</div>}

      {/* Add form */}
      {showAdd && (
        <div className="bg-surface border border-teal/30 rounded-2xl p-6">
          <h2 className="font-semibold text-text mb-4">New Package</h2>
          <PackageForm
            onSave={handleAdd}
            onCancel={() => { setShowAdd(false); setError(null) }}
            saving={saving}
          />
        </div>
      )}

      {/* Edit form */}
      {editPkg && (
        <div className="bg-surface border border-teal/30 rounded-2xl p-6">
          <h2 className="font-semibold text-text mb-4">Edit: {editPkg.name}</h2>
          <PackageForm
            initial={editPkg}
            onSave={handleEdit}
            onCancel={() => { setEditPkg(null); setError(null) }}
            saving={saving}
          />
        </div>
      )}

      {/* Packages list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-bg border border-border rounded-2xl animate-pulse" />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">
          No packages yet. Add one to let lecturers buy credits.
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map(pkg => (
            <div key={pkg.id} className={`bg-surface border rounded-2xl px-5 py-4 flex items-center gap-4 ${pkg.is_popular ? 'border-teal' : 'border-border'}`}>
              {/* Popular star */}
              <button
                onClick={() => handleTogglePopular(pkg)}
                title={pkg.is_popular ? 'Remove Most Popular' : 'Mark as Most Popular'}
                className={`shrink-0 transition-colors ${pkg.is_popular ? 'text-teal' : 'text-border hover:text-muted'}`}
              >
                <svg className="w-5 h-5" fill={pkg.is_popular ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>

              {/* Package details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-text">{pkg.name}</span>
                  {pkg.is_popular && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal text-white">Most Popular</span>
                  )}
                </div>
                <p className="text-sm text-muted mt-0.5">
                  <span className="font-semibold text-text">{pkg.credits} credits</span>
                  {' · '}{formatPrice(pkg.price_paise)}
                  {' · '}{perCreditPrice(pkg.price_paise, pkg.credits)} / credit
                  {' · '}Sort: {pkg.sort_order}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => { setEditPkg(pkg); setShowAdd(false); setError(null) }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-text hover:bg-bg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeactivate(pkg)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-error hover:bg-red-50 transition-colors"
                >
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="bg-bg border border-border rounded-xl px-4 py-3 flex items-start gap-3">
        <svg className="w-4 h-4 text-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p className="text-xs text-muted">
          Prices are stored in paise (1 ₹ = 100 paise) and sourced directly from the DB on every purchase — the client never controls the price. Deactivating a package hides it immediately from all lecturers.
        </p>
      </div>
    </div>
  )
}
