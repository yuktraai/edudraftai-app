import { ImageResponse } from 'next/og'

export const alt         = 'EduDraftAI — AI Teaching Content for SCTE & VT Diploma Colleges'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

// @vercel/og rule: every element with multiple children MUST have display:flex
export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          1200,
          height:         630,
          background:     '#0D1F3C',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'flex-start',
          justifyContent: 'center',
          padding:        '80px 96px',
          fontFamily:     'sans-serif',
        }}
      >
        {/* Teal accent stripe */}
        <div style={{ width: 80, height: 6, background: '#00B4A6', borderRadius: 3, marginBottom: 36 }} />

        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          {/* Logo square */}
          <div style={{
            width: 64, height: 64, background: '#00B4A6', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#0D1F3C' }}>E</div>
          </div>
          {/* Brand name — split into two sibling divs to avoid text+span mixed children */}
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-1px' }}>EduDraft</div>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#00B4A6', letterSpacing: '-1px' }}>AI</div>
          </div>
        </div>

        {/* Headline — single text child, no flex needed */}
        <div style={{ fontSize: 52, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 24, maxWidth: 900 }}>
          AI-Powered Teaching Content for SCTE & VT Diploma Colleges
        </div>

        {/* Sub-headline — single text child, avoid HTML entities */}
        <div style={{ fontSize: 28, color: '#94A3B8', lineHeight: 1.5, maxWidth: 800 }}>
          Generate syllabus-locked lesson notes, MCQ banks, question papers and test plans — instantly.
        </div>

        {/* Bottom tag — flex row to avoid text+entity mixed children */}
        <div style={{ position: 'absolute', bottom: 60, right: 96, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 18, color: '#475569' }}>by Yuktra AI</div>
          <div style={{ fontSize: 18, color: '#334155' }}>·</div>
          <div style={{ fontSize: 18, color: '#475569' }}>edudraftai.com</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
