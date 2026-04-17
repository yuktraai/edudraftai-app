import Image from 'next/image'

const SIZES = { sm: 32, md: 56, lg: 80 }

export function CollegeLogo({ logoUrl, collegeName, size = 'md' }) {
  const px      = SIZES[size] ?? SIZES.md
  const initials = (collegeName ?? 'C')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  if (logoUrl) {
    return (
      <div
        className="rounded-xl overflow-hidden shrink-0 bg-bg border border-border"
        style={{ width: px, height: px }}
      >
        <Image
          src={logoUrl}
          alt={`${collegeName} logo`}
          width={px}
          height={px}
          className="object-contain w-full h-full"
          unoptimized
        />
      </div>
    )
  }

  // Initials fallback
  const fontSize = px <= 32 ? 'text-xs' : px <= 56 ? 'text-sm' : 'text-base'

  return (
    <div
      className={`rounded-xl shrink-0 bg-navy flex items-center justify-center ${fontSize} font-bold text-teal`}
      style={{ width: px, height: px }}
    >
      {initials}
    </div>
  )
}
