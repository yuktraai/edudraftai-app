import Link from 'next/link'

export function WelcomeHeader({ name, creditsLeft, weekCount }) {
  const firstName = name?.split(' ')[0] ?? 'Lecturer'

  let subtitle, subtitleColor
  if (creditsLeft <= 0) {
    subtitle      = 'You have no credits left. Contact your admin to top up.'
    subtitleColor = 'text-error'
  } else if (creditsLeft <= 10) {
    subtitle      = `You have ${creditsLeft} credit${creditsLeft !== 1 ? 's' : ''} left. Top up to keep generating.`
    subtitleColor = 'text-warning'
  } else if (weekCount === 0) {
    subtitle      = "You haven't generated anything this week."
    subtitleColor = 'text-muted'
  } else {
    subtitle      = `You've generated ${weekCount} item${weekCount !== 1 ? 's' : ''} this week. Keep going.`
    subtitleColor = 'text-muted'
  }

  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="font-heading text-2xl font-bold text-navy">
          Welcome back, {firstName}
        </h1>
        <p className={`text-sm mt-1 ${subtitleColor}`}>
          {subtitle}
          {weekCount === 0 && creditsLeft > 10 && (
            <Link href="/generate" className="ml-1.5 text-teal font-medium hover:underline">
              Start now →
            </Link>
          )}
        </p>
      </div>
      <Link
        href="/generate"
        className="flex items-center gap-2 bg-teal hover:bg-teal-2 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        style={{ boxShadow: '0 2px 8px rgba(0,180,166,0.3)' }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Generate Content
      </Link>
    </div>
  )
}
