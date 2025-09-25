import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'fr', 'pt', 'es'] as const;
export const defaultLocale = 'en' as const;

export default getRequestConfig(async ({ locale }) => {
  // Use default locale if none provided or invalid
  const validLocale = locale && locales.includes(locale as any) ? locale : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default
  };
});