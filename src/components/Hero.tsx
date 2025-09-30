'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

const Hero = () => {
  const t = useTranslations('hero')
  const locale = useLocale()

  // Helper function to create locale-aware links
  const createLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }
  return (
    <section className="bg-pt-turquoise relative overflow-hidden min-h-screen flex items-center">
      {/* Simple background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pt-turquoise via-pt-turquoise to-pt-turquoise-600"></div>
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute w-96 h-96 bg-white/10 rounded-full -top-48 -right-48 blur-3xl"></div>
        <div className="absolute w-96 h-96 bg-white/5 rounded-full -bottom-48 -left-48 blur-3xl"></div>
      </div>

      <div className="container relative py-20 pt-52 md:pt-44 lg:pt-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status badge */}
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-white text-sm font-medium">{t('badge')}</span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            {t('title')}
            <span className="block text-white/90">{t('subtitle')}</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('description')}
          </p>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link 
              href={createLocalizedPath('/auth/login')}
              className="group bg-white text-pt-turquoise px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-lg w-full sm:w-auto"
            >
              <span className="flex items-center justify-center">
                {t('ctaPrimary')}
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
            
            <Link 
              href={createLocalizedPath('/auth/register')}
              className="group border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition-all duration-300 hover:scale-105 w-full sm:w-auto"
            >
              <span className="flex items-center justify-center">
                {t('ctaSecondary')}
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
            </Link>
          </div>
          
          {/* Process highlights */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{t('process.step1.title')}</h3>
              <p className="text-white/70 text-sm">{t('process.step1.description')}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">2</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{t('process.step2.title')}</h3>
              <p className="text-white/70 text-sm">{t('process.step2.description')}</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">3</span>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{t('process.step3.title')}</h3>
              <p className="text-white/70 text-sm">{t('process.step3.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
