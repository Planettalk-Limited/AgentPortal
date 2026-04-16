'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

const PartnerPaths = () => {
  const t = useTranslations('partnerPaths')
  const locale = useLocale()

  const createLocalizedPath = (path: string) => `/${locale}${path}`

  return (
    <section className="bg-white py-16 md:py-24 relative overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #24B6C3 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pt-dark-gray mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-gray-500">
            {t('subtitle')}
          </p>
        </div>

        {/* Two-column cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">

          {/* Individual card */}
          <div className="relative bg-white border-2 border-gray-200 rounded-3xl p-8 sm:p-10 flex flex-col hover:border-pt-turquoise/40 hover:shadow-xl transition-all duration-300 group">
            <span className="inline-block self-start px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-pt-turquoise/10 text-pt-turquoise mb-6">
              {t('individual.badge')}
            </span>

            <div className="w-14 h-14 bg-gradient-to-br from-pt-turquoise/10 to-teal-50 rounded-2xl flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-pt-dark-gray mb-3">
              {t('individual.title')}
            </h3>
            <p className="text-gray-500 leading-relaxed mb-6">
              {t('individual.description')}
            </p>

            <ul className="space-y-3 mb-8 flex-1">
              {([0, 1, 2, 3] as const).map(i => (
                <li key={i} className="flex items-start text-sm text-gray-700">
                  <svg className="w-5 h-5 text-pt-turquoise mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {t(`individual.benefits.${i}`)}
                </li>
              ))}
            </ul>

            <Link
              href={createLocalizedPath('/auth/register?type=individual')}
              className="w-full inline-flex items-center justify-center px-6 py-4 bg-pt-turquoise text-white font-bold rounded-2xl hover:bg-pt-turquoise-600 hover:shadow-lg transition-all duration-200 text-lg group-hover:scale-[1.02] transform"
            >
              {t('individual.cta')}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Business card */}
          <div className="relative bg-gradient-to-br from-pt-dark-gray to-gray-800 border-2 border-pt-dark-gray rounded-3xl p-8 sm:p-10 flex flex-col hover:shadow-2xl transition-all duration-300 group">
            <span className="inline-block self-start px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/15 text-white mb-6">
              {t('business.badge')}
            </span>

            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-pt-turquoise-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              {t('business.title')}
            </h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              {t('business.description')}
            </p>

            <ul className="space-y-3 mb-8 flex-1">
              {([0, 1, 2, 3] as const).map(i => (
                <li key={i} className="flex items-start text-sm text-gray-300">
                  <svg className="w-5 h-5 text-pt-turquoise-300 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {t(`business.benefits.${i}`)}
                </li>
              ))}
            </ul>

            <Link
              href={createLocalizedPath('/auth/register?type=business')}
              className="w-full inline-flex items-center justify-center px-6 py-4 bg-pt-turquoise text-white font-bold rounded-2xl hover:bg-pt-turquoise-600 hover:shadow-lg transition-all duration-200 text-lg group-hover:scale-[1.02] transform"
            >
              {t('business.cta')}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}

export default PartnerPaths
