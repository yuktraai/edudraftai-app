'use client'

import { useState } from 'react'

/**
 * CopyButton — copies text to clipboard with fallback for Android.
 * Props:
 *   content  {string}  — text to copy
 *   label    {string}  — button label (default: 'Copy')
 *   className {string} — extra classes for the button
 */
export function CopyButton({ content, label = 'Copy', className = '' }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      // Primary: Clipboard API
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(content)
      } else {
        // Fallback: execCommand for older Android browsers
        const ta = document.createElement('textarea')
        ta.value = content
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (_) {
      // Silent fail — clipboard not available
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
        copied
          ? 'text-success border-success bg-green-50'
          : 'text-muted border-border hover:border-teal hover:text-teal'
      } ${className}`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
          </svg>
          {label}
        </>
      )}
    </button>
  )
}
