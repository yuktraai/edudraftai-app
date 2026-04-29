import { ImageResponse } from 'next/og'

export const size        = { width: 32, height: 32 }
export const contentType = 'image/png'

// Generates the browser tab favicon — navy square with teal "E" mark
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          32,
          height:         32,
          background:     '#0D1F3C',
          borderRadius:   8,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexDirection:  'column',
          gap:            0,
        }}
      >
        {/* Teal top bar */}
        <div style={{ width: 18, height: 3, background: '#00B4A6', borderRadius: 2, marginBottom: 3 }} />
        {/* "E" letter built from bars */}
        <div style={{ width: 18, height: 2, background: '#FFFFFF', borderRadius: 1, marginBottom: 2 }} />
        <div style={{ width: 14, height: 2, background: '#00B4A6', borderRadius: 1, marginBottom: 2 }} />
        <div style={{ width: 18, height: 2, background: '#FFFFFF', borderRadius: 1 }} />
      </div>
    ),
    { ...size }
  )
}
