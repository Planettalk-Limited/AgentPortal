'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import { api, User, UpdateProfileRequest, ApiError } from '@/lib/api'
import { ErrorAlert, SuccessAlert, LoadingSpinner } from '@/components/ErrorBoundary'
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

// Currency list for profile
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

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('profile')

  // Profile Data (includes personal info, currency, and notifications)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    country: '',
    currency: 'USD'
  })

  // Notification Preferences (simplified - email only, default enabled)
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true, // Default enabled
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
      
      // Update form data with proper type checking
      const safeFormData = {
        firstName: typeof profileData.firstName === 'string' ? profileData.firstName : (profileData.firstName ? String(profileData.firstName) : ''),
        lastName: typeof profileData.lastName === 'string' ? profileData.lastName : (profileData.lastName ? String(profileData.lastName) : ''),
        email: typeof profileData.email === 'string' ? profileData.email : (profileData.email ? String(profileData.email) : ''),
        phoneNumber: typeof profileData.phoneNumber === 'string' ? profileData.phoneNumber : (profileData.phoneNumber ? String(profileData.phoneNumber) : ''),
        country: typeof profileData.country === 'string' ? profileData.country : (profileData.country ? String(profileData.country) : ''),
        currency: profileData.preferences?.currency || 'USD'
      }
      
      setFormData(safeFormData)

      // Load notification preferences
      try {
        const notificationData = await api.auth.getNotificationPreferences()
        if (notificationData) {
          setNotificationPreferences(prev => ({ 
            ...prev, 
            ...notificationData,
            emailNotifications: notificationData.emailNotifications !== false // Default to true
          }))
        }
      } catch (err) {
        // Use defaults if loading fails
        console.warn('Failed to load notification preferences, using defaults')
      }

    } catch (error) {
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

      // Update profile info
      const updateData: UpdateProfileRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        country: formData.country
      }

      await api.auth.updateProfile(updateData)

      // Update currency preference
      await api.auth.updatePreferences({ currency: formData.currency })

      // Update notification preferences
      await api.auth.updateNotificationPreferences(notificationPreferences)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <LoadingSpinner size="lg" message={t('loadingProfile')} />
        </div>
      </div>
    )
  }

  // Simplified tabs - only Profile and Password
  const tabs = [
    { id: 'profile', label: t('tabs.profile'), icon: '👤', color: 'bg-blue-500' },
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

        {/* Simplified Tab Navigation - Only Profile and Password */}
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
            <nav className="hidden sm:flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Tab - Includes personal info, currency, and notifications */}
          {activeTab === 'profile' && (
            <div className="p-4 sm:p-6 lg:p-8">
              <form onSubmit={handleProfileSubmit} className="space-y-8">
                
                {/* Personal Information Section */}
                <div className="max-w-2xl">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600">👤</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{t('personalInfo.title')}</h3>
                  </div>
                  
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
                        {t('personalInfo.currency')}
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        {CURRENCIES.map(curr => (
                          <option key={curr.value} value={curr.value}>
                            {curr.symbol} {curr.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notification Preferences Section */}
                <div className="max-w-3xl border-t pt-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-orange-600">🔔</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{t('notifications.title')}</h3>
                  </div>

                  {/* Email Notifications - Always enabled, just show status */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 flex items-center">
                          <span className="mr-2">📧</span>
                          {t('notifications.emailNotifications')}
                        </h4>
                        <p className="text-sm text-gray-600">{t('notifications.emailDescription')}</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notificationPreferences.emailNotifications}
                          onChange={(e) => setNotificationPreferences(prev => ({
                            ...prev,
                            emailNotifications: e.target.checked
                          }))}
                          className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-green-700">
                          {notificationPreferences.emailNotifications ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Specific Notification Types */}
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