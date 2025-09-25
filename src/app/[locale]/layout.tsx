import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { AuthProvider } from '../../contexts/AuthContext'

export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'es' },
    { locale: 'fr' },
    { locale: 'de' },
    { locale: 'it' },
    { locale: 'pt' },
    { locale: 'zh' },
    { locale: 'ja' },
    { locale: 'ko' },
    { locale: 'ar' },
    { locale: 'hi' },
    { locale: 'ru' }
  ];
}

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'en';
  
  let messages;
  try {
    messages = await getMessages({ locale });
  } catch (error) {
    // Failed to load messages - fallback to English
    // Fallback to English messages
    messages = (await import(`../../i18n/messages/en.json`)).default;
  }

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
