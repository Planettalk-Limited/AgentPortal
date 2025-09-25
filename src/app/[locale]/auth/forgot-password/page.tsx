'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { api, ApiError } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('auth.forgotPassword')
  const locale = useLocale()

  // Helper function to create locale-aware links
  const createLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await api.auth.forgotPassword({ email })
      setSuccess(true)
    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-pt-dark-gray mb-3">{t('success.title')}</h1>
        <p className="text-pt-light-gray mb-6">
          {t('success.message', { email })}
        </p>
        <p className="text-sm text-pt-light-gray mb-8">
          {t('success.note')}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => {
              setSuccess(false)
              setEmail('')
            }}
            className="w-full bg-pt-turquoise text-white py-3 px-4 rounded-lg font-semibold hover:bg-pt-turquoise-600 transition-colors duration-200"
          >
            {t('success.tryAgain')}
          </button>
          <Link
            href={createLocalizedPath('/auth/login')}
            className="block w-full text-center py-3 px-4 text-pt-turquoise hover:text-pt-turquoise-600 font-medium transition-colors duration-200"
          >
            {t('backToSignIn')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-pt-dark-gray mb-2">{t('title')}</h1>
        <p className="text-pt-light-gray">
          {t('subtitle')}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-pt-dark-gray mb-2">
            {t('email')}
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-colors duration-200"
            placeholder="agent@example.com"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pt-turquoise text-white py-3 px-4 rounded-lg font-semibold hover:bg-pt-turquoise-600 focus:ring-2 focus:ring-pt-turquoise focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('sending')}
            </div>
          ) : (
            t('sendReset')
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <Link 
          href={createLocalizedPath('/auth/login')} 
          className="text-pt-turquoise hover:text-pt-turquoise-600 font-medium transition-colors duration-200 flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('backToSignIn')}
        </Link>
      </div>
    </div>
  )
}
