'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

export default function TermsAndConditionsPage() {
  const locale = useLocale()
  const t = useTranslations('termsPage')
  
  const createLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Page Content - with padding for fixed header */}
      <div className="pt-[80px] lg:pt-[100px]">
        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="container py-4">
            <nav className="flex items-center text-sm text-gray-600">
              <Link 
                href={createLocalizedPath('/')} 
                className="hover:text-pt-turquoise transition-colors"
              >
                {t('breadcrumb.home')}
              </Link>
              <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="container py-6 sm:py-8 lg:py-12">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
              {t('header.title')}
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              {t('header.subtitle')}
            </p>
          </div>

          {/* PDF Viewer Card */}
          <div className="card shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-pt-turquoise/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{t('document.title')}</h2>
                  <p className="text-sm text-gray-500">{t('document.format')}</p>
                </div>
              </div>
              
              <a 
                href="/terms-and-conditions.pdf" 
                download
                className="hidden sm:inline-flex items-center px-4 py-2 bg-pt-turquoise text-white rounded-lg hover:bg-pt-turquoise/90 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('download')}
              </a>
            </div>

            {/* PDF Embed */}
            <div className="pdf-container bg-gray-100 rounded-lg overflow-hidden relative">
              <object
                data="/terms-and-conditions.pdf"
                type="application/pdf"
                className="pdf-object"
              >
                <p className="p-8 text-center text-gray-600">
                  {t('fallback.noSupport')} {t('fallback.pleaseDownload')}
                </p>
              </object>
              
              {/* Fallback message for browsers that don't support PDF viewing */}
              <noscript>
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-8">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      {t('fallback.noSupport')}
                    </p>
                    <a 
                      href="/terms-and-conditions.pdf" 
                      className="inline-flex items-center px-6 py-3 bg-pt-turquoise text-white rounded-lg hover:bg-pt-turquoise/90 transition-colors font-medium"
                      download
                    >
                      {t('download')}
                    </a>
                  </div>
                </div>
              </noscript>
            </div>
          </div>

          {/* Mobile Download Button */}
          <div className="sm:hidden mt-6">
            <a 
              href="/terms-and-conditions.pdf" 
              download
              className="flex items-center justify-center w-full px-4 py-3 bg-pt-turquoise text-white rounded-lg hover:bg-pt-turquoise/90 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('download')}
            </a>
          </div>

          {/* Help Section */}
          <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{t('help.title')}</h3>
                <p className="text-gray-600 text-sm mb-3">
                  {t('help.description')}
                </p>
                <a 
                  href={`mailto:${t('help.email')}`}
                  className="inline-flex items-center text-pt-turquoise hover:text-pt-turquoise/80 font-medium text-sm transition-colors"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t('help.email')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
      
      <style jsx>{`
        .pdf-container {
          width: 100%;
          height: 600px;
          min-height: 400px;
          position: relative;
        }
        
        .pdf-object {
          width: 100%;
          height: 100%;
        }
        
        .pdf-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        
        /* Mobile optimization */
        @media (max-width: 640px) {
          .pdf-container {
            height: 500px;
            min-height: 400px;
          }
        }
        
        /* Tablet */
        @media (min-width: 641px) and (max-width: 1023px) {
          .pdf-container {
            height: 700px;
          }
        }
        
        /* Desktop */
        @media (min-width: 1024px) {
          .pdf-container {
            height: 800px;
          }
        }
      `}</style>
    </main>
  )
}
