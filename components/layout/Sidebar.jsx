'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { SignOutButton } from '@/components/layout/SignOutButton'

// ── SVG icon map ────────────────────────────────────────────────────────────
const ICONS = {
  dashboard:    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />,
  generate:     <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />,
  drafts:       <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
  syllabus:     <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />,
  library:      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />,
  credits:      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  whatsnew:     <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />,
  tickets:      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />,
  profile:      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
  colleges:     <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />,
  departments:  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />,
  subjects:     <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />,
  analytics:    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />,
  logs:         <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />,
  waitlist:     <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />,
  webinars:     <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />,
  careers:      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />,
  pilot:        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />,
  copy:         <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />,
  buycredits:   <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />,
  lecturers:    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
  changelog:    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />,
}

function NavIcon({ iconKey }) {
  const d = ICONS[iconKey]
  if (!d) return null
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      {d}
    </svg>
  )
}

const NAV_LINKS = {
  super_admin: [
    { label: 'Colleges',         href: '/super-admin/colleges',       icon: 'colleges' },
    { label: 'Departments',      href: '/super-admin/departments',     icon: 'departments' },
    { label: 'Subjects',         href: '/super-admin/subjects',        icon: 'subjects' },
    { label: 'Syllabus Manager', href: '/super-admin/syllabus',        icon: 'syllabus' },
    { label: 'Copy Department',  href: '/super-admin/copy-department', icon: 'copy' },
    { label: 'Assign Credits',   href: '/super-admin/credits',         icon: 'credits' },
    { label: 'Credit Packages',  href: '/super-admin/credits/packages',icon: 'buycredits' },
    { label: 'Analytics',        href: '/super-admin/analytics',       icon: 'analytics' },
    { label: 'Webinars',         href: '/super-admin/webinars',        icon: 'webinars' },
    { label: 'Logs',             href: '/super-admin/logs',            icon: 'logs' },
    { label: 'Waitlist',         href: '/super-admin/waitlist',        icon: 'waitlist' },
    { label: 'Support Tickets',  href: '/super-admin/tickets',         icon: 'tickets' },
    { label: 'College Pilot',    href: '/super-admin/college-pilot',   icon: 'pilot' },
    { label: 'Careers',          href: '/super-admin/careers',         icon: 'careers' },
    { label: "What's New",       href: '/super-admin/changelog',       icon: 'changelog', alertKey: 'changelog' },
  ],
  college_admin: [
    { label: 'Dashboard',    href: '/admin/dashboard',  icon: 'dashboard' },
    { label: 'Generate',     href: '/generate',         icon: 'generate' },
    { label: 'My Drafts',    href: '/drafts',            icon: 'drafts' },
    { label: 'Lecturers',    href: '/admin/users',       icon: 'lecturers', alertKey: 'zeroCredits' },
    { label: 'Departments',  href: '/admin/departments', icon: 'departments' },
    { label: 'Subjects',     href: '/admin/subjects',    icon: 'subjects' },
    { label: 'Syllabus',     href: '/syllabus',          icon: 'syllabus' },
    { label: 'Credits',      href: '/admin/credits',     icon: 'credits' },
    { label: 'Buy Credits',  href: '/admin/credits/buy', icon: 'buycredits' },
    { label: "What's New",   href: '/whats-new',         icon: 'changelog', alertKey: 'changelog' },
    { label: 'My Tickets',   href: '/help/tickets',      icon: 'tickets' },
    { label: 'Profile',      href: '/profile',           icon: 'profile' },
  ],
  lecturer: [
    { label: 'Dashboard',   href: '/dashboard',   icon: 'dashboard' },
    { label: 'Generate',    href: '/generate',    icon: 'generate' },
    { label: 'My Drafts',   href: '/drafts',       icon: 'drafts' },
    { label: 'Syllabus',    href: '/syllabus',     icon: 'syllabus' },
    { label: 'Library',     href: '/library',     icon: 'library' },
    { label: 'Buy Credits', href: '/credits/buy', icon: 'buycredits' },
    { label: "What's New",  href: '/whats-new',   icon: 'changelog', alertKey: 'changelog' },
    { label: 'My Tickets',  href: '/help/tickets', icon: 'tickets' },
    { label: 'Profile',     href: '/profile',     icon: 'profile' },
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
        {links.map(({ label, href, alertKey, icon }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard' && href !== '/generate' && pathname.startsWith(href))

          const showZeroAlert      = alertKey === 'zeroCredits' && hasZeroBalanceLecturers
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
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                isActive
                  ? 'bg-teal/15 text-teal border-l-[3px] border-teal pl-[9px]'
                  : 'text-slate-300 hover:bg-navy-2 hover:text-white border-l-[3px] border-transparent pl-[9px]'
              }`}
            >
              {icon && (
                <span className={isActive ? 'text-teal' : 'text-slate-500'}>
                  <NavIcon iconKey={icon} />
                </span>
              )}
              <span className="flex-1 truncate">{label}</span>
              {showZeroAlert && (
                <span
                  className="inline-block w-2 h-2 rounded-full bg-error shrink-0"
                  title="One or more lecturers are out of credits"
                />
              )}
              {showChangelogBadge && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-teal text-navy text-[10px] font-bold shrink-0">
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
