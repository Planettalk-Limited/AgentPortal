import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'fr', 'pt', 'es'];
const defaultLocale = 'en';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is the root path without locale
  if (pathname === '/') {
    // Try to get preferred locale from cookie or header
    const preferredLocale = request.cookies.get('preferred_locale')?.value ||
                           request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] ||
                           defaultLocale;
    
    const validLocale = locales.includes(preferredLocale) ? preferredLocale : defaultLocale;
    
    return NextResponse.redirect(new URL(`/${validLocale}`, request.url));
  }
  
  // Check if pathname doesn't have a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  if (!pathnameHasLocale) {
    // Try to get preferred locale from cookie
    const preferredLocale = request.cookies.get('preferred_locale')?.value || defaultLocale;
    const validLocale = locales.includes(preferredLocale) ? preferredLocale : defaultLocale;
    
    return NextResponse.redirect(new URL(`/${validLocale}${pathname}`, request.url));
  }
  
  // Set preferred locale cookie based on URL
  const currentLocale = pathname.split('/')[1];
  if (locales.includes(currentLocale)) {
    const response = intlMiddleware(request);
    if (response) {
      response.cookies.set('preferred_locale', currentLocale, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        httpOnly: false,
        sameSite: 'lax'
      });
      return response;
    }
  }
  
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
