'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'

const Hero = () => {
  const t = useTranslations('hero')
  const locale = useLocale()
  const [modalOpen, setModalOpen] = useState(false)

  // Helper function to create locale-aware links
  const createLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }

  return (
    <>
      <section className="bg-pt-turquoise relative overflow-hidden min-h-screen flex items-center pt-16">
        {/* Shooting stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
        </div>

        {/* Enhanced background pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-[800px] h-[800px] bg-white/10 rounded-full -top-1/4 -right-1/4 blur-3xl animate-pulse-slow"></div>
          <div className="absolute w-[600px] h-[600px] bg-white/5 rounded-full -bottom-1/4 -left-1/4 blur-2xl animate-pulse-slower"></div>
          <div className="absolute w-[400px] h-[400px] bg-white/5 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-xl animate-pulse"></div>
        </div>

        {/* World map background */}
        <div className="absolute opacity-15 inset-x-0 top-0 bottom-[30%] lg:bottom-0 bg-no-repeat bg-center bg-opacity-15" style={{backgroundImage: 'url(/images/world-map.png)'}} aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pt-turquoise/50 to-pt-turquoise"></div>
        </div>

        <div className="container relative py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="space-y-4 md:space-y-6">
                {/* Modern stacked title with enhanced highlight effect */}
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight opacity-0 animate-slide-up pt-8 md:pt-12">
                  <div className="relative inline-block">
                    <span className="relative z-10 text-white drop-shadow-lg before:content-[''] before:absolute before:-z-10 before:bottom-2 before:-left-2 before:w-8 before:h-8 before:rounded-full before:bg-pt-turquoise/30 before:blur-md before:animate-pulse-slow">
                      {t('title')}
                    </span>
                  </div>
                  <span className="block text-white/90 mt-1 md:mt-2">{t('middle') || 'Agent'}</span>
                  <div className="relative mt-1 md:mt-2">
                    <span className="text-white font-extrabold relative z-10 inline-block">
                      {t('subtitle')}
                      <svg className="absolute -top-6 -right-8 w-6 h-6 text-white/60 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2L14.5 9H22L16 13.5L18.5 20.5L12 16L5.5 20.5L8 13.5L2 9H9.5L12 2Z" strokeWidth="1.5"/>
                      </svg>
                    </span>
                    <span className="absolute -bottom-2 left-0 w-full h-1 bg-white rounded animate-width"></span>
                  </div>
                </h1>
                
                {/* Subtitle with glowing effect */}
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium text-white/90 opacity-0 animate-slide-up delay-100">
                  <span className="relative inline-block">
                    {t('subtitle2') || 'Make some cash with PlanetTalk!'}
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-white/40"></span>
                  </span>
                </h2>
                
                <p className="text-base md:text-lg text-white/80 max-w-lg opacity-0 animate-slide-up delay-200">
                  {t('description')}
                </p>

                <div className="mt-6 md:mt-8 opacity-0 animate-slide-up delay-300 flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0">
                  <button 
                    type="button" 
                    className="group relative overflow-hidden rounded-lg inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 text-lg md:text-xl font-semibold text-pt-turquoise transition-all duration-300 w-full sm:w-auto"
                    onClick={() => setModalOpen(true)}
                  >
                    <span className="absolute inset-0 bg-white"></span>
                    <span className="absolute inset-0 bg-white/80 translate-x-full group-hover:translate-x-0 transition-transform duration-500"></span>
                    <span className="relative flex items-center justify-center">
                      {t('signUp') || t('ctaSecondary')}
                      <svg className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="relative mt-8 lg:mt-0">
              <div className="relative z-10 opacity-0 animate-slide-up delay-400 h-full">
                <div className="relative w-full">
                  {/* Decorative elements around image - hidden on mobile */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pt-turquoise/20 to-transparent rounded-3xl animate-pulse-slow hidden md:block"></div>
                  
                  {/* Floating dots - hidden on mobile */}
                  <div className="absolute top-[10%] -left-6 w-12 h-12 rounded-full border border-white/30 animate-float-slow hidden lg:block"></div>
                  <div className="absolute bottom-[20%] -right-4 w-8 h-8 rounded-full border border-white/20 animate-float-slower hidden lg:block"></div>
                  
                  {/* Enhanced image with frame effect - responsive borders */}
                  <div className="relative rounded-2xl overflow-hidden border-0 md:border md:border-white/20 shadow-lg transform hover:scale-[1.02] transition-transform duration-500">
                    <img 
                      src="/images/agent-signup.jpg" 
                      alt="Become a PlanetTalk Agent" 
                      className="relative w-full h-full object-cover md:object-contain max-w-xl mx-auto lg:max-w-none"
                      style={{minHeight: '250px', maxHeight: '60vh', objectPosition: 'center'}}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/hero-img-7.png';
                      }}
                    />
                    
                    {/* Overlay glow effect - subtle on mobile */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-pt-turquoise/5 md:from-pt-turquoise/10 via-transparent to-white/5 md:to-white/10"></div>
                    
                    {/* Decorative corner elements - hidden on mobile */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-white/30 hidden md:block"></div>
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-white/30 hidden md:block"></div>
                  </div>
                  
                  {/* Animated city markers - hidden on mobile */}
                  <div className="absolute top-1/4 left-1/4 w-3 h-3 md:w-4 md:h-4 bg-white rounded-full animate-ping-slow hidden md:block"></div>
                  <div className="absolute top-1/2 right-1/3 w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-ping-slower hidden md:block"></div>
                  <div className="absolute bottom-1/3 right-1/4 w-4 h-4 md:w-5 md:h-5 bg-white rounded-full animate-ping hidden md:block"></div>
                  
                  {/* Enhanced Commission badge with more eye-catching design - responsive positioning */}
                  <div className="absolute -bottom-2 -right-2 md:-bottom-4 md:-right-4 w-20 h-20 md:w-28 md:h-28 lg:w-36 lg:h-36 bg-gradient-to-br from-[#FF6B6B]/80 to-[#FF9E53]/80 rounded-full flex items-center justify-center shadow-xl animate-bounce-slow overflow-hidden transform rotate-3 border-2 md:border-4 border-white">
                    <div className="text-center relative z-10 bg-white w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-full flex flex-col items-center justify-center">
                      <span className="text-[#FF6B6B] text-lg md:text-2xl lg:text-3xl font-extrabold">{t('commissionBadge.months') || '24'}</span>
                      <span className="text-[#FF6B6B] text-xs md:text-xs lg:text-sm block">{t('commissionBadge.period') || 'months'}</span>
                      <span className="text-[#FF6B6B] text-xs md:text-sm lg:text-base block font-bold">{t('commissionBadge.label') || 'commission'}</span>
                      <div className="absolute inset-0 border-2 md:border-4 border-dashed border-[#FF6B6B]/30 rounded-full animate-spin-slow"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Add decorative elements - hidden on mobile */}
              <div className="absolute -top-10 -right-10 w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-full blur-xl animate-float-slow hidden md:block"></div>
              <div className="absolute -bottom-5 -left-5 w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-full blur-lg animate-float-slower hidden md:block"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Registration Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setModalOpen(false)} aria-hidden="true"></div>
          
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative bg-white rounded-lg w-full max-w-4xl shadow-2xl transform transition-all">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-xl md:text-2xl font-semibold text-gray-900">{t('signUp') || 'Sign Up'}</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-500" aria-label="Close modal">
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="mb-4">
                  <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700 font-medium">
                          Please read the terms and conditions before filling out the form
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Terms and Conditions</h4>
                    <p className="text-sm text-gray-600">
                      Please read this before filling out the form. By submitting this form, you agree to our 
                      <a href="/agent_program_terms_&_conditions.pdf" target="_blank" className="text-pt-turquoise underline hover:no-underline"> Agent Program Terms and Conditions</a>. 
                      You consent to receive communications about the PlanetTalk Agent Program and understand that your data will be processed in accordance with our Privacy Policy.
                    </p>
                  </div>
                </div>
                
                <div className="text-center">
                  <Link 
                    href={createLocalizedPath('/auth/register')}
                    className="inline-block bg-pt-turquoise text-white px-8 py-3 rounded-lg font-semibold hover:bg-pt-turquoise/90 transition-colors"
                    onClick={() => setModalOpen(false)}
                  >
                    Continue to Registration
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Hero
