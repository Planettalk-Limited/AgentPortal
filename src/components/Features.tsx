'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

const Features = () => {
  const t = useTranslations('hero')
  const locale = useLocale()

  // Helper function to create locale-aware links
  const createLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }

  return (
    <>
      <div className="bg-pt-turquoise relative">
        {/* Info Section with enhanced design */}
        <div className="container relative z-10 pb-16 md:pb-24">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20 shadow-lg relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            
            {/* Quote icons */}
            <div className="absolute top-4 left-4 text-white/20 text-4xl">"</div>
            <div className="absolute bottom-4 right-4 text-white/20 text-4xl rotate-180">"</div>
            
            <div className="relative z-10 text-center">
              <p className="text-white text-lg md:text-xl leading-relaxed mb-4">
                {t('info')}
              </p>
              <p className="text-white text-lg md:text-xl leading-relaxed mb-6">
                {t('helpThemStay')}
              </p>
              
              <div className="flex justify-center">
                <Link 
                  href={createLocalizedPath('/auth/apply')}
                  className="bg-white text-pt-turquoise px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {t('ctaSecondary')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Join Section with enhanced design and different colors */}
      <div className="bg-pt-turquoise py-16 md:py-20 relative">
        <div className="container relative z-10">
          <div className="relative mb-10">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center">
              {t('whyJoin.title')}
            </h2>
            <div className="w-24 h-1 bg-white/40 rounded mx-auto mt-4"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {t.raw('whyJoin.reasons').map((reason: any, index: number) => {
              const gradientClasses = [
                'bg-gradient-to-br from-[#FF6B6B]/80 to-[#FF9E53]/80',
                'bg-gradient-to-br from-[#7209B7]/95 to-[#F72585]/95', 
                'bg-gradient-to-br from-[#3A0CA3]/80 to-[#4CC9F0]/80'
              ];
              
              return (
                <div key={index} className={`${gradientClasses[index]} backdrop-blur-md rounded-2xl p-4 md:p-6 border border-white/30 transform transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden group`}>
                  {/* Decorative elements */}
                  <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-all duration-500"></div>
                  <div className="absolute top-0 right-0 border-t-[30px] border-r-[30px] border-t-white/20 border-r-transparent"></div>
                  
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-3 md:mb-4 relative">
                    {reason.title}
                    <div className="h-1 w-12 md:w-16 bg-white/50 mt-2"></div>
                  </h3>
                  <p className="text-white/90 font-medium relative text-base md:text-lg">
                    {reason.description}
                  </p>
                  
                  {/* Visual indicator */}
                  <div className="absolute bottom-4 right-4 text-white/30">
                    {index === 0 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover:text-white/60 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {index === 1 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover:text-white/60 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                    {index === 2 && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover:text-white/60 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div className="container mt-12 md:mt-16 lg:mt-24 text-center relative z-10">
          {/* Decorative elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-white/5 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-3xl animate-pulse-slower"></div>
          </div>
          
          <div className="relative inline-block mb-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">{t('cta')}</h2>
            <div className="h-1 w-1/2 bg-white/30 rounded mx-auto mt-2"></div>
          </div>
          
          <p className="text-white/80 text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-8 md:mb-10 px-4">{t('ctaDescription')}</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href={createLocalizedPath('/auth/apply')}
              className="group relative overflow-hidden rounded-lg inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 text-lg md:text-xl font-semibold text-pt-turquoise transition-all duration-300 sm:w-auto w-full max-w-sm sm:max-w-none"
            >
              <span className="absolute inset-0 bg-white"></span>
              <span className="absolute inset-0 bg-white/80 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
              <span className="relative flex items-center justify-center">
                {t('ctaSecondary')}
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
              
              {/* Animated highlight effect */}
              <span className="absolute inset-0 -z-10 rounded-lg ring-2 ring-white/20 animate-pulse-slow"></span>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Features