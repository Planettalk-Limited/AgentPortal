/**
 * Locale utility functions for consistent language handling across the application
 */

export const SUPPORTED_LOCALES = ['en', 'fr', 'pt', 'es'] as const;
export const DEFAULT_LOCALE = 'en' as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Get the current locale from pathname with fallback to stored preference
 * This is more reliable than useLocale() hook which can be inconsistent
 */
export function getCurrentLocaleFromPath(pathname: string): SupportedLocale {
  // Extract locale from pathname first (most reliable)
  const pathSegments = pathname.split('/').filter(Boolean);
  const localeFromPath = pathSegments[0];
  
  if (SUPPORTED_LOCALES.includes(localeFromPath as SupportedLocale)) {
    return localeFromPath as SupportedLocale;
  }
  
  // Fallback to stored preference if available
  if (typeof window !== 'undefined') {
    const storedLocale = localStorage.getItem('preferred_locale');
    if (storedLocale && SUPPORTED_LOCALES.includes(storedLocale as SupportedLocale)) {
      return storedLocale as SupportedLocale;
    }
  }
  
  // Final fallback to default
  return DEFAULT_LOCALE;
}

/**
 * Create a localized path by prepending the current locale
 */
export function createLocalizedPath(locale: SupportedLocale, path: string): string {
  return `/${locale}${path}`;
}

/**
 * Store the user's language preference in both localStorage and cookie
 */
export function storeLanguagePreference(locale: SupportedLocale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred_locale', locale);
    // Set cookie for server-side access
    document.cookie = `preferred_locale=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`;
  }
}

/**
 * Get stored language preference from localStorage
 */
export function getStoredLanguagePreference(): SupportedLocale | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('preferred_locale');
    return stored && SUPPORTED_LOCALES.includes(stored as SupportedLocale) 
      ? stored as SupportedLocale 
      : null;
  }
  return null;
}
