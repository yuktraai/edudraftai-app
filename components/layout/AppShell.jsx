'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

/**
 * AppShell — wraps the app layout with a responsive sidebar.
 * Desktop: sidebar always visible on the left.
 * Mobile (< lg): sidebar hidden, hamburger toggles a slide-out drawer + backdrop.
 */
export function AppShell({ role, name, creditBalance, children }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else       document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div className="flex h-screen overflow-hidden bg-bg">

      {/* ── Desktop sidebar (always visible ≥ lg) ─────────────────────────── */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar role={role} name={name} creditBalance={creditBalance} />
      </div>

      {/* ── Mobile drawer backdrop ─────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile slide-out drawer ────────────────────────────────────────── */}
      <div className={`
        fixed inset-y-0 left-0 z-40 lg:hidden
        transform transition-transform duration-250 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar role={role} name={name} creditBalance={creditBalance} onClose={() => setOpen(false)} />
      </div>

      {/* ── Main content area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-navy border-b border-navy-2 shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="text-white p-1.5 rounded-lg hover:bg-navy-2 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="font-heading text-base font-bold text-white">EduDraftAI</span>
          {creditBalance !== null && (
            <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${
              creditBalance > 0 ? 'bg-teal text-white' : 'bg-error text-white'
            }`}>
              {creditBalance} credits
            </span>
          )}
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
