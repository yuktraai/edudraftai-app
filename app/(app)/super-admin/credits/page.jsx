'use client'

import { useState, useEffect } from 'react'

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function SuperAdminCreditsPage() {
  // ── Colleges list ──────────────────────────────────────────────────────────
  const [colleges, setColleges]               = useState([])
  const [loadingColleges, setLoadingColleges] = useState(true)

  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedCollegeId, setSelectedCollegeId] = useState('')
  const [lecturers, setLecturers]                 = useState([])
  const [loadingLecturers, setLoadingLecturers]   = useState(false)
  const [selectedUserId, setSelectedUserId]       = useState('')
  const [amount, setAmount]                       = useState('')
  const [note, setNote]                           = useState('')
  const [submitting, setSubmitting]               = useState(false)
  const [result, setResult]                       = useState(null)   // { ok, assigned } | { error }

  // ── History ────────────────────────────────────────────────────────────────
  const [history, setHistory]             = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [historyCollege, setHistoryCollege] = useState('')

  // ── Fetch colleges ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/super-admin/colleges-list')
      .then(r => r.json())
      .then(({ data }) => { setColleges(data ?? []); setLoadingColleges(false) })
      .catch(() => setLoadingColleges(false))
  }, [])

  // ── Fetch lecturers when college changes ───────────────────────────────────
  useEffect(() => {
    if (!selectedCollegeId) { setLecturers([]); setSelectedUserId(''); return }
    setLoadingLecturers(true)
    setSelectedUserId('')
    fetch(`/api/super-admin/lecturers?college_id=${selectedCollegeId}&role=all`)
      .then(r => r.json())
      .then(({ users }) => { setLecturers(users ?? []); setLoadingLecturers(false) })
      .catch(() => setLoadingLecturers(false))
  }, [selectedCollegeId])

  // ── Fetch history ──────────────────────────────────────────────────────────
  function fetchHistory(collegeId = '') {
    setLoadingHistory(true)
    const qs = collegeId ? `?college_id=${collegeId}` : ''
    fetch(`/api/super-admin/credits/assign${qs}`)
      .then(r => r.json())
      .then(({ history }) => { setHistory(history ?? []); setLoadingHistory(false) })
      .catch(() => setLoadingHistory(false))
  }

  useEffect(() => { fetchHistory(historyCollege) }, [historyCollege])

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedUserId || !amount || Number(amount) < 1) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/super-admin/credits/assign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user_id: selectedUserId, amount: Number(amount), note: note.trim() }),
      })
      const json = await res.json()
      setResult(json)
      if (res.ok) {
        // Reset form
        setSelectedUserId('')
        setAmount('')
        setNote('')
        // Refresh history
        fetchHistory(historyCollege)
      }
    } catch (err) {
      setResult({ error: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedLecturer = lecturers.find(l => l.id === selectedUserId)

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-border bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent'
  const selectCls = inputCls + ' disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="p-6 md:p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-navy">Assign Individual Credits</h1>
        <p className="text-muted text-sm mt-1">
          Grant personal credits to any lecturer. These credits appear as "My Credits" in their sidebar
          and are used before their college pool credits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left: Assignment form ──────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-5 h-fit">
          <h2 className="font-semibold text-text text-base">Grant Credits</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Step 1: College */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-text">
                <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] flex items-center justify-center font-bold shrink-0">1</span>
                Select College
              </label>
              {loadingColleges ? (
                <div className="px-3 py-2.5 text-sm text-muted animate-pulse bg-bg rounded-xl border border-border">Loading colleges…</div>
              ) : (
                <select value={selectedCollegeId} onChange={e => setSelectedCollegeId(e.target.value)} className={selectCls} required>
                  <option value="">Choose a college…</option>
                  {colleges.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Step 2: Lecturer */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-text">
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 ${selectedCollegeId ? 'bg-navy text-white' : 'bg-border text-muted'}`}>2</span>
                Select Lecturer
              </label>
              {loadingLecturers ? (
                <div className="px-3 py-2.5 text-sm text-muted animate-pulse bg-bg rounded-xl border border-border">Loading lecturers…</div>
              ) : (
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className={selectCls}
                  disabled={!selectedCollegeId || lecturers.length === 0}
                  required
                >
                  <option value="">
                    {!selectedCollegeId
                      ? 'Select a college first'
                      : lecturers.length === 0
                      ? 'No active lecturers found'
                      : 'Choose a lecturer…'}
                  </option>
                  {lecturers.map(l => (
                    <option key={l.id} value={l.id}>{l.name} — {l.email}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Step 3: Amount */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-text">
                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 ${selectedUserId ? 'bg-navy text-white' : 'bg-border text-muted'}`}>3</span>
                Credit Amount
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 50"
                className={inputCls}
                disabled={!selectedUserId}
                required
              />
              <p className="text-xs text-muted pl-1">Each AI generation costs 1 credit.</p>
            </div>

            {/* Optional note */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text flex items-center gap-1">
                Note <span className="text-muted text-xs font-normal">(optional)</span>
              </label>
              <input
                type="text"
                maxLength={200}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Monthly allocation for April 2026"
                className={inputCls}
                disabled={!selectedUserId}
              />
            </div>

            {/* Preview strip */}
            {selectedLecturer && amount && Number(amount) > 0 && (
              <div className="bg-teal/5 border border-teal/30 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-navy">{selectedLecturer.name}</p>
                  <p className="text-[11px] text-muted">{selectedLecturer.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-teal">+{amount}</p>
                  <p className="text-[10px] text-muted">credits</p>
                </div>
              </div>
            )}

            {/* Result feedback */}
            {result && (
              result.ok ? (
                <div className="flex items-start gap-2 bg-teal-light border border-teal rounded-xl px-4 py-3 text-sm text-navy">
                  <svg className="w-4 h-4 text-teal shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-semibold">{result.assigned?.amount} credits</span> assigned to{' '}
                    <span className="font-semibold">{result.assigned?.name}</span> successfully.
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-error">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {result.error ?? 'Something went wrong.'}
                </div>
              )
            )}

            <button
              type="submit"
              disabled={submitting || !selectedUserId || !amount || Number(amount) < 1}
              className="w-full py-3 rounded-xl bg-teal text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Assigning…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Assign Credits
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Right: Recent history ──────────────────────────────────────── */}
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text text-base">Assignment History</h2>
            <select
              value={historyCollege}
              onChange={e => setHistoryCollege(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-bg text-text focus:outline-none focus:ring-2 focus:ring-teal/40"
            >
              <option value="">All colleges</option>
              {colleges.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {loadingHistory ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-bg rounded-xl animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-10 h-10 text-border mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-muted text-sm">No credits assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {history.map(row => (
                <div key={row.id} className="flex items-center justify-between bg-bg border border-border rounded-xl px-4 py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {row.users?.name ?? '—'}
                    </p>
                    <p className="text-xs text-muted truncate">{row.users?.email ?? '—'}</p>
                    <p className="text-[10px] text-muted mt-0.5">{formatDate(row.created_at)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-bold text-teal">+{row.amount}</span>
                    <p className="text-[10px] text-muted">credits</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
