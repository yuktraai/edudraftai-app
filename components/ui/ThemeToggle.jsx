'use client'

import { useState, useEffect } from 'react'

export function ThemeToggle({ className = '' }) {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Read persisted preference on mount
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'dark') {
        setDark(true)
        document.documentElement.setAttribute('data-theme', 'dark')
      }
    } catch {}
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    try {
      if (next) {
        document.documentElement.setAttribute('data-theme', 'dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.removeAttribute('data-theme')
        localStorage.setItem('theme', 'light')
      }
    } catch {}
  }

  // Avoid hydration mismatch
  if (!mounted) return null

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
        dark ? 'bg-teal' : 'bg-border'
      } ${className}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-transform flex items-center justify-center ${
          dark ? 'translate-x-5 bg-navy' : 'translate-x-0 bg-white'
        }`}
      >
        {dark ? (
          /* Moon icon */
          <svg className="w-3 h-3 text-teal" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          /* Sun icon */
          <svg className="w-3 h-3 text-warning" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
          </svg>
        )}
      </span>
    </button>
  )
}
