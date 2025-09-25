'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { api, ApiError } from '@/lib/api'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  dateOfBirth: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  experience: string
  motivation: string
  hasLicense: boolean
  licenseNumber: string
}

export default function ApplyPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    experience: '',
    motivation: '',
    hasLicense: false,
    licenseNumber: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const t = useTranslations('auth.apply')
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
      await api.agent.submitPublicApplication(formData)
      setSuccess(true)
    } catch (error) {
      const apiError = error as ApiError
      setError(apiError.error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const nextStep = () => {
    if (step < 2) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const isStep1Valid = () => {
    return formData.firstName && formData.lastName && formData.email && formData.phoneNumber && formData.dateOfBirth
  }

  const isStep2Valid = () => {
    return formData.address && formData.city && formData.state && formData.zipCode && formData.experience && formData.motivation
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-pt-dark-gray mb-4">{t('success.title')}</h1>
        <p className="text-pt-light-gray mb-6">
          {t('success.message')}
        </p>
          <div className="bg-pt-turquoise/10 border border-pt-turquoise/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-pt-dark-gray">
              <strong>{t('success.nextSteps')}</strong><br />
              {t('success.nextStepsDescription')}
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href={createLocalizedPath('/auth/login')}
              className="block w-full bg-pt-turquoise text-white py-3 px-4 rounded-lg font-semibold hover:bg-pt-turquoise-600 transition-colors duration-200 text-center"
            >
              Sign In
            </Link>
            <Link
              href={createLocalizedPath('/')}
              className="block w-full text-center py-3 px-4 text-pt-turquoise hover:text-pt-turquoise-600 font-medium transition-colors duration-200"
            >
              Back to Home
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
        <p className="text-pt-light-gray">{t('subtitle')}</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i <= step 
                  ? 'bg-pt-turquoise text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {i}
              </div>
              {i < 2 && (
                <div className={`w-12 h-0.5 ml-2 ${
                  i < step ? 'bg-pt-turquoise' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4 space-x-12 text-sm">
          <span className={`transition-all duration-300 ${step >= 1 ? 'text-pt-turquoise font-semibold' : 'text-pt-light-gray'}`}>
            {t('steps.personal')}
          </span>
          <span className={`transition-all duration-300 ${step >= 2 ? 'text-pt-turquoise font-semibold' : 'text-pt-light-gray'}`}>
            {t('steps.address')}
          </span>
        </div>
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

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-pt-dark-gray mb-4">Personal Information</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-pt-dark-gray mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-colors duration-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-pt-dark-gray mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-colors duration-200"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-pt-dark-gray mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-colors duration-200"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-pt-dark-gray mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-colors duration-200"
                  placeholder="+1-555-123-4567"
                  required
                />
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-pt-dark-gray mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-colors duration-200"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Address Information */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-pt-dark-gray mb-4">Address Information</h2>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-pt-dark-gray mb-2">
                Street Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-colors duration-200"
                placeholder="123 Main Street"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-pt-dark-gray mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-colors duration-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-pt-dark-gray mb-2">
                  State/Province *
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-colors duration-200"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-pt-dark-gray mb-2">
                  ZIP/Postal Code *
                </label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-colors duration-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-pt-dark-gray mb-2">
                  Country *
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-colors duration-200"
                  required
                >
                  <option value="USA">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Experience & Motivation */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-pt-dark-gray mb-4">Experience & Motivation</h2>
            
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-pt-dark-gray mb-2">
                Relevant Experience *
              </label>
              <textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-colors duration-200"
                placeholder="Describe your relevant sales, customer service, or telecommunications experience..."
                required
              />
            </div>

            <div>
              <label htmlFor="motivation" className="block text-sm font-medium text-pt-dark-gray mb-2">
                Why do you want to become a PlanetTalk agent? *
              </label>
              <textarea
                id="motivation"
                name="motivation"
                value={formData.motivation}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-colors duration-200"
                placeholder="Tell us about your motivation and goals..."
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="hasLicense"
                  name="hasLicense"
                  checked={formData.hasLicense}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 text-pt-turquoise focus:ring-pt-turquoise border-gray-300 rounded"
                />
                <label htmlFor="hasLicense" className="ml-3 text-sm text-pt-dark-gray">
                  I have a valid telecommunications or sales license
                </label>
              </div>

              {formData.hasLicense && (
                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-pt-dark-gray mb-2">
                    License Number
                  </label>
                  <input
                    type="text"
                    id="licenseNumber"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise transition-colors duration-200"
                    placeholder="Enter your license number"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 border border-gray-300 text-pt-dark-gray rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Previous
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={(step === 1 && !isStep1Valid()) || (step === 2 && !isStep2Valid())}
              className="px-6 py-3 bg-pt-turquoise text-white rounded-lg hover:bg-pt-turquoise-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-pt-turquoise text-white rounded-lg hover:bg-pt-turquoise-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </div>
              ) : (
                'Submit Application'
              )}
            </button>
          )}
        </div>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-pt-light-gray">
          Already have an account?{' '}
          <Link 
            href="/auth/login" 
            className="text-pt-turquoise hover:text-pt-turquoise-600 font-medium transition-colors duration-200"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
