'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons' | 'minimal'
  className?: string
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'dropdown',
  className = ''
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const localeFromHook = useLocale()
  
  // Extract locale from pathname as fallback
  const pathSegments = pathname.split('/').filter(Boolean)
  const localeFromPath = ['en', 'fr', 'pt', 'es'].includes(pathSegments[0]) ? pathSegments[0] : 'en'
  
  // Use path-based detection since useLocale() hook is broken
  const locale = localeFromPath

  const languages = [
    { code: 'en', name: 'English', shortName: 'EN', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', shortName: 'FR', flag: '🇫🇷' },
    { code: 'pt', name: 'Português', shortName: 'PT', flag: '🇧🇷' },
    { code: 'es', name: 'Español', shortName: 'ES', flag: '🇪🇸' },
  ]

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  const handleLanguageChange = (newLocale: string) => {
    const segments = pathname.split('/').filter(Boolean)
    
    // Remove current locale if it exists
    if (['en', 'fr', 'pt', 'es'].includes(segments[0])) {
      segments.shift()
    }
    
    // Build new path with locale prefix
    const newPath = `/${newLocale}/${segments.join('/')}`
    
    // Store language preference in localStorage and cookie
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_locale', newLocale)
      // Set cookie for server-side access
      document.cookie = `preferred_locale=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`
    }
    
    window.location.href = newPath
  }

  if (variant === 'buttons') {
    return (
      <div className={`grid grid-cols-2 gap-3 ${className}`}>
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center justify-center px-3 py-2 rounded-lg border transition-colors duration-150 ${
              language.code === locale
                ? 'bg-pt-turquoise/10 border-pt-turquoise text-pt-turquoise'
                : 'border-gray-200 text-pt-dark-gray hover:border-pt-turquoise hover:text-pt-turquoise'
            }`}
          >
            <span className="text-sm font-medium">{language.name}</span>
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex space-x-2 ${className}`}>
        {languages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`px-2 py-1 text-sm font-medium rounded transition-colors duration-150 ${
              language.code === locale
                ? 'bg-pt-turquoise text-white'
                : 'text-pt-dark-gray hover:text-pt-turquoise'
            }`}
          >
            {language.shortName}
          </button>
        ))}
      </div>
    )
  }

  // Default dropdown variant
  return (
    <div className={`relative group ${className}`}>
      <button className="flex items-center space-x-2 px-3 py-2 text-pt-dark-gray hover:text-pt-turquoise transition-colors duration-150 border border-gray-200 rounded-lg hover:border-pt-turquoise">
        <span className="font-medium text-sm">{currentLanguage.shortName}</span>
        <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black/5 overflow-hidden z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
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
    </div>
  )
}

export default LanguageSwitcher
