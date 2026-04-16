const VARIANTS = {
  success:      'bg-teal-light text-success',
  error:        'bg-red-50 text-error',
  warning:      'bg-orange-50 text-warning',
  info:         'bg-blue-50 text-blue-700',
  navy:         'bg-navy text-white',
  muted:        'bg-bg text-muted border border-border',
  lecturer:     'bg-blue-50 text-blue-700',
  college_admin:'bg-purple-50 text-purple-700',
  super_admin:  'bg-navy text-white',
}

export function Badge({ children, variant = 'muted' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${VARIANTS[variant] ?? VARIANTS.muted}`}>
      {children}
    </span>
  )
}

export function RoleBadge({ role }) {
  const labels = {
    super_admin:   'Super Admin',
    college_admin: 'College Admin',
    lecturer:      'Lecturer',
  }
  return <Badge variant={role}>{labels[role] ?? role}</Badge>
}

export function StatusBadge({ active }) {
  return (
    <Badge variant={active ? 'success' : 'error'}>
      {active ? 'Active' : 'Inactive'}
    </Badge>
  )
}
