'use client'

import type { Metadata } from 'next'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import PlanetTalkLogo from '@/components/PlanetTalkLogo'
import LanguageSelectorAuth from '@/components/LanguageSelectorAuth'
import AnimatedStats from '@/components/AnimatedStats'

// SlideCarousel Component
function SlideCarousel({ content }: { content: any }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const slides = 3

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides)
    }, 8000)
    
    return () => clearInterval(interval)
  }, [slides])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides)
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides - 1 : prev - 1))

  return (
    <div className="text-white max-w-2xl mx-auto">
      {/* Slide Indicators */}
      <div className="flex justify-center mb-8 space-x-3">
        {Array.from({ length: slides }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full border-2 border-white/30 transition-all duration-300 ${
              currentSlide === index 
                ? 'bg-white shadow-lg scale-125' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Slide Content */}
      <div className="relative overflow-hidden">
        {/* Slide 1: Agent Program Overview */}
        <div className={`transition-all duration-500 ease-in-out ${
          currentSlide === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 absolute inset-0'
        } text-center`}>
          <div className="mb-6">
            <img 
              src={content.image} 
              alt="Global Network" 
              className="w-full max-w-xs mx-auto opacity-90"
            />
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold mb-4 text-white drop-shadow-lg">
            {content.title}
          </h2>
          <p className="text-lg xl:text-xl text-white leading-relaxed mb-8">
            {content.subtitle}
          </p>
          
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold text-yellow-300 drop-shadow-lg">24</div>
              <div className="text-white text-sm font-medium">Month Program</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-3xl font-bold text-green-300 drop-shadow-lg">45+</div>
              <div className="text-white text-sm font-medium">Countries</div>
            </div>
          </div>
        </div>

        {/* Slide 2: Features & Benefits */}
        <div className={`transition-all duration-500 ease-in-out ${
          currentSlide === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 absolute inset-0'
        } text-center`}>
          <h2 className="text-3xl xl:text-4xl font-bold mb-8 text-white drop-shadow-lg">
            Agent Benefits
          </h2>
          
          {/* Features Grid */}
          {content.features && (
            <div className="grid gap-4">
              {content.features.map((feature: string, index: number) => {
                const gradients = [
                  'from-purple-500 via-pink-500 to-red-500',
                  'from-blue-500 via-purple-500 to-pink-500', 
                  'from-green-500 via-teal-500 to-blue-500',
                  'from-yellow-500 via-orange-500 to-red-500'
                ];
                const iconColors = ['text-white', 'text-white', 'text-white', 'text-white'];
                
                return (
                  <div key={index} className={`group relative overflow-hidden flex items-center p-4 bg-gradient-to-r ${gradients[index % gradients.length]} backdrop-blur-sm rounded-xl border border-white/30 hover:scale-105 hover:shadow-2xl transition-all duration-500 transform`}>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 bg-white/20 rounded-bl-full opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 bg-white/15 rounded-tr-full opacity-30"></div>
                    
                    <div className={`relative w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 flex-shrink-0 group-hover:rotate-12 transition-transform duration-300`}>
                      <svg className={`w-6 h-6 ${iconColors[index % iconColors.length]} group-hover:scale-110 transition-transform duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="relative text-white font-semibold text-lg group-hover:text-white transition-colors duration-300">{feature}</span>
                    
                    <div className="absolute top-1 right-2 w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
                    <div className="absolute bottom-2 right-4 w-1.5 h-1.5 bg-white/40 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Slide 3: Call to Action */}
        <div className={`transition-all duration-500 ease-in-out ${
          currentSlide === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 absolute inset-0'
        } text-center`}>
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 backdrop-blur-md rounded-3xl p-8 border-2 border-white/30 shadow-2xl transform hover:scale-105 transition-all duration-500 group">
            {/* Animated background elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-y-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            {/* Floating orbs */}
            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-70 animate-bounce"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-60 animate-pulse"></div>
            <div className="absolute top-1/2 right-8 w-4 h-4 bg-gradient-to-r from-pink-400 to-red-500 rounded-full opacity-80 animate-ping"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl xl:text-3xl font-bold mb-4 text-white drop-shadow-lg">
                Ready to Start Earning?
              </h3>
              <p className="text-white/90 mb-6 text-lg leading-relaxed">
                Join thousands of successful agents worldwide and start your telecommunications business today.
              </p>
              
              {/* Enhanced status indicators */}
              <div className="flex items-center justify-center space-x-4 text-base mb-6">
                <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mr-3 animate-pulse shadow-lg"></div>
                  <span className="font-semibold">24/7 Support</span>
                </div>
                <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full mr-3 animate-pulse shadow-lg" style={{animationDelay: '0.5s'}}></div>
                  <span className="font-semibold">Global Network</span>
                </div>
              </div>

              {/* Success testimonial */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <p className="text-white/90 italic mb-2">"I've earned over $5,000 in my first 6 months as a PlanetTalk agent!"</p>
                <p className="text-white/70 text-sm">- Sarah M., London Agent</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={prevSlide}
          className="p-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 hover:bg-white/30 transition-all duration-300 group"
        >
          <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-white/60 text-sm font-medium">
          {currentSlide + 1} / {slides}
        </div>
        
        <button 
          onClick={nextSlide}
          className="p-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 hover:bg-white/30 transition-all duration-300 group"
        >
          <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = useLocale()
  const pathname = usePathname()

  // Determine content based on current page
  const getPageContent = () => {
    if (pathname.includes('/login')) {
      return {
        title: "Agent Portal",
        subtitle: "Access your dashboard and continue earning with PlanetTalk's Agent Program. Join thousands of successful agents worldwide.",
        image: "/images/world-map.png",
        gradient: "from-pt-turquoise via-pt-turquoise to-pt-turquoise-600",
        showStats: false,
        features: [
          "24-month commission program",
          "Global telecommunication network",
          "Real-time earnings tracking",
          "Dedicated agent support"
        ]
      }
    }
    
    if (pathname.includes('/apply')) {
      return {
        title: "Join Our Network",
        subtitle: "Become part of a global community of successful telecommunications agents. Start your journey today.",
        image: "/images/world-map.png",
        gradient: "from-pt-turquoise via-pt-turquoise-600 to-teal-600",
        showStats: false,
        features: [
          "Global reach in 45+ countries",
          "Comprehensive training program",
          "24/7 dedicated support",
          "Competitive commission rates"
        ],
        fullWidth: true
      }
    }
    
    if (pathname.includes('/forgot-password') || pathname.includes('/reset-password')) {
      return {
        title: "Secure & Trusted",
        subtitle: "Your account security is our priority. We use industry-standard encryption to protect your data.",
        image: "/images/world-map.png",
        gradient: "from-pt-turquoise via-pt-turquoise to-pt-turquoise-600",
        showStats: false,
        features: [
          "Bank-level security",
          "Encrypted data transmission", 
          "Regular security audits",
          "GDPR compliant"
        ]
      }
    }

    // Default fallback
    return {
      title: "PlanetTalk Agent Portal",
      subtitle: "Your gateway to global telecommunications success.",
      image: "/images/world-map.png",
      gradient: "from-pt-turquoise via-pt-turquoise to-pt-turquoise-600",
      showStats: true
    }
  }

  const content = getPageContent()

  // Force full-width layout for register page
  const isRegisterPage = pathname.includes('/register')
  const shouldUseFullWidth = content.fullWidth || isRegisterPage

  return (
    <div className={`${shouldUseFullWidth ? 'min-h-screen bg-gradient-to-br ' + content.gradient : 'h-screen overflow-hidden flex'}`}>
      {shouldUseFullWidth ? (
        // Full-width centered layout
        <div className="min-h-screen flex flex-col p-2 sm:p-4">
          {/* Top Bar with Language Selector */}
          <div className="flex justify-between items-start w-full mb-4 sm:mb-0">
            <div></div> {/* Spacer */}
            <div className="sm:absolute sm:top-6 sm:right-6 z-10">
              <LanguageSelectorAuth />
            </div>
          </div>
          
          {/* Main Content - Centered */}
          <div className="flex-1 flex items-center justify-center sm:pt-0">
            <div className="w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl mx-auto">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12">
                {/* Logo */}
                <div className="flex items-center justify-center mb-6 sm:mb-8">
                  <Link href={`/${locale}`} className="flex items-center space-x-3">
                    <PlanetTalkLogo className="h-8 sm:h-10 md:h-12 w-auto" />
                  </Link>
                </div>
                
                {children}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Split layout for other auth pages
        <>
          {/* Left side - Form */}
          <div className="flex-1 flex flex-col bg-white lg:bg-white">
            {/* Mobile Layout */}
            <div className={`lg:hidden h-full flex flex-col p-4 bg-gradient-to-br ${content.gradient}`}>
              {/* Top Bar with Language Selector */}
              <div className="flex justify-between items-start w-full mb-4">
                <div></div> {/* Spacer */}
                <div className="z-10">
                  <LanguageSelectorAuth />
                </div>
              </div>
              
              {/* Main Content - Centered */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-sm mx-auto">
                  <div className="bg-white rounded-xl shadow-2xl p-6">
                    {/* Logo */}
                    <div className="flex items-center justify-center mb-6">
                      <Link href={`/${locale}`} className="flex items-center space-x-3">
                        <PlanetTalkLogo className="h-10 w-auto" />
                      </Link>
                    </div>
                    
                    {children}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex items-center justify-center h-full px-8 xl:px-12">
              <div className="w-full max-w-lg">
                {/* Header with Logo */}
                <div className="flex items-center justify-center mb-8">
                  <Link href={`/${locale}`} className="flex items-center space-x-3">
                    <PlanetTalkLogo className="h-10 w-auto" />
                  </Link>
                </div>
                
                <div className="w-full">
                  {children}
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Image/Branding */}
          <div className={`hidden lg:flex flex-1 relative bg-gradient-to-br ${content.gradient}`}>
        {/* Language Selector - Top Right */}
        <div className="absolute top-6 right-6 z-10">
          <LanguageSelectorAuth />
        </div>

        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          {/* Large gradient orbs */}
          <div className="absolute w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full -top-48 -right-48 blur-3xl animate-pulse"></div>
          <div className="absolute w-96 h-96 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-full -bottom-48 -left-48 blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute w-64 h-64 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
          
          {/* Colorful Floating Elements */}
          <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-ping opacity-70"></div>
          <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-ping opacity-60" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/3 right-1/4 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-ping opacity-80" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-3/4 left-1/3 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping opacity-75" style={{animationDelay: '3s'}}></div>
          
          {/* Moving gradient lines */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400/50 to-transparent animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-l from-transparent via-pink-400/50 to-transparent animate-pulse" style={{animationDelay: '1.5s'}}></div>
        </div>

        {/* Content - 3-Slide Carousel */}
        <div className="relative flex flex-col justify-center w-full p-8 xl:p-12">
          <SlideCarousel content={content} />
        </div>
      </div>
        </>
      )}
    </div>
  )
}
