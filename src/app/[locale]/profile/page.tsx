'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { api, User, UpdateProfileRequest, ApiError } from '@/lib/api'
import { ErrorAlert, SuccessAlert, LoadingSpinner } from '@/components/ErrorBoundary'
import TwoFactorSetup from '@/components/TwoFactorSetup'
import TwoFactorManagement from '@/components/TwoFactorManagement'
import CountryPicker from '@/components/CountryPicker'

// Helper function to get country display info
const getCountryInfo = (countryCode: string) => {
  const countryMap: { [key: string]: { name: string; flag: string } } = {
    'GB': { name: 'United Kingdom', flag: '🇬🇧' },
    'US': { name: 'United States', flag: '🇺🇸' },
    'CA': { name: 'Canada', flag: '🇨🇦' },
    'AU': { name: 'Australia', flag: '🇦🇺' },
    'ZW': { name: 'Zimbabwe', flag: '🇿🇼' },
    'KE': { name: 'Kenya', flag: '🇰🇪' },
    'ZA': { name: 'South Africa', flag: '🇿🇦' },
    'NG': { name: 'Nigeria', flag: '🇳🇬' },
    'GH': { name: 'Ghana', flag: '🇬🇭' },
    'UG': { name: 'Uganda', flag: '🇺🇬' },
    'TZ': { name: 'Tanzania', flag: '🇹🇿' },
    'ZM': { name: 'Zambia', flag: '🇿🇲' },
    'MW': { name: 'Malawi', flag: '🇲🇼' },
    'BW': { name: 'Botswana', flag: '🇧🇼' }
  }
  return countryMap[countryCode] || { name: countryCode, flag: '🌍' }
}

