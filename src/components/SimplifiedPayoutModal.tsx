'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { CreatePayoutRequest } from '@/lib/api/types'
import { MINIMUM_PAYOUT_AMOUNT } from '@/lib/constants/payout'

interface SimplifiedPayoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payoutData: CreatePayoutRequest) => Promise<void>
  availableBalance: string
  isLoading: boolean
}

type PaymentMethod = 'bank_transfer' | 'airtime_topup'

// Comprehensive list of all country codes
const countryCodes = [
  // Popular/African countries first
  { code: '+263', country: 'Zimbabwe', flag: '🇿🇼' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+260', country: 'Zambia', flag: '🇿🇲' },
  { code: '+265', country: 'Malawi', flag: '🇲🇼' },
  { code: '+267', country: 'Botswana', flag: '🇧🇼' },
  
  // All other countries alphabetically
  { code: '+93', country: 'Afghanistan', flag: '🇦🇫' },
  { code: '+355', country: 'Albania', flag: '🇦🇱' },
  { code: '+213', country: 'Algeria', flag: '🇩🇿' },
  { code: '+1684', country: 'American Samoa', flag: '🇦🇸' },
  { code: '+376', country: 'Andorra', flag: '🇦🇩' },
  { code: '+244', country: 'Angola', flag: '🇦🇴' },
  { code: '+1264', country: 'Anguilla', flag: '🇦🇮' },
  { code: '+672', country: 'Antarctica', flag: '🇦🇶' },
  { code: '+1268', country: 'Antigua and Barbuda', flag: '🇦🇬' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+374', country: 'Armenia', flag: '🇦🇲' },
  { code: '+297', country: 'Aruba', flag: '🇦🇼' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+994', country: 'Azerbaijan', flag: '🇦🇿' },
  { code: '+1242', country: 'Bahamas', flag: '🇧🇸' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+1246', country: 'Barbados', flag: '🇧🇧' },
  { code: '+375', country: 'Belarus', flag: '🇧🇾' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+501', country: 'Belize', flag: '🇧🇿' },
  { code: '+229', country: 'Benin', flag: '🇧🇯' },
  { code: '+1441', country: 'Bermuda', flag: '🇧🇲' },
  { code: '+975', country: 'Bhutan', flag: '🇧🇹' },
  { code: '+591', country: 'Bolivia', flag: '🇧🇴' },
  { code: '+387', country: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+246', country: 'British Indian Ocean Territory', flag: '🇮🇴' },
  { code: '+673', country: 'Brunei', flag: '🇧🇳' },
  { code: '+359', country: 'Bulgaria', flag: '🇧🇬' },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+257', country: 'Burundi', flag: '🇧🇮' },
  { code: '+855', country: 'Cambodia', flag: '🇰🇭' },
  { code: '+237', country: 'Cameroon', flag: '🇨🇲' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+238', country: 'Cape Verde', flag: '🇨🇻' },
  { code: '+1345', country: 'Cayman Islands', flag: '🇰🇾' },
  { code: '+236', country: 'Central African Republic', flag: '🇨🇫' },
  { code: '+235', country: 'Chad', flag: '🇹🇩' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+61', country: 'Christmas Island', flag: '🇨🇽' },
  { code: '+61', country: 'Cocos Islands', flag: '🇨🇨' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+269', country: 'Comoros', flag: '🇰🇲' },
  { code: '+242', country: 'Congo', flag: '🇨🇬' },
  { code: '+243', country: 'Congo (DRC)', flag: '🇨🇩' },
  { code: '+682', country: 'Cook Islands', flag: '🇨🇰' },
  { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
  { code: '+225', country: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: '+385', country: 'Croatia', flag: '🇭🇷' },
  { code: '+53', country: 'Cuba', flag: '🇨🇺' },
  { code: '+599', country: 'Curaçao', flag: '🇨🇼' },
  { code: '+357', country: 'Cyprus', flag: '🇨🇾' },
  { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+253', country: 'Djibouti', flag: '🇩🇯' },
  { code: '+1767', country: 'Dominica', flag: '🇩🇲' },
  { code: '+1809', country: 'Dominican Republic', flag: '🇩🇴' },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
  { code: '+240', country: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: '+291', country: 'Eritrea', flag: '🇪🇷' },
  { code: '+372', country: 'Estonia', flag: '🇪🇪' },
  { code: '+268', country: 'Eswatini', flag: '🇸🇿' },
  { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
  { code: '+500', country: 'Falkland Islands', flag: '🇫🇰' },
  { code: '+298', country: 'Faroe Islands', flag: '🇫🇴' },
  { code: '+679', country: 'Fiji', flag: '🇫🇯' },
  { code: '+358', country: 'Finland', flag: '🇫🇮' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+594', country: 'French Guiana', flag: '🇬🇫' },
  { code: '+689', country: 'French Polynesia', flag: '🇵🇫' },
  { code: '+241', country: 'Gabon', flag: '🇬🇦' },
  { code: '+220', country: 'Gambia', flag: '🇬🇲' },
  { code: '+995', country: 'Georgia', flag: '🇬🇪' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+350', country: 'Gibraltar', flag: '🇬🇮' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+299', country: 'Greenland', flag: '🇬🇱' },
  { code: '+1473', country: 'Grenada', flag: '🇬🇩' },
  { code: '+590', country: 'Guadeloupe', flag: '🇬🇵' },
  { code: '+1671', country: 'Guam', flag: '🇬🇺' },
  { code: '+502', country: 'Guatemala', flag: '🇬🇹' },
  { code: '+44', country: 'Guernsey', flag: '🇬🇬' },
  { code: '+224', country: 'Guinea', flag: '🇬🇳' },
  { code: '+245', country: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: '+592', country: 'Guyana', flag: '🇬🇾' },
  { code: '+509', country: 'Haiti', flag: '🇭🇹' },
  { code: '+504', country: 'Honduras', flag: '🇭🇳' },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
  { code: '+36', country: 'Hungary', flag: '🇭🇺' },
  { code: '+354', country: 'Iceland', flag: '🇮🇸' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+98', country: 'Iran', flag: '🇮🇷' },
  { code: '+964', country: 'Iraq', flag: '🇮🇶' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
  { code: '+44', country: 'Isle of Man', flag: '🇮🇲' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+1876', country: 'Jamaica', flag: '🇯🇲' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+44', country: 'Jersey', flag: '🇯🇪' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+7', country: 'Kazakhstan', flag: '🇰🇿' },
  { code: '+686', country: 'Kiribati', flag: '🇰🇮' },
  { code: '+850', country: 'North Korea', flag: '🇰🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+996', country: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: '+856', country: 'Laos', flag: '🇱🇦' },
  { code: '+371', country: 'Latvia', flag: '🇱🇻' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
  { code: '+266', country: 'Lesotho', flag: '🇱🇸' },
  { code: '+231', country: 'Liberia', flag: '🇱🇷' },
  { code: '+218', country: 'Libya', flag: '🇱🇾' },
  { code: '+423', country: 'Liechtenstein', flag: '🇱🇮' },
  { code: '+370', country: 'Lithuania', flag: '🇱🇹' },
  { code: '+352', country: 'Luxembourg', flag: '🇱🇺' },
  { code: '+853', country: 'Macao', flag: '🇲🇴' },
  { code: '+389', country: 'North Macedonia', flag: '🇲🇰' },
  { code: '+261', country: 'Madagascar', flag: '🇲🇬' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+960', country: 'Maldives', flag: '🇲🇻' },
  { code: '+223', country: 'Mali', flag: '🇲🇱' },
  { code: '+356', country: 'Malta', flag: '🇲🇹' },
  { code: '+692', country: 'Marshall Islands', flag: '🇲🇭' },
  { code: '+596', country: 'Martinique', flag: '🇲🇶' },
  { code: '+222', country: 'Mauritania', flag: '🇲🇷' },
  { code: '+230', country: 'Mauritius', flag: '🇲🇺' },
  { code: '+262', country: 'Mayotte', flag: '🇾🇹' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+691', country: 'Micronesia', flag: '🇫🇲' },
  { code: '+373', country: 'Moldova', flag: '🇲🇩' },
  { code: '+377', country: 'Monaco', flag: '🇲🇨' },
  { code: '+976', country: 'Mongolia', flag: '🇲🇳' },
  { code: '+382', country: 'Montenegro', flag: '🇲🇪' },
  { code: '+1664', country: 'Montserrat', flag: '🇲🇸' },
  { code: '+212', country: 'Morocco', flag: '🇲🇦' },
  { code: '+258', country: 'Mozambique', flag: '🇲🇿' },
  { code: '+95', country: 'Myanmar', flag: '🇲🇲' },
  { code: '+264', country: 'Namibia', flag: '🇳🇦' },
  { code: '+674', country: 'Nauru', flag: '🇳🇷' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+687', country: 'New Caledonia', flag: '🇳🇨' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+505', country: 'Nicaragua', flag: '🇳🇮' },
  { code: '+227', country: 'Niger', flag: '🇳🇪' },
  { code: '+683', country: 'Niue', flag: '🇳🇺' },
  { code: '+672', country: 'Norfolk Island', flag: '🇳🇫' },
  { code: '+1670', country: 'Northern Mariana Islands', flag: '🇲🇵' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+680', country: 'Palau', flag: '🇵🇼' },
  { code: '+970', country: 'Palestine', flag: '🇵🇸' },
  { code: '+507', country: 'Panama', flag: '🇵🇦' },
  { code: '+675', country: 'Papua New Guinea', flag: '🇵🇬' },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾' },
  { code: '+51', country: 'Peru', flag: '🇵🇪' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+64', country: 'Pitcairn Islands', flag: '🇵🇳' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+1787', country: 'Puerto Rico', flag: '🇵🇷' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+262', country: 'Réunion', flag: '🇷🇪' },
  { code: '+40', country: 'Romania', flag: '🇷🇴' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
  { code: '+590', country: 'Saint Barthélemy', flag: '🇧🇱' },
  { code: '+290', country: 'Saint Helena', flag: '🇸🇭' },
  { code: '+1869', country: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { code: '+1758', country: 'Saint Lucia', flag: '🇱🇨' },
  { code: '+590', country: 'Saint Martin', flag: '🇲🇫' },
  { code: '+508', country: 'Saint Pierre and Miquelon', flag: '🇵🇲' },
  { code: '+1784', country: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { code: '+685', country: 'Samoa', flag: '🇼🇸' },
  { code: '+378', country: 'San Marino', flag: '🇸🇲' },
  { code: '+239', country: 'São Tomé and Príncipe', flag: '🇸🇹' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+221', country: 'Senegal', flag: '🇸🇳' },
  { code: '+381', country: 'Serbia', flag: '🇷🇸' },
  { code: '+248', country: 'Seychelles', flag: '🇸🇨' },
  { code: '+232', country: 'Sierra Leone', flag: '🇸🇱' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+1721', country: 'Sint Maarten', flag: '🇸🇽' },
  { code: '+421', country: 'Slovakia', flag: '🇸🇰' },
  { code: '+386', country: 'Slovenia', flag: '🇸🇮' },
  { code: '+677', country: 'Solomon Islands', flag: '🇸🇧' },
  { code: '+252', country: 'Somalia', flag: '🇸🇴' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+249', country: 'Sudan', flag: '🇸🇩' },
  { code: '+597', country: 'Suriname', flag: '🇸🇷' },
  { code: '+47', country: 'Svalbard and Jan Mayen', flag: '🇸🇯' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+963', country: 'Syria', flag: '🇸🇾' },
  { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
  { code: '+992', country: 'Tajikistan', flag: '🇹🇯' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+670', country: 'Timor-Leste', flag: '🇹🇱' },
  { code: '+228', country: 'Togo', flag: '🇹🇬' },
  { code: '+690', country: 'Tokelau', flag: '🇹🇰' },
  { code: '+676', country: 'Tonga', flag: '🇹🇴' },
  { code: '+1868', country: 'Trinidad and Tobago', flag: '🇹🇹' },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+993', country: 'Turkmenistan', flag: '🇹🇲' },
  { code: '+1649', country: 'Turks and Caicos Islands', flag: '🇹🇨' },
  { code: '+688', country: 'Tuvalu', flag: '🇹🇻' },
  { code: '+1340', country: 'US Virgin Islands', flag: '🇻🇮' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+998', country: 'Uzbekistan', flag: '🇺🇿' },
  { code: '+678', country: 'Vanuatu', flag: '🇻🇺' },
  { code: '+379', country: 'Vatican City', flag: '🇻🇦' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+681', country: 'Wallis and Futuna', flag: '🇼🇫' },
  { code: '+212', country: 'Western Sahara', flag: '🇪🇭' },
  { code: '+967', country: 'Yemen', flag: '🇾🇪' },
]

const SimplifiedPayoutModal: React.FC<SimplifiedPayoutModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableBalance,
  isLoading
}) => {
  const t = useTranslations('agent')
  
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer')
  const [description, setDescription] = useState('')
  
  // Bank Transfer Details
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    routingNumber: '',
    accountName: '',
    bankName: ''
  })
  
  // Airtime Top-up Details
  const [selectedCountryCode, setSelectedCountryCode] = useState('+263')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', description: 'Traditional bank account transfer' },
    { value: 'airtime_topup', label: 'Airtime Top-up', icon: '📱', description: 'Mobile airtime credit to your phone' }
  ]

  const resetForm = () => {
    setAmount('')
    setMethod('bank_transfer')
    setDescription('')
    setBankDetails({ accountNumber: '', routingNumber: '', accountName: '', bankName: '' })
    setSelectedCountryCode('+263')
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
    let paymentDetails: any = {}
    
    if (method === 'bank_transfer') {
      if (!bankDetails.accountNumber || !bankDetails.routingNumber || !bankDetails.accountName || !bankDetails.bankName) {
        alert('Please fill in all bank account details')
        return
      }
      paymentDetails.bankAccount = bankDetails
    } else if (method === 'airtime_topup') {
      if (!phoneNumber) {
        alert('Please provide a phone number')
        return
      }
      paymentDetails.airtimeTopup = {
        phoneNumber: getFullPhoneNumber(),
        accountName: accountName || undefined
      }
    }

    const payoutRequest: CreatePayoutRequest = {
      amount: amountValue,
      method,
      description: description || `${method.replace('_', ' ')} payout`,
      paymentDetails
    }

    try {
      await onSubmit(payoutRequest)
      resetForm()
      onClose()
    } catch (error) {
      // Error handled by parent component
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCountryDropdown) {
        const target = event.target as HTMLElement
        if (!target.closest('.country-selector')) {
          setShowCountryDropdown(false)
          setCountrySearch('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCountryDropdown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Request Payout</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Available Balance: <span className="font-semibold text-green-600">${availableBalance}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Payout Amount ($)
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min={MINIMUM_PAYOUT_AMOUNT.toString()}
              max={availableBalance}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Enter amount (minimum $${MINIMUM_PAYOUT_AMOUNT})`}
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="space-y-3">
              {paymentMethods.map((paymentMethod) => (
                <button
                  key={paymentMethod.value}
                  type="button"
                  onClick={() => setMethod(paymentMethod.value as PaymentMethod)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    method === paymentMethod.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{paymentMethod.icon}</span>
                    <div>
                      <div className="font-semibold text-lg">{paymentMethod.label}</div>
                      <div className="text-sm text-gray-600">{paymentMethod.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter description for this payout"
            />
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {paymentMethods.find(m => m.value === method)?.label} Details
            </h3>

            {method === 'bank_transfer' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your account number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number</label>
                  <input
                    type="text"
                    value={bankDetails.routingNumber}
                    onChange={(e) => setBankDetails({...bankDetails, routingNumber: e.target.value})}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter routing number"
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
                    placeholder="Full name on account"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Name of your bank"
                    required
                  />
                </div>
              </div>
            )}

            {method === 'airtime_topup' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <div className="flex">
                    {/* Country Code Selector */}
                    <div className="relative country-selector">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className="flex items-center px-3 py-3 border border-gray-300 border-r-0 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <span className="mr-2">
                          {countryCodes.find(c => c.code === selectedCountryCode)?.flag}
                        </span>
                        <span className="mr-1 font-mono text-sm">{selectedCountryCode}</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Country Dropdown */}
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-80 overflow-hidden">
                          {/* Search Input */}
                          <div className="p-3 border-b border-gray-200">
                            <input
                              type="text"
                              placeholder="Search countries..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                          </div>
                          
                          {/* Countries List */}
                          <div className="max-h-60 overflow-y-auto">
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map((country) => (
                                <button
                                  key={country.code}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCountryCode(country.code)
                                    setShowCountryDropdown(false)
                                    setCountrySearch('')
                                  }}
                                  className={`w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center space-x-3 ${
                                    selectedCountryCode === country.code ? 'bg-blue-50 text-blue-600' : ''
                                  }`}
                                >
                                  <span className="text-lg">{country.flag}</span>
                                  <span className="font-mono text-sm min-w-[60px]">{country.code}</span>
                                  <span className="text-sm truncate">{country.country}</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                                No countries found matching "{countrySearch}"
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, '')
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
                    placeholder="Name for airtime account (optional)"
                  />
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">📱 Airtime Top-up Information:</p>
                      <ul className="space-y-1 text-blue-700">
                        <li>• Airtime will be credited directly to your phone</li>
                        <li>• Processing time: Instant to 2 hours</li>
                        <li>• Works with all major carriers</li>
                        <li>• Double-check your phone number!</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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

export default SimplifiedPayoutModal
