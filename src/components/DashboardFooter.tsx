'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import PlanetTalkLogo from './PlanetTalkLogo'
import WhatsAppGroupModal from './WhatsAppGroupModal'

const DashboardFooter = () => {
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false)
  const currentYear = new Date().getFullYear()
  const locale = useLocale()
  const t = useTranslations('dashboardFooter')

  const createLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 gap-3 md:gap-4">
          {/* Logo and Description */}
          <div className="flex flex-col md:flex-row items-center md:space-x-4 text-center md:text-left">
            <PlanetTalkLogo className="h-5 sm:h-6 w-auto mb-2 md:mb-0" />
            <div className="text-xs sm:text-sm text-pt-light-gray">
              {t('description')}
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm">
            <button
              onClick={() => setWhatsappModalOpen(true)}
              className="text-pt-light-gray hover:text-pt-turquoise transition-colors duration-200 whitespace-nowrap"
            >
              WhatsApp
            </button>
            <a 
              href="https://planettalk.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-pt-light-gray hover:text-pt-turquoise transition-colors duration-200 whitespace-nowrap"
            >
              PlanetTalk.com
            </a>
            <a 
              href="https://care.planettalk.com/support/solutions" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-pt-light-gray hover:text-pt-turquoise transition-colors duration-200 whitespace-nowrap"
            >
              {t('support')}
            </a>
            <Link 
              href={createLocalizedPath('/terms-and-conditions')}
              className="text-pt-light-gray hover:text-pt-turquoise transition-colors duration-200 whitespace-nowrap"
            >
              {t('terms')}
            </Link>
            <Link 
              href={createLocalizedPath('/privacy-policy')}
              className="text-pt-light-gray hover:text-pt-turquoise transition-colors duration-200 whitespace-nowrap"
            >
              {t('privacy')}
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-xs sm:text-sm text-pt-light-gray text-center md:text-right">
            © {currentYear} PlanetTalk Limited
          </div>
        </div>
      </div>

      {/* WhatsApp Group Modal */}
      <WhatsAppGroupModal 
        isOpen={whatsappModalOpen} 
        onClose={() => setWhatsappModalOpen(false)} 
      />
    </footer>
  )
}

export default DashboardFooter
