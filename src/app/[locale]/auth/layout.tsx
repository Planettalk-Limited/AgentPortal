'use client'

import type { Metadata } from 'next'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import PlanetTalkLogo from '@/components/PlanetTalkLogo'
import LanguageSelectorAuth from '@/components/LanguageSelectorAuth'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = useLocale()
  const pathname = usePathname()

  // Determine gradient based on current page
  const getPageGradient = () => {
    if (pathname.includes('/login')) {
      return "from-pt-turquoise via-pt-turquoise to-pt-turquoise-600"
    }
    
    if (pathname.includes('/apply')) {
      return "from-pt-turquoise via-pt-turquoise-600 to-teal-600"
    }
    
    if (pathname.includes('/forgot-password') || pathname.includes('/reset-password')) {
      return "from-pt-turquoise via-pt-turquoise to-pt-turquoise-600"
    }

    // Default fallback
    return "from-pt-turquoise via-pt-turquoise to-pt-turquoise-600"
  }

  const gradient = getPageGradient()

  // Force full-width layout for register and apply pages
  const isRegisterPage = pathname.includes('/register')
  const isApplyPage = pathname.includes('/apply')
  const shouldUseFullWidth = isRegisterPage || isApplyPage

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient}`}>
      {shouldUseFullWidth ? (
        // Full-width centered layout for register/apply
        <div className="min-h-screen flex flex-col p-2 sm:p-4">
          {/* Top Bar with Language Selector */}
          <div className="flex justify-end items-start w-full mb-4 sm:mb-0">
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
        // Centered layout for login and other auth pages
        <div className="min-h-screen flex flex-col p-4 sm:p-6">
          {/* Top Bar with Language Selector */}
          <div className="flex justify-end items-start w-full mb-4 flex-shrink-0">
            <div className="z-10">
              <LanguageSelectorAuth />
            </div>
          </div>
          
          {/* Main Content - Centered */}
          <div className="flex-1 flex items-center justify-center py-4">
            <div className="w-full max-w-lg lg:max-w-xl mx-auto px-4">
              <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 lg:p-12">
                {/* Logo */}
                <div className="flex items-center justify-center mb-6 sm:mb-8">
                  <Link href={`/${locale}`} className="flex items-center space-x-3">
                    <PlanetTalkLogo className="h-10 sm:h-12 w-auto" />
                  </Link>
                </div>
                
                {children}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
