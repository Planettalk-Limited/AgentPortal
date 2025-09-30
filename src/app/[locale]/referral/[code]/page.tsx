'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { api, PublicReferralResponse, PublicUseReferralCodeRequest } from '@/lib/api'
import Link from 'next/link'
import PlanetTalkLogo from '@/components/PlanetTalkLogo'
import PhoneNumberInput from '@/components/PhoneNumberInput'
import Head from 'next/head'

export default function ReferralPage() {
  const { code } = useParams<{ code: string }>()
  const locale = useLocale()
  const t = useTranslations('referral')

  const [referralData, setReferralData] = useState<PublicReferralResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
  })

  useEffect(() => {
    const fetchReferralData = async () => {
      if (!code) return

      try {
        setLoading(true)
        setError(null)
        const data = await api.agent.getPublicReferralData(code)
        setReferralData(data)
        if (!data.valid) {
          setError(data.message || t('invalidMessage'))
        }
      } catch (err) {
        console.error('Failed to fetch referral data:', err)
        setError(t('invalidMessage'))
      } finally {
        setLoading(false)
      }
    }

    fetchReferralData()
  }, [code, t])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!referralData?.valid || !code || !formData.fullName.trim() || !formData.phoneNumber.trim()) {
      return
    }

    setFormLoading(true)
    setError(null)

    try {
      // Submit referral usage using the public endpoint
      await api.agent.usePublicReferralCode(code, {
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim()
      })
      
      setSubmitted(true)
      
      // Redirect to PlanetTalk after a short delay
      setTimeout(() => {
        window.location.href = `https://planettalk.com/${locale}`
      }, 2000)
      
    } catch (err: any) {
      console.error('Failed to use referral code:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pt-turquoise-50 to-pt-light-gray-50 flex items-center justify-center px-4">
        <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pt-turquoise mx-auto mb-4"></div>
          <p className="text-pt-dark-gray">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !referralData?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pt-turquoise-50 to-pt-light-gray-50 flex items-center justify-center px-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-pt-dark-gray mb-2">{t('invalidCode')}</h2>
          <p className="text-pt-light-gray mb-6">{error}</p>
          <Link 
            href={`https://planettalk.com/${locale}`}
            className="inline-flex items-center px-6 py-3 bg-pt-turquoise text-white font-medium rounded-lg hover:bg-pt-turquoise-600 transition-colors"
          >
            {t('visitPlanetTalk')}
          </Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pt-turquoise-50 to-pt-light-gray-50 flex items-center justify-center px-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-auto">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-pt-dark-gray mb-2">Perfect! 🎉</h2>
          <p className="text-pt-light-gray mb-6">
            You&apos;re all set! Taking you to PlanetTalk now to get your amazing airtime savings...
          </p>
          <div className="animate-pulse">
            <div className="h-2 bg-pt-turquoise-200 rounded-full">
              <div className="h-2 bg-pt-turquoise rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{width: '70%'}}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { agent, program, personalizedMessage, codeDetails } = referralData

  // Generate metadata for link previews
  const pageTitle = "PlanetTalk - Best Rates for International Airtime Top-ups"
  const pageDescription = personalizedMessage || `Get the best rates for international airtime top-ups with PlanetTalk. ${agent?.fullName ? `Recommended by ${agent.fullName} - ` : ''}Save money on every top-up!`
  const pageUrl = `https://portal.planettalk.com/${locale}/referral/${code}`

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content="https://portal.planettalk.com/icon-512x512.png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:site_name" content="PlanetTalk Agent Portal" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:url" content={pageUrl} />
        <meta property="twitter:title" content={pageTitle} />
        <meta property="twitter:description" content={pageDescription} />
        <meta property="twitter:image" content="https://portal.planettalk.com/icon-512x512.png" />
        
        {/* Additional metadata */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={pageUrl} />
      </Head>
    <div className="min-h-screen bg-gradient-to-br from-pt-turquoise-50 to-pt-light-gray-50">
      {/* Header */}
      <div className="px-4 py-6 sm:px-6">
        <div className="max-w-4xl mx-auto flex justify-center">
          <Link href={`https://planettalk.com/${locale}`} className="flex items-center space-x-3">
            <PlanetTalkLogo className="h-8 w-auto" />
          </Link>
        </div>
      </div>

      <div className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-pt-turquoise to-pt-turquoise-600 px-8 py-12 text-white text-center">
              <div className="max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">👋</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                  Hello! Welcome to PlanetTalk
                </h1>
                <p className="text-xl text-pt-turquoise-100 mb-6">
                  {agent?.firstName} {agent?.lastName} recommended us to you because we offer the best rates for international airtime top-ups
                </p>
                <div className="bg-white bg-opacity-15 rounded-xl p-4 max-w-md mx-auto">
                  <p className="text-sm text-pt-turquoise-100 mb-2">
                    🎉 You&apos;re just one step away from amazing savings!
                  </p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="px-8 py-12">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-pt-dark-gray mb-3">
                    Almost there! Just 2 quick details
                  </h2>
                  <p className="text-pt-light-gray mb-4">
                    We&apos;ll take you straight to PlanetTalk after this to complete your airtime top-up
                  </p>
                  <div className="bg-pt-turquoise-50 border border-pt-turquoise-200 rounded-lg p-4 text-left">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-pt-turquoise rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-pt-turquoise-700 mb-1">
                          🔒 Your information is safe
                        </p>
                        <p className="text-xs text-pt-turquoise-600">
                          We only use this to set up your account and will never share it with anyone else
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-pt-dark-gray mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      id="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-pt-light-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pt-turquoise focus:border-transparent text-pt-dark-gray"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <PhoneNumberInput
                    label="Phone Number"
                    value={formData.phoneNumber}
                    onChange={(fullPhoneNumber) => {
                      setFormData((prev) => ({ ...prev, phoneNumber: fullPhoneNumber }))
                    }}
                    required
                    placeholder="771234567"
                    showFullNumber={true}
                  />

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formLoading || !formData.fullName.trim() || !formData.phoneNumber.trim()}
                    className="w-full bg-pt-turquoise text-white font-medium py-4 px-6 rounded-lg hover:bg-pt-turquoise-600 focus:outline-none focus:ring-2 focus:ring-pt-turquoise focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-lg"
                  >
                    {formLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Getting you ready...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span>Continue to Amazing Savings</span>
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    )}
                  </button>
                  
                  <div className="text-center">
                    <p className="text-xs text-pt-light-gray">
                      By continuing, you agree to PlanetTalk&apos;s terms and privacy policy
                    </p>
                  </div>
                </form>

                {/* What happens next */}
                <div className="mt-12 bg-gradient-to-r from-pt-turquoise-50 to-blue-50 rounded-xl p-6 border border-pt-turquoise-100">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-pt-turquoise rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white text-xl">✨</span>
                    </div>
                    <h3 className="font-semibold text-pt-dark-gray mb-2">
                      What happens next?
                    </h3>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-pt-turquoise text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                      <p className="text-pt-turquoise-700">
                        <span className="font-medium">We&apos;ll redirect you to PlanetTalk</span> - our secure platform for airtime top-ups
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-pt-turquoise text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                      <p className="text-pt-turquoise-700">
                        <span className="font-medium">Choose your top-up amount</span> - any amount you want to add to your phone
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-pt-turquoise text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                      <p className="text-pt-turquoise-700">
                        <span className="font-medium">Get instant airtime</span> - delivered directly to your phone number
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-pt-turquoise-200">
                      <p className="text-center text-xs text-pt-turquoise-600">
                        💝 <strong>Special:</strong> You&apos;ll get the best rates because {agent?.firstName} recommended you!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
    </>
  )
}