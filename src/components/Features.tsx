'use client'

import Link from 'next/link'
import { useTranslations, useLocale, useMessages } from 'next-intl'

const Features = () => {
  const t = useTranslations('features')
  const locale = useLocale()
  const messages = useMessages()
  
  // Get features messages with array support
  const featuresMessages = messages.features as any

  // Helper function to create locale-aware links
  const createLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }
  const features = [
    {
      title: t('items.agentCode.title'),
      description: t('items.agentCode.description'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      benefits: featuresMessages.items.agentCode.benefits
    },
    {
      title: t('items.tracking.title'),
      description: t('items.tracking.description'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      benefits: featuresMessages.items.tracking.benefits
    },
    {
      title: t('items.earnings.title'),
      description: t('items.earnings.description'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      benefits: featuresMessages.items.earnings.benefits
    },
    {
      title: t('items.training.title'),
      description: t('items.training.description'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      benefits: featuresMessages.items.training.benefits
    },
    {
      title: t('items.announcements.title'),
      description: t('items.announcements.description'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      benefits: featuresMessages.items.announcements.benefits
    },
    {
      title: t('items.checklist.title'),
      description: t('items.checklist.description'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      benefits: featuresMessages.items.checklist.benefits
    }
  ]

  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-pt-dark-gray mb-6">
            {t('title')}
          </h2>
          <p className="text-xl text-pt-light-gray max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card card-hover">
              <div className="w-16 h-16 bg-pt-turquoise/10 rounded-full flex items-center justify-center mb-6 text-pt-turquoise">
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-semibold text-pt-dark-gray mb-4">
                {feature.title}
              </h3>
              
              <p className="text-pt-light-gray mb-6">
                {feature.description}
              </p>
              
              <ul className="space-y-3">
                {Array.isArray(feature.benefits) && feature.benefits.map((benefit: string, benefitIndex: number) => (
                  <li key={benefitIndex} className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-pt-turquoise rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-pt-dark-gray text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-16">
          <Link 
            href={createLocalizedPath('/auth/apply')}
            className="inline-block bg-pt-turquoise text-white text-lg px-8 py-4 rounded-lg font-semibold hover:bg-pt-turquoise-600 transition-colors duration-200"
          >
            {t('cta')}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Features
