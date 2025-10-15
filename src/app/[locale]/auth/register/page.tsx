'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import CountryPicker from '@/components/CountryPicker'
import PhoneNumberInput from '@/components/PhoneNumberInput'
import { createLocalizedPath } from '@/lib/utils/navigation'

// Mapping from country codes to phone codes
const countryToPhoneCodeMap: Record<string, string> = {
  'US': '+1', 'CA': '+1', 'GB': '+44', 'AU': '+61', 'DE': '+49', 'FR': '+33', 'IT': '+39', 'ES': '+34',
  'NL': '+31', 'BE': '+32', 'CH': '+41', 'AT': '+43', 'SE': '+46', 'NO': '+47', 'DK': '+45', 'FI': '+358',
  'IE': '+353', 'PT': '+351', 'GR': '+30', 'PL': '+48', 'CZ': '+420', 'HU': '+36', 'RO': '+40',
  'BG': '+359', 'HR': '+385', 'SI': '+386', 'SK': '+421', 'LT': '+370', 'LV': '+371', 'EE': '+372',
  'RU': '+7', 'CN': '+86', 'JP': '+81', 'KR': '+82', 'IN': '+91', 'PK': '+92', 'BD': '+880', 'LK': '+94',
  'TH': '+66', 'VN': '+84', 'MY': '+60', 'SG': '+65', 'ID': '+62', 'PH': '+63', 'TW': '+886', 'HK': '+852',
  'MO': '+853', 'BR': '+55', 'AR': '+54', 'CL': '+56', 'CO': '+57', 'PE': '+51', 'VE': '+58', 'UY': '+598',
  'PY': '+595', 'BO': '+591', 'EC': '+593', 'GY': '+592', 'SR': '+597', 'MX': '+52', 'GT': '+502',
  'BZ': '+501', 'SV': '+503', 'HN': '+504', 'NI': '+505', 'CR': '+506', 'PA': '+507', 'CU': '+53',
  'JM': '+1876', 'HT': '+509', 'DO': '+1849', 'PR': '+1939', 'TT': '+1868', 'BB': '+1246', 'GD': '+1473',
  'LC': '+1758', 'VC': '+1784', 'AG': '+1268', 'DM': '+1767', 'KN': '+1869', 'EG': '+20', 'LY': '+218',
  'SD': '+249', 'TN': '+216', 'DZ': '+213', 'MA': '+212', 'ZA': '+27', 'ZW': '+263', 'ZM': '+260',
  'MW': '+265', 'MZ': '+258', 'MG': '+261', 'MU': '+230', 'RE': '+262', 'YT': '+262', 'KM': '+269',
  'SC': '+248', 'KE': '+254', 'UG': '+256', 'TZ': '+255', 'RW': '+250', 'BI': '+257', 'DJ': '+253',
  'SO': '+252', 'ET': '+251', 'ER': '+291', 'SS': '+211', 'NG': '+234', 'GH': '+233', 'CI': '+225',
  'BF': '+226', 'ML': '+223', 'NE': '+227', 'TD': '+235', 'SN': '+221', 'GM': '+220', 'GW': '+245',
  'GN': '+224', 'SL': '+232', 'LR': '+231', 'BJ': '+229', 'TG': '+228', 'GA': '+241', 'GQ': '+240',
  'CM': '+237', 'CF': '+236', 'CG': '+242', 'CD': '+243', 'AO': '+244', 'NA': '+264', 'BW': '+267',
  'LS': '+266', 'SZ': '+268', 'TR': '+90', 'GE': '+995', 'AM': '+374', 'AZ': '+994', 'BY': '+375',
  'UA': '+380', 'MD': '+373', 'IL': '+972', 'PS': '+970', 'JO': '+962', 'LB': '+961', 'SY': '+963',
  'IQ': '+964', 'KW': '+965', 'SA': '+966', 'YE': '+967', 'OM': '+968', 'AE': '+971', 'QA': '+974',
  'BH': '+973', 'IR': '+98', 'AF': '+93', 'UZ': '+998', 'TM': '+993', 'TJ': '+992', 'KG': '+996',
  'KZ': '+7', 'MN': '+976', 'NP': '+977', 'BT': '+975', 'MM': '+95', 'LA': '+856', 'KH': '+855',
  'FJ': '+679', 'NC': '+687', 'PF': '+689', 'TO': '+676', 'WS': '+685', 'KI': '+686', 'TV': '+688',
  'NR': '+674', 'PW': '+680', 'FM': '+691', 'MH': '+692', 'PG': '+675', 'SB': '+677', 'VU': '+678',
  'NU': '+683', 'CK': '+682', 'TK': '+690', 'AS': '+1684', 'GU': '+1671', 'MP': '+1670'
}

