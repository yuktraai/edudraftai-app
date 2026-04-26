'use client'

import { useState } from 'react'

const NOTIFICATION_ROWS = [
  {
    key:         'credit_allocated',
    label:       'Credit Allocated',
    description: 'When an admin adds credits to your account',
  },
  {
    key:         'credit_low',
    label:       'Low Credit Balance',
    description: 'When you have 5 or fewer credits remaining',
  },
  {
    key:         'generation_failed',
    label:       'Generation Failed',
    description: 'When a content generation attempt fails',
  },
]

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-1 shrink-0 ${
        enabled ? 'bg-teal' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block w-4 h-4 mt-1 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
          enabled ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export function NotificationPreferences({ initialPreferences }) {
  const prefs = initialPreferences ?? {}
  const notifDefaults = prefs.email_notifications ?? {}

  const [values, setValues] = useState({
    credit_allocated:  notifDefaults.credit_allocated  ?? true,
    credit_low:        notifDefaults.credit_low        ?? true,
    generation_failed: notifDefaults.generation_failed ?? true,
  })
  const [saving, setSaving]   = useState(false)
  const [status, setStatus]   = useState(null) // 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  function toggle(key) {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSave() {
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch('/api/users/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            email_notifications: values,
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrorMsg(json.error ?? 'Save failed')
      } else {
        setStatus('success')
        setTimeout(() => setStatus(null), 2000)
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-text">Email Notifications</h2>
        <p className="text-xs text-muted mt-0.5">Choose which events trigger an email to you</p>
      </div>

      <div className="divide-y divide-border">
        {NOTIFICATION_ROWS.map((row) => (
          <div key={row.key} className="flex items-center justify-between py-3.5 gap-4">
            <div>
              <p className="text-sm font-medium text-text">{row.label}</p>
              <p className="text-xs text-muted mt-0.5">{row.description}</p>
            </div>
            <Toggle enabled={values[row.key]} onChange={() => toggle(row.key)} />
          </div>
        ))}
      </div>

      {/* Save button + feedback */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-teal text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Preferences'}
        </button>
        {status === 'success' && (
          <span className="text-sm font-medium text-success">Saved!</span>
        )}
        {status === 'error' && (
          <span className="text-sm text-error">{errorMsg}</span>
        )}
      </div>
    </div>
  )
}
