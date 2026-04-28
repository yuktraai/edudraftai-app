import './globals.css'
import 'katex/dist/katex.min.css'

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
        {/* Phase 46: Dark mode flash prevention — runs before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
