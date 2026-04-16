'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@/components/layout/SignOutButton'

const NAV_LINKS = {
  super_admin: [
    { label: 'Colleges',         href: '/super-admin/colleges' },
    { label: 'Syllabus Manager', href: '/super-admin/syllabus' },
    { label: 'Analytics',        href: '/super-admin/analytics' },
    { label: 'Logs',             href: '/super-admin/logs' },
  ],
  college_admin: [
    { label: 'Dashboard',    href: '/admin/dashboard' },
    { label: 'Generate',     href: '/generate' },
    { label: 'My Drafts',    href: '/drafts' },
    { label: 'Lecturers',    href: '/admin/users' },
    { label: 'Departments',  href: '/admin/departments' },
    { label: 'Subjects',     href: '/admin/subjects' },
    { label: 'Syllabus',      href: '/syllabus' },
    { label: 'Credits',       href: '/admin/credits' },
    { label: 'Buy Credits',   href: '/admin/credits/buy' },
  ],
  lecturer: [
    { label: 'Dashboard',  href: '/dashboard' },
    { label: 'Generate',   href: '/generate' },
    { label: 'My Drafts',  href: '/drafts' },
    { label: 'Syllabus',   href: '/syllabus' },
  ],
}

const ROLE_LABELS = {
  super_admin:   'Yuktra AI (Super Admin)',
  college_admin: 'College Admin',
  lecturer:      'Lecturer',
}

export function Sidebar({ role, name, creditBalance, onClose }) {
  const pathname = usePathname()
  const links    = NAV_LINKS[role] ?? NAV_LINKS.lecturer

  return (
    <aside className="w-64 shrink-0 bg-navy flex flex-col h-full">
      {/* Logo + optional mobile close button */}
      <div className="px-6 py-5 border-b border-navy-2 flex items-center justify-between">
        <div>
          <span className="font-heading text-xl font-bold text-white tracking-tight">
            EduDraftAI
          </span>
          <p className="text-xs text-slate-400 mt-0.5">by Yuktra AI</p>
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
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-lg bg-navy-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-slate-300">Credits</span>
          </div>
          <span className={`text-sm font-bold ${creditBalance > 0 ? 'text-teal' : 'text-error'}`}>
            {creditBalance}
          </span>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ label, href }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard' && href !== '/generate' && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal text-white shadow-sm'
                  : 'text-slate-300 hover:bg-navy-2 hover:text-white'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User info + sign out */}
      <div className="px-5 py-4 border-t border-navy-2">
        <p className="text-sm font-medium text-white truncate">{name}</p>
        <p className="text-xs text-slate-400 mt-0.5">{ROLE_LABELS[role] ?? role}</p>
        <SignOutButton />
      </div>
    </aside>
  )
}
