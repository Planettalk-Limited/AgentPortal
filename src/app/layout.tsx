import type { Metadata } from 'next'
import Script from 'next/script'
import { Roboto } from 'next/font/google'
import '../styles/globals.css'

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | PlanetTalk Partner Portal',
    default: 'PlanetTalk Partner Portal - Join Our Global Telecommunications Network',
  },
  description: 'Join PlanetTalk\'s global telecommunications network. Earn commissions by sharing your unique partner code and helping customers with top-ups worldwide.',
  keywords: 'PlanetTalk, Partner, Portal, Telecommunications, International Calls',
  authors: { name: 'PlanetTalk Limited' },
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
  other: {
    'theme-color': '#24B6C3',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'PlanetTalk Partner Portal - Join Our Global Network',
    description: 'Join PlanetTalk\'s global telecommunications network. Earn commissions by sharing your unique partner code and helping customers with top-ups worldwide.',
    url: 'https://agent.planettalk.com',
    siteName: 'PlanetTalk Partner Portal',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlanetTalk Partner Portal - Join Our Global Network',
    description: 'Join PlanetTalk\'s global telecommunications network. Earn commissions by sharing your unique partner code and helping customers with top-ups worldwide.',
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
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={roboto.className}>
        {children}
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2HJ71HGZT6"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2HJ71HGZT6');
          `}
        </Script>
        {/* Microsoft Clarity — heatmaps & session recordings */}
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xlu3x4klf5");
          `}
        </Script>
      </body>
    </html>
  )
}
