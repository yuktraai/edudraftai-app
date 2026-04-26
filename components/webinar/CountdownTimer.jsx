'use client'
import { useState, useEffect } from 'react'

export function CountdownTimer({ eventDateIST }) {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    function calc() {
      const diff = new Date(eventDateIST) - new Date()
      if (diff <= 0) return setTimeLeft(null)
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ d, h, m, s })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [eventDateIST])

  if (!timeLeft) return (
    <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-semibold">
      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      Live now — join below
    </div>
  )

  return (
    <div className="flex items-center gap-3">
      {[
        { label: 'Days', val: timeLeft.d },
        { label: 'Hrs',  val: timeLeft.h },
        { label: 'Min',  val: timeLeft.m },
        { label: 'Sec',  val: timeLeft.s },
      ].map(({ label, val }) => (
        <div key={label} className="text-center">
          <div className="bg-navy text-white rounded-xl px-4 py-3 min-w-[56px] text-2xl font-bold font-heading tabular-nums">
            {String(val).padStart(2, '0')}
          </div>
          <div className="text-xs text-muted mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}
