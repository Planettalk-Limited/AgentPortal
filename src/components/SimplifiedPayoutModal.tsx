'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { CreatePayoutRequest } from '@/lib/api'
import { MINIMUM_PAYOUT_AMOUNT } from '@/lib/constants/payout'
import CountryPicker from './CountryPicker'

interface SimplifiedPayoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payoutData: CreatePayoutRequest) => Promise<void>
  availableBalance: string
  isLoading: boolean
}

type PaymentMethod = 'bank_transfer' | 'planettalk_credit'

// Comprehensive list of all major world currencies
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'OMR' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'JD' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'د.ع' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼' },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋' }
]

// Supported countries for PlanetTalk Credit
const countryCodes = [
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
]

export default function SimplifiedPayoutModal({
  isOpen,
  onClose,
  onSubmit,
  availableBalance,
  isLoading
}: SimplifiedPayoutModalProps) {
  const t = useTranslations('agent')
  
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer')
  const [description, setDescription] = useState('')
  
  // Bank Transfer Details
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    branchNameOrCode: '',
    accountName: '',
    accountNumberOrIban: '',
    swiftBicCode: '',
    currency: 'USD',
    bankCountry: ''
  })
  
  // PlanetTalk Credit Details
  const [selectedCountryCode, setSelectedCountryCode] = useState('+44')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', description: 'Traditional bank account transfer' },
    { value: 'planettalk_credit', label: 'PlanetTalk Credit', icon: '📱', description: 'Credit to your associated PlanetTalk account' }
  ]

  const resetForm = () => {
    setAmount('')
    setMethod('bank_transfer')
    setDescription('')
    setBankDetails({ bankName: '', branchNameOrCode: '', accountName: '', accountNumberOrIban: '', swiftBicCode: '', currency: 'USD', bankCountry: '' })
    setSelectedCountryCode('+44')
    setPhoneNumber('')
    setAccountName('')
    setCountrySearch('')
  }

  const getFullPhoneNumber = () => {
    return `${selectedCountryCode}${phoneNumber.replace(/^0+/, '')}` // Remove leading zeros
  }

  // Filter countries based on search
  const filteredCountries = countryCodes.filter(country => 
    country.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.includes(countrySearch)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amountValue = parseFloat(amount)
    
    // Validate amount
    if (amountValue < MINIMUM_PAYOUT_AMOUNT) {
      alert(`Minimum payout amount is $${MINIMUM_PAYOUT_AMOUNT}`)
      return
    }
    
    if (amountValue > parseFloat(availableBalance)) {
      alert('Insufficient balance for payout request')
      return
    }

    // Build payment details based on selected method
    const paymentDetails: any = {}
    
    if (method === 'bank_transfer') {
      if (!bankDetails.bankName || !bankDetails.branchNameOrCode || !bankDetails.accountName || 
          !bankDetails.accountNumberOrIban || !bankDetails.swiftBicCode || !bankDetails.currency || !bankDetails.bankCountry) {
        alert('Please fill in all bank account details')
        return
      }
      paymentDetails.bankAccount = bankDetails
    } else if (method === 'planettalk_credit') {
      if (!phoneNumber) {
        alert('Please enter your PlanetTalk mobile number')
        return
      }
      paymentDetails.planettalkCredit = {
        planettalkMobile: getFullPhoneNumber(),
        accountName: accountName || `${selectedCountryCode}${phoneNumber}`
      }
    }

    try {
      const payoutRequest = {
        amount: amountValue,
        method,
        description: description || `${method === 'bank_transfer' ? 'Bank Transfer' : 'PlanetTalk Credit'} payout`,
        paymentDetails,
        metadata: { source: 'agent_portal' }
      }
      
      console.log('Submitting payout request:', payoutRequest)
      
      await onSubmit(payoutRequest)
      
      resetForm()
      onClose()
    } catch (error) {
      console.error('Payout request failed:', error)
      console.error('Error details:', {
        message: (error as any)?.message,
        status: (error as any)?.status,
        statusText: (error as any)?.statusText,
        response: (error as any)?.response,
        data: (error as any)?.response?.data
      })
      
      // Show user-friendly error message
      const errorMessage = (error as any)?.message || (error as any)?.response?.data?.message || 'An unexpected error occurred'
      alert(`Payout request failed: ${errorMessage}`)
    }
  }

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Request Payout</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Available Balance: <span className="font-semibold text-green-600">${availableBalance}</span>
            </p>
          </div>

          {/* Payout Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payout Amount ($)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter amount (minimum $${MINIMUM_PAYOUT_AMOUNT})`}
              min={MINIMUM_PAYOUT_AMOUNT}
              step="0.01"
              required
            />
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
            <div className="space-y-3">
              {paymentMethods.map((paymentMethod) => (
                <div
                  key={paymentMethod.value}
                  className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    method === paymentMethod.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setMethod(paymentMethod.value as PaymentMethod)}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{paymentMethod.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{paymentMethod.label}</h3>
                      <p className="text-sm text-gray-600">{paymentMethod.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description for this payout"
            />
          </div>

          {/* Conditional Details */}
          <div className="mb-6">
            {method === 'bank_transfer' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Transfer Details</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                    <input
                      type="text"
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Standard Bank"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name or Code</label>
                    <input
                      type="text"
                      value={bankDetails.branchNameOrCode}
                      onChange={(e) => setBankDetails({...bankDetails, branchNameOrCode: e.target.value})}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Main Branch / 001234"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                    <input
                      type="text"
                      value={bankDetails.accountName}
                      onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., John Doe"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number or IBAN</label>
                    <input
                      type="text"
                      value={bankDetails.accountNumberOrIban}
                      onChange={(e) => setBankDetails({...bankDetails, accountNumberOrIban: e.target.value})}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., GB29NWBK60161331926819"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">SWIFT/BIC Code</label>
                    <input
                      type="text"
                      value={bankDetails.swiftBicCode}
                      onChange={(e) => setBankDetails({...bankDetails, swiftBicCode: e.target.value})}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., SBZAZAJJ"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select
                      value={bankDetails.currency}
                      onChange={(e) => setBankDetails({...bankDetails, currency: e.target.value})}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {CURRENCIES.map(currency => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name} ({currency.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Country</label>
                    <div className="payout-country-picker">
                      <CountryPicker
                        value={bankDetails.bankCountry}
                        onChange={(value) => setBankDetails({...bankDetails, bankCountry: value})}
                        placeholder="Select bank country"
                        required
                      />
                    </div>
                  </div>
                  
                  <style jsx>{`
                    .payout-country-picker :global(button) {
                      padding: 0.75rem 1rem !important;
                      border-radius: 0.5rem !important;
                      border-width: 1px !important;
                      border-color: rgb(209, 213, 219) !important;
                    }
                    .payout-country-picker :global(button:focus) {
                      ring: 2px;
                      ring-color: rgb(59, 130, 246);
                      border-color: rgb(59, 130, 246) !important;
                    }
                  `}</style>
                </div>
              </div>
            )}

            {method === 'planettalk_credit' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">PlanetTalk Credit Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PlanetTalk Mobile Number</label>
                    <div className="flex">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="flex items-center px-3 py-3 border border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <span className="mr-2">{countryCodes.find(c => c.code === selectedCountryCode)?.flag}</span>
                          <span className="font-mono text-sm">{selectedCountryCode}</span>
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {showCountryDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                            <div className="p-2">
                              <input
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                placeholder="Search countries..."
                              />
                            </div>
                            <div className="max-h-40 overflow-y-auto">
                              {filteredCountries.map((country) => (
                                <button
                                  key={country.code}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCountryCode(country.code)
                                    setShowCountryDropdown(false)
                                    setCountrySearch('')
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center"
                                >
                                  <span className="mr-3">{country.flag}</span>
                                  <span className="font-mono text-sm mr-2">{country.code}</span>
                                  <span className="text-sm">{country.country}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '')
                          setPhoneNumber(value)
                        }}
                        className="flex-1 px-3 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="771234567"
                        required
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Full number: <span className="font-mono">{getFullPhoneNumber()}</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Name (Optional)</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Name for PlanetTalk account (optional)"
                    />
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">📱 PlanetTalk Credit Information:</p>
                        <ul className="space-y-1 text-blue-700">
                          <li>• Credit will be added to your associated PlanetTalk account</li>
                          <li>• Processing time: 3-5 business days</li>
                          <li>• Available for France, Canada, and United Kingdom</li>
                          <li>• Double-check your phone number!</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Request Payout'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}