import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Footer from '@/components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Join PlanetTalk\'s global telecommunications network. Earn commissions by sharing your unique agent code and helping customers with top-ups worldwide.',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <Footer />
    </main>
  )
}
