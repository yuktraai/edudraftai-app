'use client'

import { useEffect } from 'react'

export function OnboardingTour({ userId }) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.innerWidth < 768) return  // skip on mobile

    const startTour = () => {
      // driver.js CDN exposes window.driver.js.driver()
      const factory = window?.driver?.js?.driver
      if (!factory) return

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
            description: 'Start here to create lesson notes, MCQ banks, question banks, and test plans — locked to your approved syllabus.',
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

      // Only include steps whose element exists in the DOM
      const steps = allSteps.filter(s => document.querySelector(s.element))
      if (steps.length === 0) return

      const driverObj = factory({
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
          // Show a brief "You're ready!" toast
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
    }

    // Wait for driver.js script to load + DOM to settle
    const timer = setTimeout(startTour, 1000)
    return () => clearTimeout(timer)
  }, [userId])

  return null
}
