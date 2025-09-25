/**
 * Navigation utilities for locale-aware routing
 */

/**
 * Creates a localized path by prepending the locale
 * @param path - The path to localize (e.g., '/login')
 * @param locale - The locale to prepend (e.g., 'en', 'fr')
 * @returns Localized path (e.g., '/en/login')
 */
export function createLocalizedPath(path: string, locale: string): string {
  // Remove leading slash if present in path
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Ensure locale doesn't have leading/trailing slashes
  const cleanLocale = locale.replace(/^\/+|\/+$/g, '')
  
  // Construct the localized path
  return `/${cleanLocale}${cleanPath ? `/${cleanPath}` : ''}`
}

/**
 * Gets the current locale from a pathname
 * @param pathname - The current pathname (e.g., '/en/login')
 * @returns The locale (e.g., 'en') or null if not found
 */
export function getLocaleFromPathname(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  
  // Common locale codes
  const supportedLocales = ['en', 'fr', 'es', 'pt', 'de', 'it', 'zh', 'ja', 'ko']
  
  if (segments.length > 0 && supportedLocales.includes(segments[0])) {
    return segments[0]
  }
  
  return null
}

/**
 * Removes locale from pathname
 * @param pathname - The current pathname (e.g., '/en/login')
 * @returns The path without locale (e.g., '/login')
 */
export function removeLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname)
  
  if (locale) {
    return pathname.replace(`/${locale}`, '') || '/'
  }
  
  return pathname
}

/**
 * Switches the locale in a pathname
 * @param pathname - The current pathname (e.g., '/en/login')
 * @param newLocale - The new locale (e.g., 'fr')
 * @returns The path with new locale (e.g., '/fr/login')
 */
export function switchLocaleInPathname(pathname: string, newLocale: string): string {
  const pathWithoutLocale = removeLocaleFromPathname(pathname)
  return createLocalizedPath(pathWithoutLocale, newLocale)
}
