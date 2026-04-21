'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

const PartnerPaths = () => {
  const t = useTranslations('partnerPaths')
  const locale = useLocale()
  const individualBenefitsRaw = t.raw('individual.benefits')
  const businessBenefitsRaw = t.raw('business.benefits')

  const individualBenefits = Array.isArray(individualBenefitsRaw) ? individualBenefitsRaw : []
  const businessBenefits = Array.isArray(businessBenefitsRaw) ? businessBenefitsRaw : []

  const createLocalizedPath = (path: string) => `/${locale}${path}`

  return (
    <section className="relative py-16 md:py-24 bg-gradient-to-b from-[#eef7f9] via-[#e8f3f6] to-[#edf1f8]">
      {/* Section heading */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-pt-dark-gray mb-4 leading-tight tracking-tight">
            {t('title')}
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-500">
            {t('subtitle')}
          </p>
        </div>

        {/* Side-by-side split */}
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200/70 shadow-[0_22px_70px_-30px_rgba(15,23,42,0.45)] bg-gradient-to-br from-white/95 to-[#f3f8fc]">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[520px]">

            {/* ── Individual ── */}
            <div className="relative flex-1 bg-gradient-to-br from-pt-turquoise via-pt-turquoise to-teal-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-teal-400/15 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />

              <div className="relative z-10 flex flex-col justify-center h-full px-7 sm:px-10 lg:px-14 py-14 lg:py-16 max-w-xl lg:ml-auto">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>

                <span className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">{t('individual.badge')}</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t('individual.title')}</h3>
                <p className="text-white/80 leading-relaxed mb-8">{t('individual.description')}</p>

                <ul className="space-y-3 mb-8">
                  {individualBenefits.map((benefit, index) => (
                    <li key={`${benefit}-${index}`} className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-sm text-white/95 font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={createLocalizedPath('/auth/register?type=individual')}
                  className="self-start inline-flex items-center px-7 py-3.5 bg-white text-pt-turquoise font-semibold rounded-xl hover:bg-slate-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {t('individual.cta')}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* ── Business ── */}
            <div className="relative flex-1 bg-gradient-to-br from-pt-dark-gray via-[#2a2f3a] to-[#1a1e28] overflow-hidden lg:border-l lg:border-white/10">
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgba(36,182,195,1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
              <div className="absolute top-10 right-10 w-64 h-64 bg-pt-turquoise/8 rounded-full blur-[100px]" />
              <div className="absolute bottom-10 left-10 w-48 h-48 bg-pt-turquoise/5 rounded-full blur-[80px]" />

              <div className="relative z-10 flex flex-col justify-center h-full px-7 sm:px-10 lg:px-14 py-14 lg:py-16 max-w-xl">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                  <svg className="w-7 h-7 text-pt-turquoise-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>

                <span className="text-xs font-bold uppercase tracking-widest text-pt-turquoise-300/70 mb-2">{t('business.badge')}</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t('business.title')}</h3>
                <p className="text-gray-300 leading-relaxed mb-8">{t('business.description')}</p>

                <ul className="space-y-3 mb-8">
                  {businessBenefits.map((benefit, index) => (
                    <li key={`${benefit}-${index}`} className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-pt-turquoise/15 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-pt-turquoise-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-sm text-gray-200 font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={createLocalizedPath('/auth/register?type=business')}
                  className="self-start inline-flex items-center px-7 py-3.5 bg-gradient-to-r from-pt-turquoise to-teal-400 text-white font-semibold rounded-xl hover:from-pt-turquoise-600 hover:to-teal-500 transition-all duration-300 shadow-lg shadow-pt-turquoise/20 hover:shadow-xl hover:shadow-pt-turquoise/30 hover:-translate-y-0.5"
                >
                  {t('business.cta')}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}

export default PartnerPaths
