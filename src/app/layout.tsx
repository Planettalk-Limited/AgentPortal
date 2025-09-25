import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PlanetTalk Agent Portal',
  description: 'Agent portal for PlanetTalk - High-quality, low cost calls worldwide',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
