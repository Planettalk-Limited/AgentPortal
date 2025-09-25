import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import '../styles/globals.css'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | PlanetTalk Agent Portal',
    default: 'PlanetTalk Agent Portal - Join Our Global Telecommunications Network',
  },
  description: 'Join PlanetTalk\'s global telecommunications network. Earn commissions by sharing your unique agent code and helping customers with top-ups worldwide.',
  keywords: ['PlanetTalk', 'Agent', 'Portal', 'Telecommunications', 'International Calls'],
  authors: [{ name: 'PlanetTalk Limited' }],
  creator: 'PlanetTalk Limited',
  publisher: 'PlanetTalk Limited',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://agent.planettalk.com'),
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico'
  },
  openGraph: {
    title: 'PlanetTalk Agent Portal - Join Our Global Network',
    description: 'Join PlanetTalk\'s global telecommunications network. Earn commissions by sharing your unique agent code and helping customers with top-ups worldwide.',
    url: 'https://agent.planettalk.com',
    siteName: 'PlanetTalk Agent Portal',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlanetTalk Agent Portal - Join Our Global Network',
    description: 'Join PlanetTalk\'s global telecommunications network. Earn commissions by sharing your unique agent code and helping customers with top-ups worldwide.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-site-verification',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#24B6C3" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={roboto.className}>
        {children}
      </body>
    </html>
  )
}
