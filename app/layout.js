import './globals.css'
import 'katex/dist/katex.min.css'
import Script from 'next/script'

export const metadata = {
  title:       'EduDraftAI — AI Teaching Content for SCTEVT Colleges',
  description: 'Generate syllabus-locked lesson notes, MCQ banks, question banks and test papers for SCTEVT diploma engineering colleges. By Yuktra AI.',
  metadataBase: new URL('https://edudraftai.com'),
  openGraph: {
    title:       'EduDraftAI',
    description: 'AI-powered teaching content for SCTEVT diploma colleges',
    url:         'https://edudraftai.com',
    siteName:    'EduDraftAI',
    locale:      'en_IN',
    type:        'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/driver.js/1.3.1/driver.min.css"
        />
      </head>
      <body className="antialiased">
        {children}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/driver.js/1.3.1/driver.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
