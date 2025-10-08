'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginStep, setLoginStep] = useState<'password' | '2fa'>('password')
  const [userEmail, setUserEmail] = useState('')
  const { login, verify2FA, loading, error, clearError, isAuthenticated } = useAuth()
  const router = useRouter()
  const t = useTranslations('auth.login')
  const locale = useLocale()

  // Helper function to create locale-aware links
  const createLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(createLocalizedPath('/dashboard'))
    }
  }, [isAuthenticated, router, locale])

  // Clear error when form data changes
  useEffect(() => {
    if (error) {
      clearError()
    }
  }, [formData.email, formData.password, twoFactorCode])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      const result = await login(formData.email, formData.password)
      
      // Check if email verification is required
      if (result.requiresEmailVerification) {
        // Redirect to email verification page with email pre-filled
        router.push(`/${locale}/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
        return
      }
      
      // Check if 2FA is required
      if (result.requires2FA) {
        setUserEmail(result.email || formData.email)
        setLoginStep('2fa')
        return
      }
      
      // If no 2FA or email verification required, navigation is handled by the auth context
    } catch (error) {
      // Error is handled by the auth context
      // Login failed
    }
  }

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      await verify2FA(userEmail, twoFactorCode)
      // Navigation is handled by the auth context
    } catch (error) {
      // Error is handled by the auth context
      // 2FA verification failed
    }
  }

  const handleBackToPassword = () => {
    setLoginStep('password')
    setTwoFactorCode('')
    clearError()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-pt-turquoise/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-pt-dark-gray mb-2">{t('title')}</h1>
        <p className="text-pt-light-gray">{t('subtitle')}</p>
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

      {/* Login Forms */}
      {loginStep === 'password' ? (
        /* Password Login Form */
        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-pt-dark-gray mb-2">
              {t('email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200 text-lg bg-gray-50 focus:bg-white"
              placeholder="agent@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-pt-dark-gray mb-2">
              {t('password')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-5 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200 text-lg bg-gray-50 focus:bg-white"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-pt-light-gray hover:text-pt-dark-gray"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-pt-turquoise focus:ring-pt-turquoise border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-pt-dark-gray">
                {t('rememberMe')}
              </label>
            </div>

            <div className="text-sm">
              <Link 
                href={createLocalizedPath('/auth/forgot-password')} 
                className="text-pt-turquoise hover:text-pt-turquoise-600 font-medium transition-colors duration-200"
              >
                {t('forgotPassword')}
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pt-turquoise text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-pt-turquoise-600 hover:shadow-lg focus:ring-2 focus:ring-pt-turquoise focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('signingIn')}
              </div>
            ) : (
              t('signIn')
            )}
          </button>
        </form>
      ) : (
        /* 2FA Verification Form */
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-pt-turquoise/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-pt-dark-gray mb-2">Two-Factor Authentication</h2>
            <p className="text-pt-light-gray">
              Please enter the 6-digit verification code from your authenticator app
            </p>
            <p className="text-sm text-pt-light-gray mt-2">
              Signed in as: <span className="font-medium">{userEmail}</span>
            </p>
          </div>

          <form onSubmit={handle2FASubmit} className="space-y-6">
            <div>
              <label htmlFor="twoFactorCode" className="block text-sm font-medium text-pt-dark-gray mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="twoFactorCode"
                name="twoFactorCode"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-all duration-200 text-lg bg-gray-50 focus:bg-white text-center tracking-widest font-mono"
                placeholder="123456"
                maxLength={6}
                required
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-xs text-pt-light-gray mt-2">
                Enter the 6-digit code from Google Authenticator, Authy, or similar app
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || twoFactorCode.length !== 6}
              className="w-full bg-pt-turquoise text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-pt-turquoise-600 hover:shadow-lg focus:ring-2 focus:ring-pt-turquoise focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </div>
              ) : (
                'Verify & Sign In'
              )}
            </button>

            <button
              type="button"
              onClick={handleBackToPassword}
              className="w-full text-pt-turquoise hover:text-pt-turquoise-600 font-medium transition-colors duration-200 py-2"
            >
              ← Back to Password
            </button>
          </form>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-sm text-pt-light-gray">
          {t('noAccount')}{' '}
          <Link 
            href={createLocalizedPath('/auth/register')} 
            className="text-pt-turquoise hover:text-pt-turquoise-600 font-medium transition-colors duration-200"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  )
}
