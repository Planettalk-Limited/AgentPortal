'use client'

import { useTranslations, useMessages } from 'next-intl'

const About = () => {
  const t = useTranslations('about')
  const messages = useMessages()
  
  // Get about messages with array support
  const aboutMessages = messages.about as any
  
  return (
    <section id="about" className="py-24 bg-white">
      <div className="container">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-pt-dark-gray mb-6">
              {t('title')}
            </h2>
            <p className="text-xl text-pt-light-gray mb-12 leading-relaxed">
              {t('subtitle')}
            </p>
          </div>
          
          {/* Detailed Process Flow */}
          <div className="space-y-12">
            {/* Registration */}
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="lg:w-1/3">
                <div className="w-20 h-20 bg-pt-turquoise rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-pt-dark-gray mb-2">{t('steps.registration.title')}</h3>
                <p className="text-pt-light-gray">{t('steps.registration.description')}</p>
              </div>
              <div className="lg:w-2/3 bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <ul className="space-y-3">
                  {aboutMessages.steps.registration.items.map((item: string, index: number) => (
                    <li key={index} className="flex items-center text-pt-dark-gray">
                      <svg className="w-5 h-5 text-pt-turquoise mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Approval */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
              <div className="lg:w-1/3">
                <div className="w-20 h-20 bg-pt-turquoise rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-pt-dark-gray mb-2">{t('steps.approval.title')}</h3>
                <p className="text-pt-light-gray">{t('steps.approval.description')}</p>
              </div>
              <div className="lg:w-2/3 bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <ul className="space-y-3">
                  {aboutMessages.steps.approval.items.map((item: string, index: number) => (
                    <li key={index} className="flex items-center text-pt-dark-gray">
                      <svg className="w-5 h-5 text-pt-turquoise mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Portal Access */}
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="lg:w-1/3">
                <div className="w-20 h-20 bg-pt-turquoise rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-pt-dark-gray mb-2">{t('steps.portal.title')}</h3>
                <p className="text-pt-light-gray">{t('steps.portal.description')}</p>
              </div>
              <div className="lg:w-2/3 bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <ul className="space-y-3">
                  {aboutMessages.steps.portal.items.map((item: string, index: number) => (
                    <li key={index} className="flex items-center text-pt-dark-gray">
                      <svg className="w-5 h-5 text-pt-turquoise mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-16 bg-gradient-to-br from-pt-turquoise to-pt-turquoise-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-semibold mb-8">{t('stats.title')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold mb-2">2,500+</div>
                <div className="text-white/80 text-sm">Active Agents</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">45+</div>
                <div className="text-white/80 text-sm">Countries</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">$2.5M+</div>
                <div className="text-white/80 text-sm">Earnings Paid</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-white/80 text-sm">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