// Comprehensive timezone list
const TIMEZONES = [
  { value: 'UTC', label: 'UTC - Coordinated Universal Time' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Anchorage', label: 'Alaska Time (US)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (US)' },
  { value: 'America/Toronto', label: 'Toronto (Canada)' },
  { value: 'America/Vancouver', label: 'Vancouver (Canada)' },
  { value: 'America/Mexico_City', label: 'Mexico City (Mexico)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (Brazil)' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires (Argentina)' },
  { value: 'Europe/London', label: 'London (UK)' },
  { value: 'Europe/Dublin', label: 'Dublin (Ireland)' },
  { value: 'Europe/Paris', label: 'Paris (France)' },
  { value: 'Europe/Berlin', label: 'Berlin (Germany)' },
  { value: 'Europe/Madrid', label: 'Madrid (Spain)' },
  { value: 'Europe/Rome', label: 'Rome (Italy)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (Netherlands)' },
  { value: 'Europe/Brussels', label: 'Brussels (Belgium)' },
  { value: 'Europe/Zurich', label: 'Zurich (Switzerland)' },
  { value: 'Europe/Vienna', label: 'Vienna (Austria)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (Sweden)' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen (Denmark)' },
  { value: 'Europe/Oslo', label: 'Oslo (Norway)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (Finland)' },
  { value: 'Europe/Warsaw', label: 'Warsaw (Poland)' },
  { value: 'Europe/Prague', label: 'Prague (Czech Republic)' },
  { value: 'Europe/Budapest', label: 'Budapest (Hungary)' },
  { value: 'Europe/Moscow', label: 'Moscow (Russia)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (Japan)' },
  { value: 'Asia/Seoul', label: 'Seoul (South Korea)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (China)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Bangkok', label: 'Bangkok (Thailand)' },
  { value: 'Asia/Jakarta', label: 'Jakarta (Indonesia)' },
  { value: 'Asia/Manila', label: 'Manila (Philippines)' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur (Malaysia)' },
  { value: 'Asia/Mumbai', label: 'Mumbai (India)' },
  { value: 'Asia/Kolkata', label: 'Kolkata (India)' },
  { value: 'Asia/Dubai', label: 'Dubai (UAE)' },
  { value: 'Asia/Riyadh', label: 'Riyadh (Saudi Arabia)' },
  { value: 'Africa/Cairo', label: 'Cairo (Egypt)' },
  { value: 'Africa/Lagos', label: 'Lagos (Nigeria)' },
  { value: 'Africa/Nairobi', label: 'Nairobi (Kenya)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (South Africa)' },
  { value: 'Australia/Sydney', label: 'Sydney (Australia)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (Australia)' },
  { value: 'Australia/Perth', label: 'Perth (Australia)' },
  { value: 'Pacific/Auckland', label: 'Auckland (New Zealand)' }
]

// Comprehensive currency list
const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'JPY', label: 'JPY - Japanese Yen', symbol: '¥' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
  { value: 'CHF', label: 'CHF - Swiss Franc', symbol: 'CHF' },
  { value: 'CNY', label: 'CNY - Chinese Yuan', symbol: '¥' },
  { value: 'SEK', label: 'SEK - Swedish Krona', symbol: 'kr' },
  { value: 'NOK', label: 'NOK - Norwegian Krone', symbol: 'kr' },
  { value: 'DKK', label: 'DKK - Danish Krone', symbol: 'kr' },
  { value: 'PLN', label: 'PLN - Polish Złoty', symbol: 'zł' },
  { value: 'CZK', label: 'CZK - Czech Koruna', symbol: 'Kč' },
  { value: 'HUF', label: 'HUF - Hungarian Forint', symbol: 'Ft' },
  { value: 'RUB', label: 'RUB - Russian Ruble', symbol: '₽' },
  { value: 'BRL', label: 'BRL - Brazilian Real', symbol: 'R$' },
  { value: 'MXN', label: 'MXN - Mexican Peso', symbol: '$' },
  { value: 'ARS', label: 'ARS - Argentine Peso', symbol: '$' },
  { value: 'KRW', label: 'KRW - South Korean Won', symbol: '₩' },
  { value: 'SGD', label: 'SGD - Singapore Dollar', symbol: 'S$' },
  { value: 'HKD', label: 'HKD - Hong Kong Dollar', symbol: 'HK$' },
  { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
  { value: 'THB', label: 'THB - Thai Baht', symbol: '฿' },
  { value: 'MYR', label: 'MYR - Malaysian Ringgit', symbol: 'RM' },
  { value: 'IDR', label: 'IDR - Indonesian Rupiah', symbol: 'Rp' },
  { value: 'PHP', label: 'PHP - Philippine Peso', symbol: '₱' },
  { value: 'AED', label: 'AED - UAE Dirham', symbol: 'د.إ' },
  { value: 'SAR', label: 'SAR - Saudi Riyal', symbol: '﷼' },
  { value: 'EGP', label: 'EGP - Egyptian Pound', symbol: 'E£' },
  { value: 'NGN', label: 'NGN - Nigerian Naira', symbol: '₦' },
  { value: 'ZAR', label: 'ZAR - South African Rand', symbol: 'R' },
  { value: 'NZD', label: 'NZD - New Zealand Dollar', symbol: 'NZ$' }
]

// Language options
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' }
]

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('profile')

  // Profile Data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    country: ''
  })

  // General Preferences
  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    theme: 'light',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12'
  })

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    requirePasswordChange: false,
    loginNotifications: true,
    sessionTimeout: 30
  })

  // 2FA Setup State
  const [show2FASetup, setShow2FASetup] = useState(false)

  // Notification Preferences - Updated to match API format
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    loginNotifications: true,
    specificNotifications: {
      payoutNotifications: true,
      earningsNotifications: true,
      trainingNotifications: true,
      announcementNotifications: true,
      systemNotifications: true
    }
  })

  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Two-Factor Authentication
  const [twoFactorData, setTwoFactorData] = useState({
    qrCode: '',
    backupCodes: [] as string[],
    verificationCode: ''
  })

  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('profile')

  useEffect(() => {
    loadProfile()
  }, [])


  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!authUser) {
        router.push(`/${locale}/auth/login`)
        return
      }

      // Load profile data
      const profileData = await api.auth.getProfile()
      
      setUser(profileData)
      
      // Update form data with proper type checking and debugging
      const safeFormData = {
        firstName: typeof profileData.firstName === 'string' ? profileData.firstName : (profileData.firstName ? String(profileData.firstName) : ''),
        lastName: typeof profileData.lastName === 'string' ? profileData.lastName : (profileData.lastName ? String(profileData.lastName) : ''),
        email: typeof profileData.email === 'string' ? profileData.email : (profileData.email ? String(profileData.email) : ''),
        phoneNumber: typeof profileData.phoneNumber === 'string' ? profileData.phoneNumber : (profileData.phoneNumber ? String(profileData.phoneNumber) : ''),
        country: typeof profileData.country === 'string' ? profileData.country : (profileData.country ? String(profileData.country) : '')
      }
      
      setFormData(safeFormData)

      // Check if profile already contains preferences and settings
      if (profileData.preferences) {
        setPreferences(prev => ({ ...prev, ...profileData.preferences }))
      }

      if (profileData.settings) {
        setSecuritySettings(prev => ({ ...prev, ...profileData.settings }))
      }

      // Load preferences, security settings, and notifications separately
      try {
        const [prefsData, securityData, notificationData] = await Promise.allSettled([
          api.auth.getPreferences(),
          api.auth.getSecuritySettings(),
          api.auth.getNotificationPreferences()
        ])

        if (prefsData.status === 'fulfilled' && prefsData.value) {
          setPreferences(prev => ({ ...prev, ...prefsData.value }))
        }

        if (securityData.status === 'fulfilled' && securityData.value) {
          setSecuritySettings(prev => ({ ...prev, ...securityData.value }))
        }

        if (notificationData.status === 'fulfilled' && notificationData.value) {
          setNotificationPreferences(prev => ({ ...prev, ...notificationData.value }))
        }
      } catch (err) {
        // Silently handle preference loading errors
      }

    } catch (error) {
      // Failed to load profile
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)

      const updateData: UpdateProfileRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        country: formData.country
      }

      await api.auth.updateProfile(updateData)
      await refreshUser()
      setSuccess(t('profileUpdated'))
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || t('failedToUpdateProfile'))
    } finally {
      setSaving(false)
    }
  }

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)

      await api.auth.updatePreferences(preferences)
      setSuccess(t('preferencesUpdated'))
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || t('failedToUpdatePreferences'))
    } finally {
      setSaving(false)
    }
  }

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)

      await api.auth.updateSecuritySettings(securitySettings)
      setSuccess(t('securitySettingsUpdated'))
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || t('failedToUpdateSecuritySettings'))
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)

      await api.auth.updateNotificationPreferences(notificationPreferences)
      setSuccess(t('notificationPreferencesUpdated'))
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || t('failedToUpdateNotificationPreferences'))
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('passwordsDoNotMatch'))
      return
    }

    if (passwordData.newPassword.length < 8) {
      setError(t('passwordTooShort'))
      return
    }

    try {
      setSaving(true)
      setError(null)

      await api.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })

      setSuccess(t('passwordChanged'))
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || t('failedToChangePassword'))
    } finally {
      setSaving(false)
    }
  }

  const handle2FAToggle = (enabled: boolean) => {
    if (enabled) {
      setShow2FASetup(true)
    } else {
      // Handle disable - update state immediately since TwoFactorManagement handles the API call
      setSecuritySettings(prev => ({
        ...prev,
        twoFactorEnabled: false
      }))
      setSuccess('Two-factor authentication has been disabled.')
      setTimeout(() => setSuccess(null), 3000)
      // Refresh user data
      refreshUser()
    }
  }

  const handle2FASetupComplete = (backupCodes: string[]) => {
    setSecuritySettings(prev => ({
      ...prev,
      twoFactorEnabled: true
    }))
    setShow2FASetup(false)
    setSuccess('Two-factor authentication has been enabled successfully!')
    setTimeout(() => setSuccess(null), 5000)
    // Refresh user data
    refreshUser()
  }

  const handleToggleEmailNotifications = async () => {
    try {
      setSaving(true)
      setError(null)

      const allEmailEnabled = notificationPreferences.emailNotifications
      const result = await api.auth.toggleEmailNotifications(!allEmailEnabled)
      
      // Update email notification preference
      setNotificationPreferences(prev => ({
        ...prev,
        emailNotifications: result.enabled
      }))

      setSuccess(result.enabled ? t('emailNotificationsEnabled') : t('emailNotificationsDisabled'))
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error || t('failedToToggleEmailNotifications'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <LoadingSpinner size="lg" message={t('loadingProfile')} />
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: t('tabs.profile'), icon: '👤', color: 'bg-blue-500' },
    { id: 'preferences', label: t('tabs.preferences'), icon: '⚙️', color: 'bg-purple-500' },
    { id: 'security', label: t('tabs.security'), icon: '🔒', color: 'bg-green-500' },
    { id: 'notifications', label: t('tabs.notifications'), icon: '🔔', color: 'bg-orange-500' },
    { id: 'password', label: t('tabs.password'), icon: '🔑', color: 'bg-red-500' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">👤</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {t('title')}
              </h1>
              <p className="text-gray-600 mt-1">{t('subtitle')}</p>
            </div>
          </div>
          
          {/* User Info Card */}
          {user && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {typeof user.firstName === 'string' ? user.firstName : (user.firstName ? String(user.firstName) : 'Unknown')} {typeof user.lastName === 'string' ? user.lastName : (user.lastName ? String(user.lastName) : 'User')}
                  </h2>
                  <p className="text-gray-600">
                    {typeof user.email === 'string' ? user.email : (user.email && typeof user.email === 'object' ? JSON.stringify(user.email) : (user.email ? String(user.email) : 'No email'))}
                  </p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'pt_admin' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        <SuccessAlert message={success} onClose={() => setSuccess(null)} />
        <ErrorAlert error={error} onClose={() => setError(null)} />

        {/* Enhanced Tab Navigation - Mobile Responsive */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="border-b border-gray-200">
            {/* Mobile Dropdown Menu */}
            <div className="sm:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                className="block w-full border-0 py-4 px-4 text-sm font-medium text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Desktop Tab Navigation */}
            <nav className="hidden sm:flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-4 lg:px-6 py-4 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{tab.icon}</span>
                    <span className="hidden lg:inline">{tab.label}</span>
                    <span className="lg:hidden">{tab.label.split(' ')[0]}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="max-w-2xl">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600">👤</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{t('personalInfo.title')}</h3>
                </div>
                
                <form onSubmit={handleProfileSubmit} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('personalInfo.firstName')}
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('personalInfo.lastName')}
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('personalInfo.email')}
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500">{t('personalInfo.emailCannotBeChanged')}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('personalInfo.phoneNumber')}
                      </label>
                      <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('personalInfo.country')}
                      </label>
                      {formData.country ? (
                        <div>
                          <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 flex items-center">
                            <span className="text-xl mr-3">{getCountryInfo(formData.country).flag}</span>
                            {getCountryInfo(formData.country).name}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{t('personalInfo.countryCannotBeChanged')}</p>
                        </div>
                      ) : (
                        <CountryPicker
                          value={formData.country}
                          onChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
                          placeholder="Select your country"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('personalInfo.userId')}
                      </label>
                      <input
                        type="text"
                        value={user?.id || ''}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500">{t('personalInfo.userIdCannotBeChanged')}</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      {saving ? t('saving') : t('saveProfile')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="max-w-2xl">
                <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                  <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600">⚙️</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{t('preferences.title')}</h3>
                </div>
                
                <form onSubmit={handlePreferencesSubmit} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('preferences.language')}
                      </label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        {LANGUAGES.map(lang => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('preferences.timezone')}
                      </label>
                      <select
                        value={preferences.timezone}
                        onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        {TIMEZONES.map(tz => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('preferences.currency')}
                      </label>
                      <select
                        value={preferences.currency}
                        onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        {CURRENCIES.map(curr => (
                          <option key={curr.value} value={curr.value}>
                            {curr.symbol} {curr.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('preferences.theme')}
                      </label>
                      <select
                        value={preferences.theme}
                        onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="light">{t('preferences.themes.light')}</option>
                        <option value="dark">{t('preferences.themes.dark')}</option>
                        <option value="auto">{t('preferences.themes.auto')}</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('preferences.dateFormat')}
                      </label>
                      <select
                        value={preferences.dateFormat}
                        onChange={(e) => setPreferences(prev => ({ ...prev, dateFormat: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('preferences.timeFormat')}
                      </label>
                      <select
                        value={preferences.timeFormat}
                        onChange={(e) => setPreferences(prev => ({ ...prev, timeFormat: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="12">{t('preferences.timeFormats.12hour')}</option>
                        <option value="24">{t('preferences.timeFormats.24hour')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      {saving ? t('saving') : t('savePreferences')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="max-w-3xl">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600">🔒</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{t('security.title')}</h3>
                </div>
                
                <form onSubmit={handleSecuritySubmit} className="space-y-8">
                  {/* Two-Factor Authentication */}
                  <div className="space-y-6">
                    {show2FASetup ? (
                      <div className="bg-white rounded-2xl p-6 border border-gray-200">
                        <TwoFactorSetup
                          onSetupComplete={handle2FASetupComplete}
                          onCancel={() => setShow2FASetup(false)}
                        />
                      </div>
                    ) : (
                      <TwoFactorManagement
                        isEnabled={securitySettings.twoFactorEnabled}
                        onToggle={handle2FAToggle}
                      />
                    )}
                  </div>

                  {/* Other Security Settings */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <label className="text-sm font-medium text-gray-900">{t('security.loginNotifications')}</label>
                        <p className="text-sm text-gray-600">{t('security.loginNotificationsDescription')}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={securitySettings.loginNotifications}
                        onChange={(e) => setSecuritySettings(prev => ({ 
                          ...prev, 
                          loginNotifications: e.target.checked 
                        }))}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <label className="text-sm font-medium text-gray-900">{t('security.requirePasswordChange')}</label>
                        <p className="text-sm text-gray-600">{t('security.requirePasswordChangeDescription')}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={securitySettings.requirePasswordChange}
                        onChange={(e) => setSecuritySettings(prev => ({ 
                          ...prev, 
                          requirePasswordChange: e.target.checked 
                        }))}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('security.sessionTimeout')}
                      </label>
                      <select
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings(prev => ({ 
                          ...prev, 
                          sessionTimeout: parseInt(e.target.value) 
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="15">{t('security.sessionTimeouts.15min')}</option>
                        <option value="30">{t('security.sessionTimeouts.30min')}</option>
                        <option value="60">{t('security.sessionTimeouts.1hour')}</option>
                        <option value="120">{t('security.sessionTimeouts.2hours')}</option>
                        <option value="240">{t('security.sessionTimeouts.4hours')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      {saving ? t('saving') : t('saveSecuritySettings')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="max-w-3xl">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600">🔔</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{t('notifications.title')}</h3>
                </div>
                
                <form onSubmit={handleNotificationsSubmit} className="space-y-8">
                  {/* Quick Toggle */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{t('notifications.emailNotifications')}</h4>
                        <p className="text-sm text-gray-600">{t('notifications.emailToggleDescription')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleEmailNotifications}
                        disabled={saving}
                        className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                      >
                        {saving ? t('processing') : t('notifications.toggleAll')}
                      </button>
                    </div>
                  </div>

                  {/* General Settings */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 flex items-center">
                      <span className="mr-2">📧</span>
                      {t('notifications.generalSettings')}
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <label className="text-sm font-medium text-gray-700">{t('notifications.emailNotifications')}</label>
                        <input
                          type="checkbox"
                          checked={notificationPreferences.emailNotifications}
                          onChange={(e) => setNotificationPreferences(prev => ({
                            ...prev,
                            emailNotifications: e.target.checked
                          }))}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <label className="text-sm font-medium text-gray-700">{t('notifications.smsNotifications')}</label>
                        <input
                          type="checkbox"
                          checked={notificationPreferences.smsNotifications}
                          onChange={(e) => setNotificationPreferences(prev => ({
                            ...prev,
                            smsNotifications: e.target.checked
                          }))}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <label className="text-sm font-medium text-gray-700">{t('notifications.loginNotifications')}</label>
                        <input
                          type="checkbox"
                          checked={notificationPreferences.loginNotifications}
                          onChange={(e) => setNotificationPreferences(prev => ({
                            ...prev,
                            loginNotifications: e.target.checked
                          }))}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Specific Notifications */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 flex items-center">
                      <span className="mr-2">🎯</span>
                      {t('notifications.specificNotifications')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries({
                        payoutNotifications: { label: t('notifications.types.payouts'), icon: '💰' },
                        earningsNotifications: { label: t('notifications.types.earnings'), icon: '📈' },
                        trainingNotifications: { label: t('notifications.types.training'), icon: '📚' },
                        announcementNotifications: { label: t('notifications.types.announcements'), icon: '📢' },
                        systemNotifications: { label: t('notifications.types.system'), icon: '⚙️' }
                      }).map(([key, config]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{config.icon}</span>
                            <label className="text-sm font-medium text-gray-700">{config.label}</label>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationPreferences.specificNotifications[key as keyof typeof notificationPreferences.specificNotifications]}
                            onChange={(e) => setNotificationPreferences(prev => ({
                              ...prev,
                              specificNotifications: {
                                ...prev.specificNotifications,
                                [key]: e.target.checked
                              }
                            }))}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-8 py-3 rounded-xl hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      {saving ? t('saving') : t('saveNotificationPreferences')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="max-w-2xl">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600">🔑</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{t('password.title')}</h3>
                </div>
                
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('password.currentPassword')}
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('password.newPassword')}
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-gray-500">{t('password.requirements')}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('password.confirmPassword')}
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          {t('password.securityTips.title')}
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>{t('password.securityTips.length')}</li>
                            <li>{t('password.securityTips.mixedCase')}</li>
                            <li>{t('password.securityTips.numbersSpecial')}</li>
                            <li>{t('password.securityTips.unique')}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      {saving ? t('changingPassword') : t('changePassword')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}