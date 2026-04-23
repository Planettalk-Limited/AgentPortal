'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { validatePassword } from '@/lib/passwordValidation'
import CountryPicker from '@/components/CountryPicker'
import PhoneNumberInput from '@/components/PhoneNumberInput'
import { createLocalizedPath } from '@/lib/utils/navigation'
import MeetingBookingModal from '@/components/MeetingBookingModal'
import Toast from '@/components/Toast'
import {
  BUSINESS_PARTNER_PRESENCE_COUNTRIES,
  isBusinessPartnerPresenceCountry,
} from '@/lib/constants/presenceCountries'

const MEETING_BOOKING_URL = process.env.NEXT_PUBLIC_PARTNER_MEETING_BOOKING_URL || 'https://calendar.app.google/4qT4xSicq7ZQqsvMA'

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

type PartnerType = 'individual' | 'business' | null

interface FormData {
  firstName: string
  lastName: string
  country: string
  email: string
  phoneNumber: string
  password: string
  confirmPassword: string
  acceptPartnerProgram: boolean
  companyName: string
  businessAddress: string
  primaryBusinessActivity: string
  primarySpecialty: string
  customerInteractionType: string
  sellsInternationalGoods: boolean
}

function RegisterPageContent() {
  const [partnerType, setPartnerType] = useState<PartnerType>(null)
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    country: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    acceptPartnerProgram: false,
    companyName: '',
    businessAddress: '',
    primaryBusinessActivity: '',
    primarySpecialty: '',
    customerInteractionType: '',
    sellsInternationalGoods: false
  })
  const [phoneCountryCode, setPhoneCountryCode] = useState('+44')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [meetingBooked, setMeetingBooked] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null)
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'downloaded'>('idle')
  const [isIOS, setIsIOS] = useState(false)
  
  const { register, loading, error, clearError } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const t = useTranslations('auth.register')
  const tTerms = useTranslations('termsPage')

  useEffect(() => {
    const typeParam = searchParams.get('type')
    if (typeParam === 'individual' || typeParam === 'business') {
      setPartnerType(typeParam)
    }
  }, [searchParams])

  // When switching to the business partner flow, drop any previously selected
  // country that is outside PlanetTalk's supported markets so the user is
  // forced to pick a valid one from the restricted list.
  useEffect(() => {
    if (
      partnerType === 'business' &&
      formData.country &&
      !isBusinessPartnerPresenceCountry(formData.country)
    ) {
      setFormData(prev => ({ ...prev, country: '' }))
      setFieldErrors(prev => {
        const next = { ...prev }
        delete next.country
        return next
      })
    }
  }, [partnerType, formData.country])
  
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(iOS)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) clearError()
    if (fieldErrors[name]) setFieldErrors(prev => { const next = { ...prev }; delete next[name]; return next })
  }

  const handleCountryChange = (countryCode: string) => {
    setFormData(prev => ({ ...prev, country: countryCode }))
    const phoneCode = countryToPhoneCodeMap[countryCode]
    if (phoneCode) {
      setPhoneCountryCode(phoneCode)
      setFormData(prev => ({ ...prev, phoneNumber: '' }))
    }
    if (error) clearError()
  }

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!formData.firstName.trim()) errors.firstName = t('validation.firstNameRequired')
    if (!formData.lastName.trim()) errors.lastName = t('validation.lastNameRequired')
    if (!formData.country) errors.country = t('validation.countryRequired')
    else if (!/^[A-Z]{2}$/.test(formData.country)) errors.country = t('validation.countryInvalid')
    if (!formData.email.trim()) errors.email = t('validation.emailRequired')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = t('validation.emailInvalid')
    if (!formData.password) errors.password = t('validation.passwordRequired')
    else {
      const passwordValidation = validatePassword(formData.password)
      if (!passwordValidation.isValid) errors.password = t('validation.passwordRequirements')
    }
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) errors.confirmPassword = t('validation.passwordMismatch')
    else if (!formData.confirmPassword && formData.password) errors.confirmPassword = t('validation.passwordMismatch')
    if (!formData.phoneNumber.trim()) errors.phoneNumber = t('validation.phoneRequired')
    else if (!/^\+[1-9]\d{1,14}$/.test(formData.phoneNumber)) errors.phoneNumber = t('validation.phoneInvalid')
    if (!formData.acceptPartnerProgram) errors.acceptPartnerProgram = t('validation.partnerProgramRequired')

    if (partnerType === 'business') {
      if (formData.country && !isBusinessPartnerPresenceCountry(formData.country)) {
        errors.country = t('validation.countryNotSupported')
      }
      if (!formData.companyName.trim()) errors.companyName = t('validation.companyNameRequired')
      if (!formData.businessAddress.trim()) errors.businessAddress = t('validation.businessAddressRequired')
      if (!formData.primaryBusinessActivity) errors.primaryBusinessActivity = t('validation.primaryActivityRequired')
      if (!formData.primarySpecialty) errors.primarySpecialty = t('validation.primarySpecialtyRequired')
      if (!formData.customerInteractionType) errors.customerInteractionType = t('validation.customerInteractionRequired')
      if (!meetingBooked) errors.meeting = t('validation.meetingRequired')
    }
    return errors
  }

  const isFormComplete = (() => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) return false
    if (!formData.country || !formData.email.trim()) return false
    if (!formData.password || !formData.confirmPassword) return false
    if (!formData.phoneNumber.trim()) return false
    if (!formData.acceptPartnerProgram) return false
    if (partnerType === 'business') {
      if (!formData.companyName.trim() || !formData.businessAddress.trim()) return false
      if (!formData.primaryBusinessActivity || !formData.primarySpecialty) return false
      if (!formData.customerInteractionType || !meetingBooked) return false
    }
    return true
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setToast(null)
    const errors = validateForm()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setTimeout(() => {
        const firstErrorField = document.querySelector('[data-field-error="true"]')
        if (firstErrorField) firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      console.log('[Register] Validation failed:', errors)
      return
    }

    try {
      const payload: Record<string, string | boolean | undefined> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        country: formData.country,
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        partnerType: partnerType || 'individual'
      }

      if (partnerType === 'business') {
        payload.companyName = formData.companyName.trim()
        payload.businessAddress = formData.businessAddress.trim()
        payload.primaryBusinessActivity = formData.primaryBusinessActivity
        payload.primarySpecialty = formData.primarySpecialty
        payload.customerInteractionType = formData.customerInteractionType
        payload.sellsInternationalGoods = formData.sellsInternationalGoods
      }

      console.log('[Register] Submitting payload:', JSON.stringify(payload, null, 2))

      const result = await register(payload as any)
      console.log('[Register] Response:', JSON.stringify(result, null, 2))
      
      if (result.success) {
        const params = new URLSearchParams({ email: formData.email })
        if (partnerType === 'business') params.set('partnerType', 'business')
        if (result.meetingBookingUrl) params.set('meetingBookingUrl', result.meetingBookingUrl)
        router.push(`/${locale}/auth/verify-email?${params.toString()}`)
      }
    } catch (err: any) {
      const message = err?.error || err?.message || 'Registration failed. Please try again.'
      setToast({ message, type: 'error' })
    }
  }

  // ── Partner Type Selection Screen ──
  if (!partnerType) {
    return (
      <div className="w-full">
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-pt-dark-gray mb-3 sm:mb-4">
            {t('partnerTypeTitle')}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            {t('partnerTypeSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* Individual Partner Card */}
          <button
            onClick={() => setPartnerType('individual')}
            className="group relative bg-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8 text-left hover:border-pt-turquoise hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-pt-turquoise group-hover:bg-pt-turquoise transition-all duration-300 flex items-center justify-center">
              <svg className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pt-turquoise/10 to-teal-50 rounded-2xl flex items-center justify-center mb-5">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t('individualPartner')}</h3>
            <p className="text-gray-600 text-sm sm:text-base mb-4">{t('individualDescription')}</p>

            <ul className="space-y-2 text-sm text-gray-600">
              {(['instantCode', 'commissions', 'simpleSetup'] as const).map(key => (
                <li key={key} className="flex items-center">
                  <svg className="w-4 h-4 text-pt-turquoise mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {t(`individualBenefits.${key}`)}
                </li>
              ))}
            </ul>
          </button>

          {/* Business Partner Card */}
          <button
            onClick={() => setPartnerType('business')}
            className="group relative bg-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8 text-left hover:border-pt-turquoise hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <div className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-gray-300 group-hover:border-pt-turquoise group-hover:bg-pt-turquoise transition-all duration-300 flex items-center justify-center">
              <svg className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pt-turquoise/10 to-teal-50 rounded-2xl flex items-center justify-center mb-5">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-pt-turquoise-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t('businessPartner')}</h3>
            <p className="text-gray-600 text-sm sm:text-base mb-4">{t('businessDescription')}</p>

            <ul className="space-y-2 text-sm text-gray-600">
              {(['customCode', 'accountManagement', 'volumeTiers'] as const).map(key => (
                <li key={key} className="flex items-center">
                  <svg className="w-4 h-4 text-pt-turquoise mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {t(`businessBenefits.${key}`)}
                </li>
              ))}
            </ul>
          </button>
        </div>

        <div className="text-center pt-2 pb-4">
          <p className="text-base text-gray-600">
            {t('alreadyHaveAccount')}{' '}
            <Link 
              href={createLocalizedPath('/auth/login', locale)} 
              className="text-pt-turquoise hover:text-pt-turquoise-600 font-bold underline decoration-2 underline-offset-4 transition-colors"
            >
              {t('signInLink')}
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Registration Form ──
  return (
    <div className="w-full">
      {/* Back Button + Header */}
      <div className="mb-6 sm:mb-8">
        <button
          onClick={() => { setPartnerType(null); clearError(); setMeetingBooked(false) }}
          className="inline-flex items-center text-sm text-gray-500 hover:text-pt-turquoise transition-colors mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          {t('changePartnerType')}
        </button>

        <div className="text-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-3 ${
            partnerType === 'business' ? 'bg-pt-turquoise/10 text-pt-turquoise-700' : 'bg-pt-turquoise/10 text-pt-turquoise'
          }`}>
            {partnerType === 'business' ? t('businessPartner') : t('individualPartner')}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-pt-dark-gray mb-2 sm:mb-3">
            {t('title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">{t('subtitle')}</p>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Name Fields - side by side on larger screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="group" {...(fieldErrors.firstName ? {'data-field-error': 'true'} : {})}>
            <label htmlFor="firstName" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
              {t('fields.firstName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white text-base sm:text-lg ${fieldErrors.firstName ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-pt-turquoise'}`}
              placeholder={t('placeholders.firstName')}
            />
            {fieldErrors.firstName && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.firstName}</p>}
          </div>
          <div className="group" {...(fieldErrors.lastName ? {'data-field-error': 'true'} : {})}>
            <label htmlFor="lastName" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
              {t('fields.lastName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white text-base sm:text-lg ${fieldErrors.lastName ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-pt-turquoise'}`}
              placeholder={t('placeholders.lastName')}
            />
            {fieldErrors.lastName && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.lastName}</p>}
          </div>
        </div>

        {/* Business-specific fields */}
        {partnerType === 'business' && (
          <div className="bg-pt-turquoise/5 border-2 border-pt-turquoise/20 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            <h3 className="text-sm font-semibold text-pt-turquoise-700 uppercase tracking-wider">{t('business.sectionTitle')}</h3>
            
            <div className="group" {...(fieldErrors.companyName ? {'data-field-error': 'true'} : {})}>
              <label htmlFor="companyName" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
                {t('business.companyName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-0 transition-colors duration-200 bg-white text-base sm:text-lg ${fieldErrors.companyName ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-pt-turquoise'}`}
                placeholder={t('business.companyPlaceholder')}
              />
              {fieldErrors.companyName && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.companyName}</p>}
            </div>

            <div className="group" {...(fieldErrors.businessAddress ? {'data-field-error': 'true'} : {})}>
              <label htmlFor="businessAddress" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
                {t('business.businessAddress')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="businessAddress"
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleChange}
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-0 transition-colors duration-200 bg-white text-base sm:text-lg ${fieldErrors.businessAddress ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-pt-turquoise'}`}
                placeholder={t('business.addressPlaceholder')}
              />
              {fieldErrors.businessAddress && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.businessAddress}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="group" {...(fieldErrors.primaryBusinessActivity ? {'data-field-error': 'true'} : {})}>
                <label htmlFor="primaryBusinessActivity" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
                  {t('business.primaryActivity')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="primaryBusinessActivity"
                  name="primaryBusinessActivity"
                  value={formData.primaryBusinessActivity}
                  onChange={handleChange}
                  className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-0 transition-colors duration-200 bg-white text-base sm:text-lg ${fieldErrors.primaryBusinessActivity ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-pt-turquoise'}`}
                >
                  <option value="">{t('business.selectActivity')}</option>
                  <option value="grocery_convenience">Grocery / Convenience</option>
                  <option value="restaurant_cafe">Restaurant / Cafe</option>
                  <option value="bar_pub">Bar / Pub</option>
                  <option value="specialty_food_import">Specialty Food Import</option>
                  <option value="professional_services">Professional Services</option>
                  <option value="other">Other</option>
                </select>
                {fieldErrors.primaryBusinessActivity && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.primaryBusinessActivity}</p>}
              </div>
              <div className="group" {...(fieldErrors.primarySpecialty ? {'data-field-error': 'true'} : {})}>
                <label htmlFor="primarySpecialty" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
                  {t('business.primarySpecialty')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="primarySpecialty"
                  name="primarySpecialty"
                  value={formData.primarySpecialty}
                  onChange={handleChange}
                  className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-0 transition-colors duration-200 bg-white text-base sm:text-lg ${fieldErrors.primarySpecialty ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-pt-turquoise'}`}
                >
                  <option value="">{t('business.selectSpecialty')}</option>
                  <option value="African">African</option>
                  <option value="Caribbean">Caribbean</option>
                  <option value="South Asian">South Asian</option>
                  <option value="Middle Eastern">Middle Eastern</option>
                  <option value="East Asian">East Asian</option>
                  <option value="Latin American">Latin American</option>
                  <option value="European">European</option>
                  <option value="Mixed / General">Mixed / General</option>
                  <option value="Other">Other</option>
                </select>
                {fieldErrors.primarySpecialty && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.primarySpecialty}</p>}
              </div>
            </div>

            <div className="group" {...(fieldErrors.customerInteractionType ? {'data-field-error': 'true'} : {})}>
              <label htmlFor="customerInteractionType" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
                {t('business.customerInteraction')} <span className="text-red-500">*</span>
              </label>
              <select
                id="customerInteractionType"
                name="customerInteractionType"
                value={formData.customerInteractionType}
                onChange={handleChange}
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-0 transition-colors duration-200 bg-white text-base sm:text-lg ${fieldErrors.customerInteractionType ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-pt-turquoise'}`}
              >
                <option value="">{t('business.selectInteraction')}</option>
                <option value="sit_down_table_service">Sit-down / Table Service</option>
                <option value="grab_and_go">Grab-and-go / Over the counter</option>
                <option value="appointment_based">Appointment based</option>
              </select>
              {fieldErrors.customerInteractionType && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.customerInteractionType}</p>}
            </div>

            <div className="flex items-start space-x-3 bg-white rounded-xl p-4 border border-pt-turquoise/20">
              <input
                type="checkbox"
                id="sellsInternationalGoods"
                name="sellsInternationalGoods"
                checked={formData.sellsInternationalGoods}
                onChange={(e) => setFormData(prev => ({ ...prev, sellsInternationalGoods: e.target.checked }))}
                className="w-5 h-5 text-pt-turquoise bg-white border-2 border-gray-300 rounded focus:ring-pt-turquoise focus:ring-2 mt-0.5"
              />
              <label htmlFor="sellsInternationalGoods" className="cursor-pointer">
                <span className="text-sm sm:text-base font-semibold text-gray-800">{t('business.sellsInternational')}</span>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t('business.sellsInternationalDescription')}
                </p>
              </label>
            </div>

            {/* Schedule Meeting — required before registration */}
            <div className="group">
              <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
                {t('business.scheduleMeeting')} <span className="text-red-500">*</span>
              </label>
              {meetingBooked ? (
                <div className="w-full flex items-center px-4 sm:px-6 py-3 sm:py-4 border-2 border-green-300 rounded-xl sm:rounded-2xl bg-green-50/60">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 mr-4">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-base font-semibold text-green-800">{t('business.meetingScheduled')}</span>
                    <span className="block text-sm text-green-600 mt-0.5">{t('business.meetingScheduledDescription')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(true)}
                    className="text-sm text-green-700 underline font-medium ml-3 flex-shrink-0 hover:text-green-800"
                  >
                    {t('business.reschedule')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowBookingModal(true)}
                  className="w-full flex items-center px-4 sm:px-6 py-3 sm:py-4 border-2 border-pt-turquoise/40 rounded-xl sm:rounded-2xl bg-pt-turquoise/5 hover:border-pt-turquoise hover:bg-pt-turquoise/10 transition-colors duration-200 text-left group"
                >
                  <div className="w-10 h-10 bg-pt-turquoise/10 rounded-xl flex items-center justify-center flex-shrink-0 mr-4 group-hover:bg-pt-turquoise/20 transition-colors">
                    <svg className="w-5 h-5 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-base sm:text-lg font-semibold text-pt-dark-gray">
                      {t('business.bookMeeting')}
                    </span>
                    <span className="block text-sm text-pt-turquoise mt-0.5">
                      {t('business.bookMeetingDescription')}
                    </span>
                  </div>
                  <svg className="w-5 h-5 text-pt-turquoise/50 flex-shrink-0 ml-3 group-hover:text-pt-turquoise transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              <p className={`text-xs mt-1.5 ml-1 ${fieldErrors.meeting ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                {fieldErrors.meeting || (meetingBooked ? t('business.canReschedule') : t('business.mustBookMeeting'))}
              </p>
            </div>
          </div>
        )}

        {/* Country */}
        <div className="group" {...(fieldErrors.country ? {'data-field-error': 'true'} : {})}>
          <label htmlFor="country" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
            {t('fields.country')} <span className="text-red-500">*</span>
          </label>
          <CountryPicker
            value={formData.country}
            onChange={(v) => { handleCountryChange(v); if (fieldErrors.country) setFieldErrors(prev => { const next = { ...prev }; delete next.country; return next }) }}
            placeholder={t('placeholders.country')}
            required
            error={fieldErrors.country}
            allowedCodes={partnerType === 'business' ? BUSINESS_PARTNER_PRESENCE_COUNTRIES : undefined}
          />
          {partnerType === 'business' && !fieldErrors.country && (
            <p className="text-xs text-gray-500 mt-1.5">
              {t('business.countryRestrictionHint')}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div className="group" {...(fieldErrors.phoneNumber ? {'data-field-error': 'true'} : {})}>
          <PhoneNumberInput
            label={t('fields.phone')}
            value={formData.phoneNumber}
            onChange={(phoneNumber) => { setFormData(prev => ({ ...prev, phoneNumber })); if (fieldErrors.phoneNumber) setFieldErrors(prev => { const next = { ...prev }; delete next.phoneNumber; return next }) }}
            countryCode={phoneCountryCode}
            onCountryCodeChange={setPhoneCountryCode}
            required
            placeholder="7123456789"
            showFullNumber={false}
            className=""
          />
          {fieldErrors.phoneNumber && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.phoneNumber}</p>}
        </div>

        {/* Email */}
        <div className="group" {...(fieldErrors.email ? {'data-field-error': 'true'} : {})}>
          <label htmlFor="email" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
            {t('fields.email')} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white text-base sm:text-lg ${fieldErrors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-pt-turquoise'}`}
            placeholder={t('placeholders.email')}
          />
          {fieldErrors.email && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.email}</p>}
        </div>

        {/* Password */}
        <div className="group" {...(fieldErrors.password ? {'data-field-error': 'true'} : {})}>
          <label htmlFor="password" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
            {t('fields.password')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 sm:px-6 py-3 sm:py-4 pr-12 sm:pr-14 border-2 rounded-xl sm:rounded-2xl focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white text-base sm:text-lg ${fieldErrors.password ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-pt-turquoise'}`}
              placeholder={t('placeholders.password')}
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
          {fieldErrors.password
            ? <p className="text-xs text-red-500 mt-1.5">{fieldErrors.password}</p>
            : <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 flex items-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('passwordRequirement')}
              </p>
          }
        </div>

        {/* Confirm Password */}
        <div className="group" {...(fieldErrors.confirmPassword ? {'data-field-error': 'true'} : {})}>
          <label htmlFor="confirmPassword" className="block text-sm sm:text-base font-semibold text-gray-800 mb-2">
            {t('fields.confirmPassword')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 sm:px-6 py-3 sm:py-4 pr-12 sm:pr-14 border-2 rounded-xl sm:rounded-2xl focus:ring-0 transition-colors duration-200 bg-gray-50 focus:bg-white text-base sm:text-lg ${fieldErrors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-pt-turquoise'}`}
              placeholder={t('placeholders.confirmPassword')}
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
          {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1.5">{fieldErrors.confirmPassword}</p>}
        </div>

        {/* Agreement Section */}
        <div className={`rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 text-white mt-6 sm:mt-8 ${fieldErrors.acceptPartnerProgram ? 'bg-gradient-to-r from-red-500 to-red-600 ring-2 ring-red-300' : 'bg-gradient-to-r from-pt-turquoise to-teal-500'}`} {...(fieldErrors.acceptPartnerProgram ? {'data-field-error': 'true'} : {})}>
          <div className="flex items-start space-x-3 sm:space-x-4">
            <input
              type="checkbox"
              id="acceptPartnerProgram"
              name="acceptPartnerProgram"
              checked={formData.acceptPartnerProgram}
              onChange={(e) => { setFormData(prev => ({ ...prev, acceptPartnerProgram: e.target.checked })); if (fieldErrors.acceptPartnerProgram) setFieldErrors(prev => { const next = { ...prev }; delete next.acceptPartnerProgram; return next }) }}
              className="w-5 h-5 sm:w-6 sm:h-6 text-pt-turquoise bg-white border-2 border-white rounded focus:ring-white focus:ring-2 mt-1"
            />
            <div className="flex-1">
              <label htmlFor="acceptPartnerProgram" className="text-white cursor-pointer">
                <span className="font-bold text-lg sm:text-xl">Partner Program Agreement</span>
                <span className="text-red-200 ml-1 sm:ml-2">*</span>
                <p className="text-white/90 mt-1 sm:mt-2 text-sm sm:text-base">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-white underline hover:text-gray-100 font-semibold decoration-2 underline-offset-2"
                  >
                    Partner Program Terms & Conditions
                  </button>
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Business partner info callout */}
        {partnerType === 'business' && (
          <div className="bg-pt-turquoise/5 border-2 border-pt-turquoise/20 rounded-xl p-4 sm:p-5">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-pt-turquoise mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-pt-turquoise-700">{t('business.whatHappensNext')}</p>
                <p className="text-sm text-pt-dark-gray mt-1">
                  {t('business.whatHappensNextDescription')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8 sm:mt-10">
          <button
            type="submit"
            disabled={loading || !isFormComplete}
            className="w-full bg-gradient-to-r from-pt-turquoise to-teal-500 text-white py-4 sm:py-5 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-bold text-lg sm:text-xl shadow-2xl hover:shadow-3xl hover:from-pt-turquoise-600 hover:to-teal-600 focus:outline-none focus:ring-4 focus:ring-pt-turquoise/30 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-3 border-white mr-3"></div>
                <span>{t('submitting')}</span>
              </div>
            ) : (
              <span>{t('submit')}</span>
            )}
          </button>
        </div>

        {/* Login Link */}
        <div className="text-center pt-6 pb-6 sm:pb-8">
          <p className="text-base text-gray-600">
            {t('alreadyHaveAccount')}{' '}
            <Link 
              href={createLocalizedPath('/auth/login', locale)} 
              className="text-pt-turquoise hover:text-pt-turquoise-600 font-bold underline decoration-2 underline-offset-4 transition-colors"
            >
              {t('signInLink')}
            </Link>
          </p>
        </div>
      </form>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col safe-area-inset">
          <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-gray-200 bg-white flex-shrink-0">
            <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 pr-2 leading-tight">Partner Program Terms & Conditions</h2>
            <button
              onClick={() => setShowTermsModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4 sm:p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
            {isIOS ? (
              <div className="max-w-md mx-auto bg-white shadow-xl rounded-2xl p-6 sm:p-8 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-pt-turquoise-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{tTerms('viewTitle')}</h3>
                <p className="text-gray-600 mb-6">{tTerms('viewMessage')}</p>
                <div className="space-y-3">
                  <a href="/terms-and-conditions.pdf" target="_blank" rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-pt-turquoise text-white rounded-lg font-medium hover:bg-pt-turquoise-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {tTerms('openInSafari')}
                  </a>
                  <a href="/terms-and-conditions.pdf" download
                    onClick={() => {
                      setDownloadStatus('downloading')
                      setTimeout(() => { setDownloadStatus('downloaded'); setTimeout(() => setDownloadStatus('idle'), 2000) }, 500)
                    }}
                    className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                      downloadStatus === 'downloaded' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                    {downloadStatus === 'downloaded' ? tTerms('downloaded') : tTerms('download')}
                  </a>
                </div>
              </div>
            ) : (
              <div className="w-full h-full p-2 sm:p-4">
                <div className="max-w-4xl mx-auto h-full bg-white shadow-lg rounded-lg overflow-hidden">
                  <iframe src="/terms-and-conditions.pdf#view=FitH" className="w-full h-full min-h-[800px]" title="Terms and Conditions" />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 lg:p-6 border-t border-gray-200 bg-white flex-shrink-0">
            <button onClick={() => setShowTermsModal(false)}
              className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center">
              {tTerms('close')}
            </button>
            <a href="/terms-and-conditions.pdf" download
              onClick={() => {
                setDownloadStatus('downloading')
                setTimeout(() => { setDownloadStatus('downloaded'); setTimeout(() => setDownloadStatus('idle'), 2000) }, 500)
              }}
              className={`w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                downloadStatus === 'downloaded' ? 'bg-green-500 text-white' : 'bg-pt-turquoise text-white hover:bg-pt-turquoise-600'
              }`}>
              {downloadStatus === 'downloaded' ? tTerms('downloaded') : tTerms('download')}
            </a>
          </div>
        </div>
      )}

      {/* Meeting Booking Modal */}
      {partnerType === 'business' && (
        <MeetingBookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false)
            setMeetingBooked(true)
          }}
          bookingUrl={MEETING_BOOKING_URL}
        />
      )}
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pt-turquoise"></div>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  )
}
