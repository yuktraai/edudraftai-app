'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CloneButton({ draftId, className = '' }) {
  const [state,  setState]  = useState('idle') // 'idle' | 'loading' | 'done' | 'error'
  const [error,  setError]  = useState(null)
  const router = useRouter()

  async function handleClone() {
    setState('loading')
    setError(null)
    try {
      const res  = await fetch('/api/library/clone', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ source_draft_id: draftId }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Clone failed'); setState('error'); return }
      setState('done')
      // Navigate to the cloned draft after brief pause
      setTimeout(() => router.push(`/drafts/${json.cloned_draft_id}`), 800)
    } catch {
      setError('Network error')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold text-teal ${className}`}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Cloned! Redirecting…
      </span>
    )
  }

  return (
    <div className={className}>
      <button
        onClick={handleClone}
        disabled={state === 'loading'}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-2 transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
        </svg>
        {state === 'loading' ? 'Cloning…' : 'Clone to My Drafts'}
      </button>
      {state === 'error' && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  )
}
