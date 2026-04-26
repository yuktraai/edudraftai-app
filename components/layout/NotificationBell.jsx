'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1)  return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24)   return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationBell() {
  const router = useRouter()
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loadingList, setLoadingList] = useState(false)
  const [fetched, setFetched] = useState(false)
  const dropdownRef = useRef(null)

  // ── Poll unread count every 60 s ─────────────────────────────────────────
  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/count')
      if (!res.ok) return
      const data = await res.json()
      setCount(data.count ?? 0)
    } catch {
      // Non-fatal — silently ignore network errors
    }
  }, [])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 60_000)
    return () => clearInterval(interval)
  }, [fetchCount])

  // ── Fetch full list on first open ─────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setFetched(true)
    } catch {
      // Non-fatal
    } finally {
      setLoadingList(false)
    }
  }, [])

  function handleToggle() {
    const next = !open
    setOpen(next)
    if (next && !fetched) fetchList()
  }

  // ── Mark all read ─────────────────────────────────────────────────────────
  async function handleMarkAllRead() {
    try {
      await fetch('/api/notifications', { method: 'PATCH' })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setCount(0)
    } catch {
      // Non-fatal
    }
  }

  // ── Mark single read + navigate ───────────────────────────────────────────
  async function handleNotificationClick(notification) {
    if (!notification.is_read) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, { method: 'PATCH' })
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
        setCount(prev => Math.max(0, prev - 1))
      } catch {
        // Non-fatal
      }
    }
    setOpen(false)
    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  // ── Close on click outside ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    function handleOutsideClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  const displayCount = count > 9 ? '9+' : String(count)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-muted hover:text-text hover:bg-bg transition-colors"
        aria-label={count > 0 ? `${count} unread notifications` : 'Notifications'}
      >
        {/* Bell SVG */}
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {/* Unread badge */}
        {count > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {displayCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          {/* Dropdown header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-text">Notifications</span>
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-teal hover:text-teal-2 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {loadingList && (
              <div className="py-8 text-center">
                <span className="text-xs text-muted">Loading…</span>
              </div>
            )}

            {!loadingList && notifications.length === 0 && (
              <div className="py-10 text-center">
                <svg className="w-8 h-8 text-border mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <p className="text-xs text-muted">No notifications yet</p>
              </div>
            )}

            {!loadingList && notifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left px-4 py-3 transition-colors hover:bg-bg ${
                  !notification.is_read
                    ? 'bg-teal/5 border-l-2 border-teal'
                    : 'bg-surface'
                }`}
              >
                <p className="text-sm font-medium text-text truncate">{notification.title}</p>
                <p className="text-xs text-muted mt-0.5 line-clamp-2">{notification.message}</p>
                <p className="text-xs text-muted mt-1">{timeAgo(notification.created_at)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
