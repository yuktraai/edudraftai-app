import { RazorpayButton } from './RazorpayButton'

function formatPrice(paise) {
  return '₹' + (paise / 100).toLocaleString('en-IN')
}

function formatPerCredit(paise, credits) {
  return '₹' + (paise / 100 / credits).toFixed(2)
}

/**
 * PackageCard
 * Props:
 *   pkg        — { id, name, credits, price_paise, sort_order }
 *   onSuccess  — callback({ credits_added }) after successful payment
 */
export function PackageCard({ pkg, onSuccess }) {
  const isPopular = pkg.sort_order === 3  // Growth = Most Popular

  return (
    <div className={`relative flex flex-col bg-surface border-2 rounded-2xl p-6 transition-all ${
      isPopular ? 'border-teal shadow-lg' : 'border-border hover:border-teal/50'
    }`}>
      {/* Most Popular badge */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-teal text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            Most Popular
          </span>
        </div>
      )}

      {/* Package name */}
      <div className="mb-4">
        <h3 className="font-heading text-lg font-bold text-navy">{pkg.name}</h3>
        <p className="text-xs text-muted mt-0.5">{formatPerCredit(pkg.price_paise, pkg.credits)} per credit</p>
      </div>

      {/* Credits */}
      <div className="mb-4">
        <div className="flex items-end gap-1.5">
          <span className="text-4xl font-bold text-navy">{pkg.credits}</span>
          <span className="text-muted text-sm mb-1">credits</span>
        </div>
        <p className="text-xs text-muted mt-1">
          Each generation costs 1 credit
        </p>
      </div>

      {/* Price */}
      <div className="mb-6 pb-6 border-b border-border">
        <span className="text-2xl font-bold text-text">{formatPrice(pkg.price_paise)}</span>
        <span className="text-muted text-sm ml-1">one-time</span>
      </div>

      {/* What you get */}
      <ul className="space-y-2 mb-6 flex-1">
        {[
          `${pkg.credits} AI generations`,
          'Lesson Notes, MCQs, Question Banks',
          'Internal Test Papers',
          'PDF & text export',
          'No expiry',
        ].map((item) => (
          <li key={item} className="flex items-center gap-2 text-sm text-text">
            <svg className="w-4 h-4 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {item}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <RazorpayButton pkg={pkg} onSuccess={onSuccess} isPopular={isPopular} />
    </div>
  )
}
