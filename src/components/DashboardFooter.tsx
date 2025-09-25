'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import PlanetTalkLogo from './PlanetTalkLogo'

const DashboardFooter = () => {
  const currentYear = new Date().getFullYear()
  const locale = useLocale()
  const t = useTranslations('dashboardFooter')

  const createLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo and Description */}
          <div className="flex items-center space-x-4">
            <PlanetTalkLogo className="h-6 w-auto" />
            <div className="text-sm text-pt-light-gray">
              {t('description')}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex items-center space-x-6 text-sm">
            <a 
              href="https://planettalk.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-pt-light-gray hover:text-pt-turquoise transition-colors duration-200"
            >
              PlanetTalk.com
            </a>
            <a 
              href="https://care.planettalk.com/support/solutions" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-pt-light-gray hover:text-pt-turquoise transition-colors duration-200"
            >
              {t('support')}
            </a>
            <Link 
              href={createLocalizedPath('/terms-and-conditions')}
              className="text-pt-light-gray hover:text-pt-turquoise transition-colors duration-200"
            >
              {t('terms')}
            </Link>
            <Link 
              href={createLocalizedPath('/privacy-policy')}
              className="text-pt-light-gray hover:text-pt-turquoise transition-colors duration-200"
            >
              {t('privacy')}
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-pt-light-gray">
            © {currentYear} PlanetTalk Limited
          </div>
        </div>
      </div>
    </footer>
  )
}

export default DashboardFooter