interface FormData {
  firstName: string
  lastName: string
  country: string
  email: string
  phoneNumber: string
  password: string
  confirmPassword: string
  acceptAgentProgram: boolean
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    country: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    acceptAgentProgram: false
  })
  const [phoneCountryCode, setPhoneCountryCode] = useState('+44') // Default to UK
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  const { register, loading, error, clearError } = useAuth()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('auth.register')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (error) {
      clearError()
    }
  }

  const handleCountryChange = (countryCode: string) => {
    setFormData(prev => ({ ...prev, country: countryCode }))
    
    // Automatically update phone country code when country changes
    const phoneCode = countryToPhoneCodeMap[countryCode]
    if (phoneCode) {
      setPhoneCountryCode(phoneCode)
      // Reset phone number to avoid confusion with old country code
      setFormData(prev => ({ ...prev, phoneNumber: '' }))
    }
    
    // Clear error when user makes changes
    if (error) {
      clearError()
    }
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      return t('validation.firstNameRequired')
    }
    if (!formData.lastName.trim()) {
      return t('validation.lastNameRequired')
    }
    if (!formData.country) {
      return t('validation.countryRequired')
    }
    if (!/^[A-Z]{2}$/.test(formData.country)) {
      return t('validation.countryInvalid')
    }
    if (!formData.email.trim()) {
      return t('validation.emailRequired')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return t('validation.emailInvalid')
    }
    if (!formData.password) {
      return t('validation.passwordRequired')
    }
    if (formData.password.length < 8) {
      return t('validation.passwordMinLength')
    }
    if (formData.password !== formData.confirmPassword) {
      return t('validation.passwordMismatch')
    }
    if (!formData.phoneNumber.trim()) {
      return t('validation.phoneRequired')
    }
    if (!/^\+[1-9]\d{1,14}$/.test(formData.phoneNumber)) {
      return t('validation.phoneInvalid')
    }
    if (!formData.acceptAgentProgram) {
      return t('validation.agentProgramRequired')
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      // You can set this as an error state if needed
      return
    }

    try {
      const result = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        country: formData.country,
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password
      })
      
      if (result.success) {
        // Redirect to email verification with the registered email
        router.push(`/${locale}/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
      }
    } catch (error) {
      // Error is handled by the auth context
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-pt-dark-gray mb-2">{t('success.title')}</h2>
          <p className="text-pt-light-gray mb-6">{successMessage}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">{t('success.subtitle')}</h3>
            <p className="text-blue-700 text-sm">
              {t('success.description')}
            </p>
          </div>
          <Link 
            href={createLocalizedPath('/auth/login', locale)}
            className="inline-flex items-center px-6 py-3 bg-pt-turquoise text-white font-medium rounded-lg hover:bg-pt-turquoise-600 transition-colors"
          >
            {t('success.loginButton')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8 md:mb-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-pt-dark-gray mb-2 sm:mb-3 md:mb-4">{t('title')}</h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-600">{t('subtitle')}</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-r-2xl mb-8 shadow-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* First Name - Full Width */}
        <div className="group">
          <label htmlFor="firstName" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
            {t('fields.firstName')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:border-pt-turquoise focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white text-base sm:text-lg"
            placeholder={t('placeholders.firstName')}
            required
          />
        </div>

        {/* Last Name - Full Width */}
        <div className="group">
          <label htmlFor="lastName" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
            {t('fields.lastName')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:border-pt-turquoise focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white text-base sm:text-lg"
            placeholder={t('placeholders.lastName')}
            required
          />
        </div>

        {/* Country - Full Width */}
        <div className="group">
          <label htmlFor="country" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
            {t('fields.country')} <span className="text-red-500">*</span>
          </label>
          <CountryPicker
            value={formData.country}
            onChange={handleCountryChange}
            placeholder={t('placeholders.country')}
            required
            error={!formData.country && error ? t('validation.countryRequired') : undefined}
          />
        </div>

        {/* Phone Number - Full Width */}
        <div className="group">
          <PhoneNumberInput
            label={t('fields.phone')}
            value={formData.phoneNumber}
            onChange={(phoneNumber) => setFormData(prev => ({ ...prev, phoneNumber }))}
            countryCode={phoneCountryCode}
            onCountryCodeChange={setPhoneCountryCode}
            required
            placeholder="7123456789"
            showFullNumber={false}
            className=""
          />
        </div>

        {/* Email - Full Width */}
        <div className="group">
          <label htmlFor="email" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
            {t('fields.email')} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:border-pt-turquoise focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white text-base sm:text-lg"
            placeholder={t('placeholders.email')}
            required
          />
        </div>

        {/* Password - Full Width */}
        <div className="group">
          <label htmlFor="password" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
            {t('fields.password')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 pr-12 sm:pr-14 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:border-pt-turquoise focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white text-base sm:text-lg"
              placeholder={t('placeholders.password')}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 sm:pr-5 flex items-center text-gray-400 hover:text-pt-turquoise transition-colors"
            >
              {showPassword ? (
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 flex items-center">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('passwordRequirement')}
          </p>
        </div>

        {/* Confirm Password - Full Width */}
        <div className="group">
          <label htmlFor="confirmPassword" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
            {t('fields.confirmPassword')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 pr-12 sm:pr-14 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:border-pt-turquoise focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white text-base sm:text-lg"
              placeholder={t('placeholders.confirmPassword')}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 sm:pr-5 flex items-center text-gray-400 hover:text-pt-turquoise transition-colors"
            >
              {showConfirmPassword ? (
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Agreement Section */}
        <div className="bg-gradient-to-r from-pt-turquoise to-teal-500 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 text-white mt-6 sm:mt-8 md:mt-10">
          <div className="flex items-start space-x-3 sm:space-x-4 md:space-x-5">
            <input
              type="checkbox"
              id="acceptAgentProgram"
              name="acceptAgentProgram"
              checked={formData.acceptAgentProgram}
              onChange={(e) => setFormData(prev => ({ ...prev, acceptAgentProgram: e.target.checked }))}
              className="w-5 h-5 sm:w-6 sm:h-6 text-pt-turquoise bg-white border-2 border-white rounded focus:ring-white focus:ring-2 mt-1"
              required
            />
            <div className="flex-1">
              <label htmlFor="acceptAgentProgram" className="text-white cursor-pointer">
                <span className="font-bold text-lg sm:text-xl">Agent Program Agreement</span>
                <span className="text-red-200 ml-1 sm:ml-2">*</span>
                <p className="text-white/90 mt-1 sm:mt-2 text-sm sm:text-base md:text-lg">
                  I agree to the{' '}
                  <a 
                    href="/terms-and-conditions.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline hover:text-gray-100 font-semibold decoration-2 underline-offset-2"
                  >
                    Agent Program Terms & Conditions
                  </a>
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 sm:mt-10 md:mt-12">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pt-turquoise to-teal-500 text-white py-4 sm:py-5 md:py-6 px-6 sm:px-7 md:px-8 rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl shadow-2xl hover:shadow-3xl hover:from-pt-turquoise-600 hover:to-teal-600 focus:outline-none focus:ring-4 focus:ring-pt-turquoise/30 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-7 sm:w-7 border-b-3 border-white mr-3 sm:mr-4"></div>
                <span className="text-lg sm:text-xl font-bold">{t('submitting')}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 mr-3 sm:mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('submit')}
              </div>
            )}
          </button>
        </div>

        {/* Login Link */}
        <div className="text-center pt-6 sm:pt-8 pb-6 sm:pb-8 md:pb-10">
          <p className="text-base sm:text-lg text-gray-600">
            {t('alreadyHaveAccount')}{' '}
            <Link 
              href={createLocalizedPath('/auth/login', locale)} 
              className="text-pt-turquoise hover:text-pt-turquoise-600 font-bold underline decoration-2 underline-offset-4 hover:decoration-pt-turquoise-600 transition-colors"
            >
              {t('signInLink')}
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
