import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { AuthProvider } from '../../contexts/AuthContext'
import '../../styles/globals.css'

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
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.png', sizes: '192x192', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: ['/favicon.ico'],
    other: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
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

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'en';
  
  let messages;
  try {
    messages = await getMessages({ locale });
  } catch (error) {
    // Failed to load messages - fallback to English
    // Fallback to English messages
    messages = (await import(`../../i18n/messages/en.json`)).default;
  }

  return (
    <html lang={locale} className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#24B6C3" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={roboto.className}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
