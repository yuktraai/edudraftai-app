'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export function UsersClient({ userId, isActive, role }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggleActive() {
    setLoading(true)
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    setLoading(false)
    router.refresh()
  }

  if (role === 'college_admin') return <span className="text-xs text-muted">—</span>

  return (
    <Button
      variant={isActive ? 'danger' : 'secondary'}
      size="sm"
      loading={loading}
      onClick={toggleActive}
    >
      {isActive ? 'Deactivate' : 'Reactivate'}
    </Button>
  )
}
