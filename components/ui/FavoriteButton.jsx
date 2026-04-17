'use client'

import { useState } from 'react'

export function FavoriteButton({ itemType, itemId, initialState = false, size = 'sm' }) {
  const [favorited, setFavorited] = useState(initialState)
  const [loading, setLoading]     = useState(false)

  async function toggle(e) {
    e.preventDefault()  // prevent Link navigation if button is inside a Link
    e.stopPropagation()
    if (loading) return

    // Optimistic update
    setFavorited((prev) => !prev)
    setLoading(true)

    try {
      const res = await fetch('/api/favorites', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ item_type: itemType, item_id: itemId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setFavorited(json.data.favorited)
    } catch {
      // Revert on failure
      setFavorited((prev) => !prev)
    } finally {
      setLoading(false)
    }
  }

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={favorited ? 'Remove from favourites' : 'Add to favourites'}
      className={`inline-flex items-center justify-center rounded-lg transition-colors p-1.5
        ${favorited
          ? 'text-teal bg-teal-light hover:bg-teal/20'
          : 'text-muted hover:text-teal hover:bg-teal-light'
        }
        ${loading ? 'opacity-50 cursor-wait' : ''}
      `}
    >
      <svg
        className={iconSize}
        viewBox="0 0 24 24"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    </button>
  )
}
