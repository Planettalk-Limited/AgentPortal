'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { getCurrentLocaleFromPath, storeLanguagePreference, SUPPORTED_LOCALES } from '@/lib/locale-utils'

const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const localeFromHook = useLocale()
  
  // Use reliable locale detection
  const locale = getCurrentLocaleFromPath(pathname)


  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'pt', name: 'Português' },
    { code: 'es', name: 'Español' },
  ]

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  const handleLanguageChange = (newLocale: string) => {
    const segments = pathname.split('/').filter(Boolean)
    
    // Remove current locale if it exists
    if (SUPPORTED_LOCALES.includes(segments[0] as any)) {
      segments.shift()
    }
    
    // Build new path with locale prefix
    const newPath = `/${newLocale}/${segments.join('/')}`
    
    // Store language preference
    storeLanguagePreference(newLocale as any)
    
    // Force a hard navigation to ensure locale changes
    window.location.href = newPath
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-pt-dark-gray hover:text-pt-turquoise transition-colors duration-150 relative pr-6"
        aria-expanded={isOpen}
      >
        <span className="font-medium hidden sm:block">{currentLanguage.name}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black/5 overflow-hidden z-[9999]">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center px-4 py-3 text-sm transition-colors duration-150 ${
                language.code === locale
                  ? 'bg-pt-turquoise/10 text-pt-turquoise'
                  : 'text-pt-dark-gray hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{language.name}</span>
              {language.code === locale && (
                <svg className="w-4 h-4 ml-auto text-pt-turquoise" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageSelector
