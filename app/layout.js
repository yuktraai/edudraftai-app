import './globals.css'
import 'katex/dist/katex.min.css'

const APP_URL = 'https://edudraftai.com'

export const metadata = {
  metadataBase: new URL(APP_URL),

  // ── Core ─────────────────────────────────────────────────────────────────────
  title: {
    default:  'EduDraftAI — AI Teaching Content for SCTE & VT Diploma Colleges',
    template: '%s | EduDraftAI',
  },
  description:
    'EduDraftAI helps SCTE & VT Odisha diploma college lecturers generate syllabus-locked lesson notes, MCQ banks, question banks and internal test papers using AI — in seconds. By Yuktra AI.',

  keywords: [
    'SCTE & VT lesson notes', 'diploma college AI', 'question bank generator',
    'MCQ generator India', 'SCTE & VT question paper', 'teaching content generator',
    'AI for lecturers', 'diploma engineering notes', 'Odisha polytechnic',
    'lesson plan generator', 'internal test paper generator', 'EduDraftAI',
    'Yuktra AI', 'syllabus-based question bank', 'SCTE & VT Odisha',
  ],

  authors:   [{ name: 'Yuktra AI', url: APP_URL }],
  creator:   'Yuktra AI',
  publisher: 'Yuktra AI',

  // ── Robots ───────────────────────────────────────────────────────────────────
  robots: {
    index:     true,
    follow:    true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  // ── Open Graph ───────────────────────────────────────────────────────────────
  openGraph: {
    title:       'EduDraftAI — AI Teaching Content for SCTE & VT Diploma Colleges',
    description: 'Generate syllabus-locked lesson notes, MCQ banks, question banks and test papers for SCTE & VT diploma engineering colleges. Instant. Accurate. By Yuktra AI.',
    url:         APP_URL,
    siteName:    'EduDraftAI',
    locale:      'en_IN',
    type:        'website',
    images: [{
      url:    '/opengraph-image',
      width:  1200,
      height: 630,
      alt:    'EduDraftAI — AI Teaching Content for SCTE & VT Diploma Colleges',
    }],
  },

  // ── Twitter / X Card ─────────────────────────────────────────────────────────
  twitter: {
    card:        'summary_large_image',
    title:       'EduDraftAI — AI Teaching Content for SCTE & VT Diploma Colleges',
    description: 'Generate syllabus-locked lesson notes, MCQ banks, question banks and test papers instantly. For SCTE & VT Odisha diploma colleges.',
    images:      ['/opengraph-image'],
    creator:     '@yuktraai',
    site:        '@yuktraai',
  },

  // ── Verification (paste your Google Search Console token below when ready) ────
  // verification: { google: 'PASTE_TOKEN_HERE' },

  // ── Canonical ────────────────────────────────────────────────────────────────
  alternates: {
    canonical: APP_URL,
    languages: { 'en-IN': APP_URL },
  },

  applicationName: 'EduDraftAI',
  category:        'Education',

  // ── Icons — Next.js auto-serves app/icon.js + app/apple-icon.js ──────────────
  icons: {
    icon:    [{ url: '/icon',       type: 'image/png', sizes: '32x32'   }],
    apple:   [{ url: '/apple-icon', type: 'image/png', sizes: '180x180' }],
    shortcut: '/icon',
  },
}

// ── JSON-LD Structured Data ───────────────────────────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type':             'SoftwareApplication',
      '@id':               `${APP_URL}/#software`,
      name:                'EduDraftAI',
      url:                 APP_URL,
      description:         'AI-powered teaching content generator for SCTE & VT Odisha diploma engineering colleges. Generates lesson notes, MCQ banks, question banks and internal test papers from the official curriculum.',
      applicationCategory: 'EducationalApplication',
      operatingSystem:     'Web',
      inLanguage:          'en-IN',
      offers: {
        '@type':       'Offer',
        price:         '0',
        priceCurrency: 'INR',
        description:   'Free trial credits; paid plans via Razorpay',
      },
      publisher: {
        '@type': 'Organization',
        '@id':   `${APP_URL}/#org`,
        name:    'Yuktra AI',
        url:     APP_URL,
        logo: {
          '@type':  'ImageObject',
          url:      `${APP_URL}/logo.png`,
          width:    789,
          height:   789,
        },
        contactPoint: {
          '@type':           'ContactPoint',
          email:             'info@yuktraai.com',
          contactType:       'customer support',
          areaServed:        'IN',
          availableLanguage: ['English', 'Odia'],
        },
      },
      screenshot:  `${APP_URL}/opengraph-image`,
      featureList: [
        'Syllabus-locked lesson note generation',
        'MCQ bank generator with answer keys',
        'SCTE & VT-pattern question bank (2/5/10 mark)',
        'Internal test paper generator',
        'Multi-department, multi-semester support',
        'Export to Word / Print-ready format',
      ],
    },
    {
      '@type':       'WebSite',
      '@id':         `${APP_URL}/#website`,
      url:           APP_URL,
      name:          'EduDraftAI',
      description:   'AI teaching content platform for SCTE & VT diploma colleges in Odisha',
      publisher:     { '@id': `${APP_URL}/#org` },
      inLanguage:    'en-IN',
    },
    {
      '@type':      'FAQPage',
      '@id':        `${APP_URL}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name:    'What is EduDraftAI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:    'EduDraftAI is an AI-powered platform for SCTE & VT Odisha diploma college lecturers that generates syllabus-locked lesson notes, MCQ banks, question banks and internal test papers in seconds.',
          },
        },
        {
          '@type': 'Question',
          name:    'Is EduDraftAI free to use?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:    'New users get 3 free demo credits. After that, credits are allocated by your college admin or purchased individually through the platform.',
          },
        },
        {
          '@type': 'Question',
          name:    'Which colleges can use EduDraftAI?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:    'EduDraftAI is built specifically for SCTE & VT Odisha diploma engineering colleges and is aligned to the official SCTE & VT curriculum.',
          },
        },
        {
          '@type': 'Question',
          name:    'What content types can EduDraftAI generate?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:    'EduDraftAI generates lesson notes (theory + key points), MCQ banks with answer keys, question banks in SCTE & VT 2/5/10 mark format, and internal test papers with mark distribution.',
          },
        },
      ],
    },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Dark mode flash prevention — runs before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}})()`,
          }}
        />
        {/* JSON-LD Structured Data for Google rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
