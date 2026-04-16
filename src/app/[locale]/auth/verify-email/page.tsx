'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { api } from '@/lib/api'
import Link from 'next/link'

function VerifyEmailContent() {
  const [verificationCode, setVerificationCode] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [requiresPartnerApproval, setRequiresPartnerApproval] = useState(false)
  const [meetingBookingUrl, setMeetingBookingUrl] = useState<string | null>(null)
  const [partnerType, setPartnerType] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const locale = useLocale()
  const t = useTranslations('auth.verifyEmail')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) setEmail(emailParam)

    const ptParam = searchParams.get('partnerType')
    if (ptParam) setPartnerType(ptParam)

    const meetingUrl = searchParams.get('meetingBookingUrl')
    if (meetingUrl) setMeetingBookingUrl(meetingUrl)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !verificationCode) {
      setError(t('allFieldsRequired'))
      return
    }
    if (verificationCode.length !== 6) {
      setError(t('codeLength'))
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await api.auth.verifyEmail({
        email: email.trim(),
        code: verificationCode.trim()
      })

      if (response.success) {
        setSuccess(true)
        if (response.requiresPartnerApproval) {
          setRequiresPartnerApproval(true)
        }
        if (response.meetingBookingUrl) {
          setMeetingBookingUrl(response.meetingBookingUrl)
        }
      } else {
        setError(response.message || t('verificationFailed'))
      }
    } catch (error: any) {
      setError(error.message || t('verificationFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!email) {
      setError(t('emailRequired'))
      return
    }

    try {
      setResendLoading(true)
      setResendMessage(null)
      setError(null)
      
      const response = await api.auth.resendVerificationCode(email.trim())
      if (response.success) {
        setResendMessage(t('resendSuccess'))
        setTimeout(() => setResendMessage(null), 5000)
      } else {
        setError(response.message || t('resendFailed'))
      }
    } catch (error: any) {
      setError(error.message || t('resendFailed'))
    } finally {
      setResendLoading(false)
    }
  }

  const createLocalizedPath = (path: string) => `/${locale}${path}`

  // ── Success: Business partner awaiting approval ──
  // Only show this screen when the API explicitly says approval is still needed.
  // partnerType query param alone is not enough — an already-approved partner
  // verifying a stale OTP must land on the generic success screen instead.
  if (success && requiresPartnerApproval) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-pt-dark-gray mb-2">Email Verified!</h1>
        <p className="text-pt-light-gray mb-6">
          Your business partner application is now awaiting administrator approval. 
          You&apos;ll receive an email once your account is active.
        </p>

        {/* Meeting booked confirmation */}
        <div className="mb-6 flex items-center px-5 py-4 bg-green-50 border border-green-200 rounded-xl text-left">
          <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Onboarding meeting scheduled</p>
            <p className="text-xs text-green-600">Our team will reach out at the booked time.</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">What happens next</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-700">Email verified</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
              <p className="text-sm text-gray-700">Application under review by our team</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <p className="text-sm text-gray-500">Custom partner code assigned & account activated</p>
            </div>
          </div>
        </div>

        <Link
          href={createLocalizedPath('/auth/login')}
          className="inline-block w-full bg-pt-turquoise text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:bg-pt-turquoise-600 transition-all duration-200 text-center"
        >
          Back to Login
        </Link>
      </div>
    )
  }

  // ── Success: Individual partner (active) ──
  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-pt-dark-gray mb-4">{t('success.title')}</h1>
        <p className="text-pt-light-gray mb-8">{t('success.message')}</p>
        <Link
          href={createLocalizedPath('/auth/login')}
          className="inline-block w-full bg-pt-turquoise text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:bg-pt-turquoise-600 hover:shadow-lg focus:ring-2 focus:ring-pt-turquoise focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] text-center"
        >
          Go to Login
        </Link>
      </div>
    )
  }

  // ── Verification Form ──
  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-pt-turquoise/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-pt-dark-gray mb-2">{t('title')}</h1>
        <p className="text-pt-light-gray">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-pt-dark-gray mb-2">
            {t('emailLabel')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-pt-light-gray-300 rounded-2xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200"
            placeholder={t('emailPlaceholder')}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-pt-dark-gray mb-2">
            {t('codeLabel')}
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-3 border-2 border-pt-light-gray-300 rounded-2xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200 text-center text-2xl font-mono tracking-widest"
            placeholder="123456"
            maxLength={6}
            required
          />
          <p className="text-xs text-pt-light-gray mt-1">{t('codeHint')}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {resendMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 text-sm">{resendMessage}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pt-turquoise text-white py-4 px-6 rounded-2xl hover:bg-pt-turquoise-600 disabled:bg-pt-turquoise/50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg"
        >
          {loading ? t('verifying') : t('verifyButton')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-pt-light-gray text-sm mb-3">{t('didntReceive')}</p>
        <button
          onClick={handleResendCode}
          disabled={resendLoading}
          className="text-pt-turquoise hover:text-pt-turquoise-600 font-medium text-sm disabled:text-pt-turquoise/50 disabled:cursor-not-allowed transition-colors"
        >
          {resendLoading ? t('resending') : t('resendCode')}
        </button>
      </div>

      <div className="mt-8 text-center">
        <Link 
          href={createLocalizedPath('/auth/login')}
          className="text-pt-light-gray hover:text-pt-dark-gray text-sm transition-colors"
        >
          {t('backToLogin')}
        </Link>
      </div>
    </div>
  )
}

function VerifyEmailLoading() {
  const t = useTranslations('auth.verifyEmail')
  
  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-pt-turquoise/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-pt-dark-gray mb-2">{t('title')}</h1>
        <p className="text-pt-light-gray">{t('subtitle')}</p>
      </div>
      <div className="space-y-6">
        <div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-12 bg-gray-200 rounded-2xl"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-12 bg-gray-200 rounded-2xl"></div>
        </div>
        <div className="h-14 bg-gray-200 rounded-2xl"></div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
