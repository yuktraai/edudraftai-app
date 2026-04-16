'use client'

import { useEffect, useState } from 'react'

const LAUNCH_DATE = new Date('2026-07-07T00:00:00+05:30')

function calcTimeLeft() {
  const diff = LAUNCH_DATE - new Date()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

const UNITS = ['Days', 'Hours', 'Mins', 'Secs']

export function CountdownTimer() {
  // null = not yet mounted; avoids server/client mismatch
  const [time, setTime] = useState(null)

  useEffect(() => {
    // Set immediately on mount, then tick every second
    setTime(calcTimeLeft())
    const id = setInterval(() => setTime(calcTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  const values = time
    ? [time.days, time.hours, time.minutes, time.seconds]
    : [0, 0, 0, 0]

  return (
    <div className="counter-grid" aria-live="polite">
      {UNITS.map((label, i) => (
        <div key={label} className="counter-box">
          <strong suppressHydrationWarning>
            {String(values[i]).padStart(2, '0')}
          </strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}
