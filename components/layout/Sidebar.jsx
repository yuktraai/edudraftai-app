'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { SignOutButton } from '@/components/layout/SignOutButton'

const NAV_LINKS = {
  super_admin: [
    { label: 'Colleges',         href: '/super-admin/colleges' },
    { label: 'Departments',      href: '/super-admin/departments' },
    { label: 'Subjects',         href: '/super-admin/subjects' },
    { label: 'Syllabus Manager', href: '/super-admin/syllabus' },
    { label: 'Copy Department',  href: '/super-admin/copy-department' },
    { label: 'Assign Credits',   href: '/super-admin/credits' },
    { label: 'Credit Packages',  href: '/super-admin/credits/packages' },
    { label: 'Analytics',        href: '/super-admin/analytics' },
    { label: 'Webinars',         href: '/super-admin/webinars' },
    { label: 'Logs',             href: '/super-admin/logs' },
    { label: 'Waitlist',         href: '/super-admin/waitlist' },
    { label: 'Support Tickets',  href: '/super-admin/tickets' },
    { label: 'College Pilot',    href: '/super-admin/college-pilot' },
    { label: 'Careers',          href: '/super-admin/careers' },
    { label: "What's New",       href: '/super-admin/changelog', alertKey: 'changelog' },
  ],
  college_admin: [
    { label: 'Dashboard',    href: '/admin/dashboard' },
    { label: 'Generate',     href: '/generate' },
    { label: 'My Drafts',    href: '/drafts' },
    { label: 'Lecturers',    href: '/admin/users',      alertKey: 'zeroCredits' },
    { label: 'Departments',  href: '/admin/departments' },
    { label: 'Subjects',     href: '/admin/subjects' },
    { label: 'Syllabus',     href: '/syllabus' },
    { label: 'Credits',      href: '/admin/credits' },
    { label: 'Buy Credits',  href: '/admin/credits/buy' },
    { label: "What's New",   href: '/whats-new',        alertKey: 'changelog' },
    { label: 'My Tickets',   href: '/help/tickets' },
    { label: 'Profile',      href: '/profile' },
  ],
  lecturer: [
    { label: 'Dashboard',   href: '/dashboard' },
    { label: 'Generate',    href: '/generate' },
    { label: 'My Drafts',   href: '/drafts' },
    { label: 'Syllabus',    href: '/syllabus' },
    { label: 'Library',     href: '/library' },
    { label: 'Buy Credits', href: '/credits/buy' },
    { label: "What's New",  href: '/whats-new',       alertKey: 'changelog' },
    { label: 'My Tickets',  href: '/help/tickets' },
    { label: 'Profile',     href: '/profile' },
  ],
}

const ROLE_LABELS = {
  super_admin:   'Yuktra AI (Super Admin)',
  college_admin: 'College Admin',
  lecturer:      'Lecturer',
}

