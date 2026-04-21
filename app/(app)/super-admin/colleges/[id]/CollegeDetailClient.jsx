'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export function CollegeEditClient({ collegeId, currentName, currentAddress }) {
  const router = useRouter()
  const [name,    setName]    = useState(currentName ?? '')
  const [address, setAddress] = useState(currentAddress ?? '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true); setError(null); setSuccess(false)

    const res = await fetch(`/api/colleges/${collegeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), address: address.trim() || undefined }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setError(json.error ?? 'Failed to update'); return }
    setSuccess(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {error && <p className="text-error text-sm">{error}</p>}
      {success && <p className="text-success text-sm">College details updated.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">College Name *</label>
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text">Address</label>
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="City, District, Odisha"
            className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
          />
        </div>
      </div>
      <Button type="submit" loading={loading}>Save Changes</Button>
    </form>
  )
}

export function CollegeDetailClient({ collegeId, eligibleUsers }) {
  const router = useRouter()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleAssign() {
    if (!selectedUserId) return
    setLoading(true)
    setError(null)
    setSuccess(false)

    const res = await fetch(`/api/colleges/${collegeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ college_admin_id: selectedUserId }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error ?? 'Failed to assign college admin')
      return
    }

    setSuccess(true)
    setSelectedUserId('')
    router.refresh()
  }

  if (eligibleUsers.length === 0) {
    return (
      <p className="text-sm text-muted bg-bg border border-border rounded-lg px-4 py-3">
        No eligible users found. Invite lecturers to this college first, then assign one as admin.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-error text-sm">{error}</p>}
      {success && <p className="text-success text-sm">College admin assigned successfully.</p>}

      <div className="flex gap-3">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm
                     focus:outline-none focus:ring-2 focus:ring-teal"
        >
          <option value="">Select a lecturer…</option>
          {eligibleUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>

        <Button
          onClick={handleAssign}
          disabled={!selectedUserId}
          loading={loading}
        >
          Assign
        </Button>
      </div>
    </div>
  )
}

export function MemberRoleClient({ userId, currentRole, collegeId }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (currentRole === 'super_admin') return null

  async function handleRoleChange(newRole) {
    setLoading(true)
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    setLoading(false)
    router.refresh()
  }

  if (currentRole === 'college_admin') {
    return (
      <button
        onClick={() => handleRoleChange('lecturer')}
        disabled={loading}
        className="text-xs text-warning hover:text-amber-700 font-medium transition-colors disabled:opacity-50"
      >
        {loading ? '…' : 'Demote to Lecturer'}
      </button>
    )
  }

  if (currentRole === 'lecturer') {
    return (
      <button
        onClick={() => handleRoleChange('college_admin')}
        disabled={loading}
        className="text-xs text-teal hover:text-navy font-medium transition-colors disabled:opacity-50"
      >
        {loading ? '…' : 'Make Admin'}
      </button>
    )
  }

  return null
}

export function InviteLecturerClient({ collegeId }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleInvite(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true); setError(null); setSuccess(false)

    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), role: 'lecturer', college_id: collegeId }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setError(json.error ?? 'Invite failed'); return }
    setSuccess(true)
    setEmail('')
  }

  return (
    <form onSubmit={handleInvite} className="space-y-3">
      {error && <p className="text-error text-sm">{error}</p>}
      {success && <p className="text-success text-sm">Invitation sent! They can now sign in with a magic link.</p>}
      <div className="flex gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="lecturer@college.edu.in"
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg text-text text-sm focus:ring-2 focus:ring-teal focus:outline-none"
        />
        <Button type="submit" loading={loading} disabled={!email.trim()}>
          Invite
        </Button>
      </div>
    </form>
  )
}
