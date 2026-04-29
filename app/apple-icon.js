import { ImageResponse } from 'next/og'

export const size        = { width: 180, height: 180 }
export const contentType = 'image/png'

// Apple touch icon (home screen icon on iOS)
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          180,
          height:         180,
          background:     '#0D1F3C',
          borderRadius:   40,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexDirection:  'column',
          gap:            0,
        }}
      >
        {/* Brand wordmark "Ed" */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          {/* Top teal accent bar */}
          <div style={{ width: 100, height: 10, background: '#00B4A6', borderRadius: 5 }} />
          {/* E bar 1 */}
          <div style={{ width: 100, height: 8, background: '#FFFFFF', borderRadius: 4 }} />
          {/* E bar 2 (shorter — middle bar of E) */}
          <div style={{ width: 72, height: 8, background: '#00B4A6', borderRadius: 4 }} />
          {/* E bar 3 */}
          <div style={{ width: 100, height: 8, background: '#FFFFFF', borderRadius: 4 }} />
          {/* Bottom teal accent */}
          <div style={{ width: 100, height: 10, background: '#00B4A6', borderRadius: 5 }} />
        </div>
      </div>
    ),
    { ...size }
  )
}