// ── Inline name editor ────────────────────────────────────────────────────────
function NameEditor({ initialName }) {
  const [editing,  setEditing]  = useState(false)
  const [value,    setValue]    = useState(initialName)
  const [display,  setDisplay]  = useState(initialName)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState(null)
  const inputRef = useRef(null)
  const router   = useRouter()

  // Focus input when editing starts
  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  // Sync if prop changes (e.g. server refresh)
  useEffect(() => { setDisplay(initialName); setValue(initialName) }, [initialName])

  async function handleSave() {
    const trimmed = value.trim()
    if (!trimmed) { setError('Name cannot be empty'); return }
    if (trimmed === display) { setEditing(false); return }

    setSaving(true); setError(null)
    try {
      const res  = await fetch('/api/profile/update-name', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: trimmed }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Update failed'); return }
      setDisplay(trimmed)
      setEditing(false)
      router.refresh()  // re-fetches server layout so dashboard greeting also updates
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter')  handleSave()
    if (e.key === 'Escape') { setValue(display); setEditing(false); setError(null) }
  }

  if (editing) {
    return (
      <div className="space-y-1.5">
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={100}
          className="w-full px-2 py-1 text-sm bg-navy-2 text-white border border-teal/40 rounded-lg focus:outline-none focus:border-teal"
          placeholder="Your name"
        />
        {error && <p className="text-[10px] text-error">{error}</p>}
        <div className="flex gap-1.5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 text-[11px] font-semibold px-2 py-1 bg-teal text-white rounded-md hover:bg-teal-2 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => { setValue(display); setEditing(false); setError(null) }}
            className="flex-1 text-[11px] font-semibold px-2 py-1 bg-navy-2 text-slate-300 rounded-md hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1.5 w-full text-left"
      title="Click to edit your name"
    >
      <p className="text-sm font-medium text-white truncate flex-1">{display}</p>
      <svg
        className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal shrink-0 transition-colors"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      </svg>
    </button>
  )
}

export function Sidebar({ role, name, creditBalance, personalCreditBalance, demoCreditsRemaining = 0, hasZeroBalanceLecturers, onClose }) {
  const pathname = usePathname()
  const links    = NAV_LINKS[role] ?? NAV_LINKS.lecturer

  // Unread changelog count — fetched once on mount, re-zeroed when user visits the page
  const [changelogUnread, setChangelogUnread] = useState(0)
  useEffect(() => {
    fetch('/api/changelog')
      .then(r => r.json())
      .then(({ unreadCount }) => setChangelogUnread(unreadCount ?? 0))
      .catch(() => {})
  }, [pathname])   // re-check after navigation (visiting the page marks as read)

  return (
    <aside className="w-64 shrink-0 bg-navy flex flex-col h-full">
      {/* Logo + optional mobile close button */}
      <div className="px-6 py-5 border-b border-navy-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="EduDraftAI" className="w-9 h-9 rounded-xl shrink-0" />
          <div>
            <span className="font-heading text-xl font-bold text-white tracking-tight">
              EduDraftAI
            </span>
            <p className="text-xs text-slate-400 mt-0.5">by Yuktra AI</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-navy-2 lg:hidden"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Credit balance badge — lecturer & college_admin */}
      {creditBalance !== null && (
        <div
          id="sidebar-credits"
          className={`mx-3 mt-3 px-3 py-2.5 rounded-lg flex items-center justify-between ${
            demoCreditsRemaining > 0 && creditBalance === 0 ? 'bg-teal/10 border border-teal/30' :
            creditBalance <= 5   ? 'bg-red-900/20 border border-red-800/30' :
            creditBalance <= 20  ? 'bg-amber-900/20 border border-amber-800/30' :
            'bg-navy-2'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="text-xs text-slate-300">Credits</span>
              {demoCreditsRemaining > 0 && creditBalance === 0 && (
                <p className="text-[10px] text-teal leading-none mt-0.5">demo</p>
              )}
            </div>
          </div>
          <span className={`text-sm font-bold ${
            demoCreditsRemaining > 0 && creditBalance === 0 ? 'text-teal' :
            creditBalance > 20  ? 'text-teal'
            : creditBalance > 5 ? 'text-warning'
            : creditBalance > 0 ? 'text-error animate-pulse'
            : 'text-error'
          }`}>
            {demoCreditsRemaining > 0 && creditBalance === 0 ? demoCreditsRemaining : creditBalance}
          </span>
        </div>
      )}

      {/* Personal credit balance pill — lecturer only, shown when > 0 */}
      {personalCreditBalance > 0 && (
        <div className="mx-3 mt-1.5 px-3 py-2 rounded-lg bg-navy-2 flex items-center justify-between">
          <span className="text-xs text-slate-300">My Credits</span>
          <span className="text-sm font-bold text-teal">{personalCreditBalance}</span>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ label, href, alertKey }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard' && href !== '/generate' && pathname.startsWith(href))

          // Show alert dot on "Lecturers" when any lecturer is at 0 credits
          const showZeroAlert     = alertKey === 'zeroCredits' && hasZeroBalanceLecturers
          const showChangelogBadge = alertKey === 'changelog' && changelogUnread > 0

          return (
            <Link
              key={href}
              id={
                href === '/generate' ? 'nav-generate' :
                href === '/drafts'   ? 'nav-drafts'   :
                href === '/syllabus' ? 'nav-syllabus'  :
                undefined
              }
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal text-white shadow-sm'
                  : 'text-slate-300 hover:bg-navy-2 hover:text-white'
              }`}
            >
              <span className="flex-1">{label}</span>
              {showZeroAlert && (
                <span
                  className="inline-block w-2 h-2 rounded-full bg-error shrink-0"
                  title="One or more lecturers are out of credits"
                />
              )}
              {showChangelogBadge && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-teal text-white text-[10px] font-bold shrink-0">
                  {changelogUnread}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User info + sign out */}
      <div className="px-5 py-4 border-t border-navy-2">
        <NameEditor initialName={name} />
        <p className="text-xs text-slate-400 mt-0.5">{ROLE_LABELS[role] ?? role}</p>
        <SignOutButton />
      </div>
    </aside>
  )
}
