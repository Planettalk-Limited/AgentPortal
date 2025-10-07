'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

const LanguageSelectorMobile = () => {
  const router = useRouter()
  const pathname = usePathname()
  const localeFromHook = useLocale()
  
  // Extract locale from pathname as fallback
  const pathSegments = pathname.split('/').filter(Boolean)
  const localeFromPath = ['en', 'fr', 'pt', 'es'].includes(pathSegments[0]) ? pathSegments[0] : 'en'
  
  // Use path-based detection since useLocale() hook is broken
  const locale = localeFromPath

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
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
    
    window.location.href = newPath
  }

  return (
    <div className="grid grid-cols-2 gap-3">
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

export default LanguageSelectorMobile
