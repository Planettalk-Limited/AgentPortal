'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import PlanetTalkLogo from './PlanetTalkLogo'
import LanguageSelector from './LanguageSelector'
import LanguageSelectorMobile from './LanguageSelectorMobile'

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const localeFromHook = useLocale()
  const t = useTranslations('navigation')

  // Get current locale from pathname as primary source, with fallback to stored preference
  const getCurrentLocale = () => {
    // Extract locale from pathname first (most reliable)
    const pathSegments = pathname.split('/').filter(Boolean)
    const localeFromPath = ['en', 'fr', 'pt', 'es'].includes(pathSegments[0]) ? pathSegments[0] : null
    
    if (localeFromPath) {
      return localeFromPath
    }
    
    // Fallback to stored preference if available
    if (typeof window !== 'undefined') {
      const storedLocale = localStorage.getItem('preferred_locale')
      if (storedLocale && ['en', 'fr', 'pt', 'es'].includes(storedLocale)) {
        return storedLocale
      }
    }
    
    // Final fallback to default
    return 'en'
  }

  const locale = getCurrentLocale()

  // Helper function to create locale-aware links
  const createLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }

  const handleLogout = async () => {
    try {
      await logout()
      // Navigation is handled by the auth context
    } catch (error) {
      // Logout error handled by auth context
    }
  }

  // Navigation items based on authentication status
  const getNavItems = () => {
    if (user) {
      // Authenticated user navigation
      const baseItems = [
        { href: createLocalizedPath('/dashboard'), label: t('dashboard'), external: false },
      ]

      // Add admin items for admin users
      if (user.role === 'admin' || user.role === 'pt_admin') {
        baseItems.push(
          { href: createLocalizedPath('/admin/agents'), label: t('agents'), external: false },
          { href: createLocalizedPath('/admin/payouts'), label: t('payouts'), external: false },
          { href: createLocalizedPath('/admin/users'), label: t('users'), external: false },
        )
      }

      baseItems.push(
        { href: createLocalizedPath('/profile'), label: t('profile'), external: false },
        { href: 'https://www.whatsapp.com/channel/0029VbAgkQJJf05cXRvh8e3s', label: t('chatWithUs'), external: true, isWhatsApp: true }
      )
      
      return baseItems
    } else {
      // Public navigation
      return [
        { href: 'https://planettalk.com', label: t('planettalkWebsite'), external: true },
        { href: 'https://www.whatsapp.com/channel/0029VbAgkQJJf05cXRvh8e3s', label: t('chatWithUs'), external: true, isWhatsApp: true }
      ]
    }
  }

  const navItems = getNavItems()

  return (
    <header className="fixed z-50 top-0 inset-x-0 h-[80px] lg:h-[100px] bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="container relative h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <div className="flex items-center h-full">
            <Link href={`/${locale}`} className="flex items-center space-x-3">
              <PlanetTalkLogo className="h-6 lg:h-8 w-auto" />
              <div className="text-sm text-pt-dark-gray font-medium border-l border-pt-light-gray-300 pl-3">
                {t('agentPortal')}
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button 
            className="lg:hidden flex items-center justify-center relative z-[200]" 
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {/* Hamburger icon */}
            {!mobileMenuOpen && (
              <div className="w-8 h-8">
                <svg width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.688 8.438h20.625M4.688 15h20.625M4.688 21.563h20.625" stroke="#404653" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
            
            {/* Close (X) icon */}
            {mobileMenuOpen && (
              <div className="w-8 h-8 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 6L18 18" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </button>

          {/* Navigation */}
          <nav className={`${mobileMenuOpen ? 'fixed inset-0 z-[60] bg-white h-screen w-screen lg:static lg:bg-transparent lg:h-auto lg:w-auto' : 'hidden'} lg:flex pb-4 text-xl font-medium`}>
            {/* Mobile menu header */}
            {mobileMenuOpen && (
              <div className="lg:hidden fixed top-0 left-0 right-0 flex items-center justify-between p-6 bg-white z-[90] border-b border-gray-100">
                <Link href="/" className="flex items-center space-x-3">
                  <PlanetTalkLogo className="h-6 w-auto" />
                  <div className="text-sm text-pt-dark-gray font-medium border-l border-pt-light-gray-300 pl-3">
                    {t('agentPortal')}
                  </div>
                </Link>
              </div>
            )}
            
            {/* Mobile menu content */}
            {mobileMenuOpen && (
              <div className="lg:hidden flex flex-col min-h-screen h-full pt-24 px-6 pb-8 overflow-y-auto bg-white">
                <div className="flex-1">
                  <ul className="space-y-6 mb-8">
                    {navItems.map((item) => (
                      <li key={item.href}>
                        {item.external ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xl font-medium text-pt-dark-gray hover:text-pt-turquoise transition-colors duration-150 flex items-center"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {item.label}
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <Link 
                            href={item.href}
                            className="text-xl font-medium text-pt-dark-gray hover:text-pt-turquoise transition-colors duration-150 flex items-center"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {item.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                  
                  {/* Mobile Language Selector */}
                  <div className="border-t border-gray-200 pt-6 mb-6">
                    <p className="text-sm text-pt-light-gray mb-3">Language / Langue / Idioma</p>
                    <LanguageSelectorMobile />
                  </div>
                  
                  {/* Mobile Auth Buttons */}
                  <div className="border-t border-gray-200 pt-6">
                    {user ? (
                      <div>
                        <p className="text-sm text-pt-light-gray mb-4">
                          {t('welcome', { name: `${user.firstName} ${user.lastName}` })}
                        </p>
                        <button
                          onClick={handleLogout}
                          className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-600 transition-colors duration-200"
                        >
                          {t('signOut')}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Link
                          href={createLocalizedPath('/auth/login')}
                          className="block w-full bg-pt-turquoise text-white py-3 px-4 rounded-lg font-semibold hover:bg-pt-turquoise-600 transition-colors duration-200 text-center"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {t('signIn')}
                        </Link>
                        <Link
                          href={createLocalizedPath('/auth/register')}
                          className="block w-full border-2 border-pt-turquoise text-pt-turquoise py-3 px-4 rounded-lg font-semibold hover:bg-pt-turquoise hover:text-white transition-colors duration-200 text-center"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {t('becomeAgent')}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Desktop navigation */}
            <ul className="hidden lg:flex lg:items-center lg:space-x-8">
              {navItems.map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pt-dark-gray hover:text-pt-turquoise transition-colors duration-150 font-medium flex items-center"
                    >
                      {item.label}
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <Link 
                      href={item.href}
                      className="text-pt-dark-gray hover:text-pt-turquoise transition-colors duration-150 font-medium"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
              
              {/* Desktop Auth Buttons */}
              {!loading && (
                <li className="flex items-center space-x-4">
                  {user ? (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-pt-dark-gray">
                        {t('welcome', { name: user.firstName })}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors duration-200"
                      >
                        {t('signOut')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <LanguageSelector />
                      <Link
                        href={createLocalizedPath('/auth/login')}
                        className="text-pt-turquoise hover:text-pt-turquoise-600 font-medium transition-colors duration-200"
                      >
                        {t('signIn')}
                      </Link>
                      <Link
                        href={createLocalizedPath('/auth/register')}
                        className="bg-pt-turquoise text-white px-4 py-2 rounded-lg font-medium hover:bg-pt-turquoise-600 transition-colors duration-200"
                      >
                        {t('becomeAgent')}
                      </Link>
                    </div>
                  )}
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
