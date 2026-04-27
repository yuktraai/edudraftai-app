'use client'

import { useEffect } from 'react'
import 'driver.js/dist/driver.css'

export function OnboardingTour({ userId }) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.innerWidth < 768) return

    let cancelled = false

    async function startTour() {
      try {
        // Dynamic import avoids SSR issues — driver.js needs DOM
        const { driver } = await import('driver.js')

        if (cancelled) return

        const allSteps = [
          {
            element: '#sidebar-credits',
            popover: {
              title: 'Your Credit Balance',
              description: 'Each AI generation uses 1 credit. Your balance is always visible here.',
              side: 'right', align: 'start',
            },
          },
          {
            element: '#nav-generate',
            popover: {
              title: 'Generate Content',
              description: 'Start here to create lesson notes, MCQ banks, question banks, test plans and exam papers — locked to your approved syllabus.',
              side: 'right', align: 'start',
            },
          },
          {
            element: '#nav-drafts',
            popover: {
              title: 'Your Saved Drafts',
              description: 'Every generated output is saved here automatically. Review, print, copy, or export them anytime.',
              side: 'right', align: 'start',
            },
          },
          {
            element: '#nav-syllabus',
            popover: {
              title: 'Your Syllabus',
              description: "Browse your college's approved syllabus topics. All generated content is locked to these topics only.",
              side: 'right', align: 'start',
            },
          },
        ]

        const steps = allSteps.filter(s => document.querySelector(s.element))
        if (steps.length === 0) return

        const driverObj = driver({
          showProgress: true,
          allowClose: true,
          steps,
          onDestroyStarted: async () => {
            try {
              await fetch('/api/users/onboarding-complete', { method: 'PATCH' })
            } catch (_) {}
            driverObj.destroy()
          },
          onDestroyed: () => {
            const toast = document.createElement('div')
            toast.textContent = "You're all set! Start generating content."
            toast.style.cssText = [
              'position:fixed', 'top:1.25rem', 'right:1.25rem', 'z-index:9999',
              'background:#00B4A6', 'color:white', 'font-size:14px', 'font-weight:600',
              'padding:12px 20px', 'border-radius:12px',
              'box-shadow:0 4px 20px rgba(0,0,0,.15)', 'font-family:Inter,sans-serif',
            ].join(';')
            document.body.appendChild(toast)
            setTimeout(() => toast?.remove(), 4000)
          },
        })

        driverObj.drive()
      } catch (err) {
        // Silently fail — tour is non-critical
      }
    }

    // Small delay to ensure sidebar elements are in the DOM
    const timer = setTimeout(startTour, 1000)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [userId])

  return null
}
