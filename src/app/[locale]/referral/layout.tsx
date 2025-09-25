import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PlanetTalk Referral',
  description: 'Join PlanetTalk with a referral code and start earning today!',
}

export default function ReferralLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
