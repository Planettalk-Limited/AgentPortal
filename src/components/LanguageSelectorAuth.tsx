'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

const LanguageSelectorAuth = () => {
  const router = useRouter()
  const pathname = usePathname()
  const localeFromHook = useLocale()
  
  // Extract locale from pathname as fallback
  const pathSegments = pathname.split('/').filter(Boolean)
  const localeFromPath = ['en', 'fr', 'pt', 'es'].includes(pathSegments[0]) ? pathSegments[0] : 'en'
  
  // Use path-based detection since useLocale() hook might be inconsistent
  const locale = localeFromPath

  const languages = [
    { code: 'en', name: 'English', shortName: 'EN', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', shortName: 'FR', flag: '🇫🇷' },
    { code: 'pt', name: 'Português', shortName: 'PT', flag: '🇧🇷' },
    { code: 'es', name: 'Español', shortName: 'ES', flag: '🇪🇸' },
  ]

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
    
    router.push(newPath)
  }

  return (
    <div className="flex items-center space-x-2">
      {languages.map((language) => (
        <button
          key={language.code}
          onClick={() => handleLanguageChange(language.code)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
            language.code === locale
              ? 'bg-white/20 text-white border border-white/30'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <span className="mr-1">{language.flag}</span>
          {language.shortName}
        </button>
      ))}
    </div>
  )
}

export default LanguageSelectorAuth
