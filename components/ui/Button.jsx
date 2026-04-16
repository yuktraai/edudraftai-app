const VARIANTS = {
  primary:   'bg-teal hover:bg-teal-2 text-white',
  secondary: 'bg-bg hover:bg-border text-text border border-border',
  danger:    'bg-red-50 hover:bg-red-100 text-error border border-red-200',
  ghost:     'hover:bg-bg text-muted hover:text-text',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-lg
                  transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${VARIANTS[variant] ?? VARIANTS.primary}
                  ${SIZES[size] ?? SIZES.md}
                  ${className}`}
    >
      {loading && (
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
