'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

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
