/**
 * Skeleton — animated loading placeholder
 *
 * Usage:
 *   <Skeleton className="h-8 w-48" />
 *   <Skeleton.Card />
 *   <Skeleton.Table rows={5} />
 *   <Skeleton.Page />
 */
export function Skeleton({ className = '' }) {
  return (
    <div className={`bg-border rounded animate-pulse ${className}`} />
  )
}

// Pre-built card skeleton
Skeleton.Card = function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-3 w-48" />
    </div>
  )
}

// Pre-built table skeleton
Skeleton.Table = function SkeletonTable({ rows = 5 }) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-3.5 flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Full page skeleton for dashboard-type pages
Skeleton.Page = function SkeletonPage() {
  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton.Card key={i} />)}
      </div>
      <Skeleton.Table rows={5} />
    </div>
  )
}
