'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import PlanetTalkLogo from './PlanetTalkLogo'
import { FaFacebook, FaInstagram, FaYoutube, FaLinkedin, FaTiktok } from 'react-icons/fa'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const pathname = usePathname()
  const localeFromHook = useLocale()
  const t = useTranslations('footer')

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

  const footerLinks = {
    platform: [
      { name: t('links.agentSignIn'), href: createLocalizedPath('/auth/login') },
      { name: t('links.becomeAgent'), href: createLocalizedPath('/auth/register') },
      { name: t('links.dashboard'), href: createLocalizedPath('/dashboard') },
    ],
    support: [
      { name: t('links.helpSupport'), href: 'https://care.planettalk.com/support/solutions', external: true },
      { name: t('links.contactSupport'), href: 'https://care.planettalk.com/support/solutions', external: true },
      { name: t('links.agentResources'), href: createLocalizedPath('/agent') },
    ],
    company: [
      { name: t('links.planettalkWebsite'), href: 'https://planettalk.com', external: true },
      { name: t('links.blog'), href: 'https://blog.planettalk.com', external: true },
      { name: t('links.partnerWithUs'), href: 'https://planettalk.com/partner', external: true },
    ],
    legal: [
      { name: t('links.termsConditions'), href: createLocalizedPath('/terms-and-conditions') },
      { name: t('links.privacyPolicy'), href: createLocalizedPath('/privacy-policy') },
      { name: t('links.cookiePolicy'), href: createLocalizedPath('/cookies') },
    ],
  }

  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/PlanetTalkUK',
      icon: FaFacebook
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/planettalkworld/',
      icon: FaInstagram
    },
    {
      name: 'YouTube',
      href: 'https://www.youtube.com/@planettalk4784',
      icon: FaYoutube
    },
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/company/planet-talk/',
      icon: FaLinkedin
    },
    {
      name: 'TikTok',
      href: 'https://www.tiktok.com/@planettalkworld',
      icon: FaTiktok
    }
  ]

  return (
    <footer className="bg-pt-dark-gray text-white">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info with PlanetTalk Logo */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <PlanetTalkLogo className="h-8 w-auto" variant="white" />
              <div className="text-sm text-gray-300 font-medium mt-2">
                {t('agentPortal')}
              </div>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              {t('description')}
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a 
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-pt-turquoise transition-colors duration-150"
                  aria-label={social.name}
                >
                  <social.icon className="w-6 h-6" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('sections.platform')}</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-300 hover:text-pt-turquoise transition-colors duration-150">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('sections.support')}</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  {link.external ? (
                    <a 
                      href={link.href} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-pt-turquoise transition-colors duration-150"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-gray-300 hover:text-pt-turquoise transition-colors duration-150">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('sections.company')}</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  {link.external ? (
                    <a 
                      href={link.href} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-pt-turquoise transition-colors duration-150"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-gray-300 hover:text-pt-turquoise transition-colors duration-150">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-600 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* App Downloads */}
            <div className="mb-6 md:mb-0">
              <p className="text-sm text-gray-400 mb-3">{t('downloadApp')}</p>
              <div className="flex space-x-3">
                <a 
                  href="https://play.google.com/store/search?q=planettalk&c=apps&hl=en" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity duration-200"
                >
                  <img 
                    src="/images/app-store-google.png" 
                    width="120" 
                    height="36" 
                    alt="Download on Google Play"
                  />
                </a>
                <a 
                  href="https://app.planettalk.com/Jxk8/web" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity duration-200"
                >
                  <img 
                    src="/images/app-store-apple.png" 
                    width="120" 
                    height="36" 
                    alt="Download on App Store"
                  />
                </a>
              </div>
            </div>
            
            {/* Legal Links */}
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm">
              {footerLinks.legal.map((link) => (
                <Link key={link.name} href={link.href} className="text-gray-400 hover:text-pt-turquoise transition-colors duration-150">
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Copyright */}
          <div className="text-center mt-8 pt-8 border-t border-gray-600">
            <p className="text-gray-400 text-sm">
              {t('copyright', { year: currentYear })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
