'use client'

import { useState, useRef, useEffect } from 'react'

// Comprehensive list of all country codes (same as in SimplifiedPayoutModal)
const countryCodes = [
  // Primary business country first
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  
  // Popular/African countries
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
  { code: '+1284', country: 'British Virgin Islands', flag: '🇻🇬' },
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
  { code: '+682', country: 'Cook Islands', flag: '🇨🇰' },
  { code: '+506', country: 'Costa Rica', flag: '🇨🇷' },
  { code: '+385', country: 'Croatia', flag: '🇭🇷' },
  { code: '+53', country: 'Cuba', flag: '🇨🇺' },
  { code: '+599', country: 'Curacao', flag: '🇨🇼' },
  { code: '+357', country: 'Cyprus', flag: '🇨🇾' },
  { code: '+420', country: 'Czech Republic', flag: '🇨🇿' },
  { code: '+243', country: 'Democratic Republic of the Congo', flag: '🇨🇩' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+253', country: 'Djibouti', flag: '🇩🇯' },
  { code: '+1767', country: 'Dominica', flag: '🇩🇲' },
  { code: '+1849', country: 'Dominican Republic', flag: '🇩🇴' },
  { code: '+670', country: 'East Timor', flag: '🇹🇱' },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+503', country: 'El Salvador', flag: '🇸🇻' },
  { code: '+240', country: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: '+291', country: 'Eritrea', flag: '🇪🇷' },
  { code: '+372', country: 'Estonia', flag: '🇪🇪' },
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
  { code: '+225', country: 'Ivory Coast', flag: '🇨🇮' },
  { code: '+1876', country: 'Jamaica', flag: '🇯🇲' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+44', country: 'Jersey', flag: '🇯🇪' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+7', country: 'Kazakhstan', flag: '🇰🇿' },
  { code: '+686', country: 'Kiribati', flag: '🇰🇮' },
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
  { code: '+853', country: 'Macau', flag: '🇲🇴' },
  { code: '+389', country: 'Macedonia', flag: '🇲🇰' },
  { code: '+261', country: 'Madagascar', flag: '🇲🇬' },
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
  { code: '+850', country: 'North Korea', flag: '🇰🇵' },
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
  { code: '+64', country: 'Pitcairn', flag: '🇵🇳' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+1939', country: 'Puerto Rico', flag: '🇵🇷' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+242', country: 'Republic of the Congo', flag: '🇨🇬' },
  { code: '+262', country: 'Reunion', flag: '🇷🇪' },
  { code: '+40', country: 'Romania', flag: '🇷🇴' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
  { code: '+590', country: 'Saint Barthelemy', flag: '🇧🇱' },
  { code: '+290', country: 'Saint Helena', flag: '🇸🇭' },
  { code: '+1869', country: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { code: '+1758', country: 'Saint Lucia', flag: '🇱🇨' },
  { code: '+590', country: 'Saint Martin', flag: '🇲🇫' },
  { code: '+508', country: 'Saint Pierre and Miquelon', flag: '🇵🇲' },
  { code: '+1784', country: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { code: '+685', country: 'Samoa', flag: '🇼🇸' },
  { code: '+378', country: 'San Marino', flag: '🇸🇲' },
  { code: '+239', country: 'Sao Tome and Principe', flag: '🇸🇹' },
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
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+211', country: 'South Sudan', flag: '🇸🇸' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+249', country: 'Sudan', flag: '🇸🇩' },
  { code: '+597', country: 'Suriname', flag: '🇸🇷' },
  { code: '+47', country: 'Svalbard and Jan Mayen', flag: '🇸🇯' },
  { code: '+268', country: 'Swaziland', flag: '🇸🇿' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+963', country: 'Syria', flag: '🇸🇾' },
  { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
  { code: '+992', country: 'Tajikistan', flag: '🇹🇯' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+228', country: 'Togo', flag: '🇹🇬' },
  { code: '+690', country: 'Tokelau', flag: '🇹🇰' },
  { code: '+676', country: 'Tonga', flag: '🇹🇴' },
  { code: '+1868', country: 'Trinidad and Tobago', flag: '🇹🇹' },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+993', country: 'Turkmenistan', flag: '🇹🇲' },
  { code: '+1649', country: 'Turks and Caicos Islands', flag: '🇹🇨' },
  { code: '+688', country: 'Tuvalu', flag: '🇹🇻' },
  { code: '+1340', country: 'U.S. Virgin Islands', flag: '🇻🇮' },
  { code: '+380', country: 'Ukraine', flag: '🇺🇦' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  { code: '+998', country: 'Uzbekistan', flag: '🇺🇿' },
  { code: '+678', country: 'Vanuatu', flag: '🇻🇺' },
  { code: '+379', country: 'Vatican', flag: '🇻🇦' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+681', country: 'Wallis and Futuna', flag: '🇼🇫' },
  { code: '+212', country: 'Western Sahara', flag: '🇪🇭' },
  { code: '+967', country: 'Yemen', flag: '🇾🇪' },
]

interface PhoneNumberInputProps {
  value: string
  onChange: (fullPhoneNumber: string) => void
  countryCode?: string
  onCountryCodeChange?: (countryCode: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  label?: string
  showFullNumber?: boolean
}

export default function PhoneNumberInput({
  value,
  onChange,
  countryCode = '+44',
  onCountryCodeChange,
  placeholder = "7123456789",
  required = false,
  className = '',
  label = 'Phone Number',
  showFullNumber = true
}: PhoneNumberInputProps) {
  const [selectedCountryCode, setSelectedCountryCode] = useState(countryCode)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const prevValueRef = useRef(value)
  const prevCountryCodeRef = useRef(countryCode)
  const isInternalUpdateRef = useRef(false)

  // Update selectedCountryCode when countryCode prop changes
  useEffect(() => {
    if (countryCode !== prevCountryCodeRef.current) {
      setSelectedCountryCode(countryCode)
      prevCountryCodeRef.current = countryCode
    }
  }, [countryCode])

  // Parse initial value if provided (only when value actually changes from external source)
  useEffect(() => {
    if (value !== prevValueRef.current && !isInternalUpdateRef.current) {
      prevValueRef.current = value
      
      if (value) {
        // Try to extract country code and number from full phone number
        const country = countryCodes.find(c => value.startsWith(c.code))
        if (country) {
          setSelectedCountryCode(country.code)
          setPhoneNumber(value.substring(country.code.length))
        } else {
          setPhoneNumber(value)
        }
      } else {
        setPhoneNumber('')
      }
    }
  }, [value])

  // Update parent when internal state changes
  useEffect(() => {
    const fullNumber = getFullPhoneNumber()
    
    // Only update if this is genuinely a new internal change
    if (fullNumber !== prevValueRef.current) {
      isInternalUpdateRef.current = true
      prevValueRef.current = fullNumber
      onChange(fullNumber)
      
      // Reset flag asynchronously
      setTimeout(() => {
        isInternalUpdateRef.current = false
      }, 0)
    }
    
    if (onCountryCodeChange) {
      onCountryCodeChange(selectedCountryCode)
    }
  }, [selectedCountryCode, phoneNumber])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false)
        setCountrySearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getFullPhoneNumber = () => {
    return `${selectedCountryCode}${phoneNumber.replace(/^0+/, '')}` // Remove leading zeros
  }

  // Filter countries based on search
  const filteredCountries = countryCodes.filter(country => 
    country.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.includes(countrySearch)
  )

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit length to prevent infinite loops
    const numericValue = e.target.value.replace(/\D/g, '')
    
    // Limit phone number length (15 digits is international standard max)
    const limitedValue = numericValue.slice(0, 15)
    
    // Prevent infinite loops by checking if we're actually changing the value
    if (limitedValue !== phoneNumber) {
      setPhoneNumber(limitedValue)
    }
  }

  const handleCountrySelect = (country: typeof countryCodes[0]) => {
    setSelectedCountryCode(country.code)
    setShowCountryDropdown(false)
    setCountrySearch('')
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-3">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="flex">
        {/* Country Code Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
            className="flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 h-[48px] sm:h-[60px] border-2 border-gray-200 border-r-0 rounded-l-xl sm:rounded-l-2xl bg-gray-50 hover:bg-white hover:border-pt-turquoise focus:outline-none focus:ring-0 focus:border-pt-turquoise transition-colors"
          >
            <span className="mr-2">
              {countryCodes.find(c => c.code === selectedCountryCode)?.flag}
            </span>
            <span className="mr-1 font-mono text-base text-pt-dark-gray">{selectedCountryCode}</span>
            <svg 
              className={`w-4 h-4 text-pt-light-gray transition-transform duration-200 ${
                showCountryDropdown ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Country Dropdown */}
          {showCountryDropdown && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-pt-light-gray-300 rounded-lg shadow-lg z-10 max-h-80 overflow-hidden">
              {/* Search Input */}
              <div className="p-3 border-b border-pt-light-gray-200">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full px-3 py-2 border border-pt-light-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pt-turquoise"
                  autoFocus
                />
              </div>
              
              {/* Countries List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country, index) => (
                    <button
                      key={`${country.code}-${country.country}-${index}`}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={`w-full px-4 py-3 text-left hover:bg-pt-turquoise-50 flex items-center space-x-3 transition-colors ${
                        selectedCountryCode === country.code ? 'bg-pt-turquoise-50 text-pt-turquoise' : 'text-pt-dark-gray'
                      }`}
                    >
                      <span className="text-lg">{country.flag}</span>
                      <span className="font-mono text-sm min-w-[60px]">{country.code}</span>
                      <span className="text-sm truncate">{country.country}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-pt-light-gray text-sm text-center">
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
          onChange={handlePhoneNumberChange}
          className="flex-1 px-4 sm:px-6 py-3 sm:py-4 h-[48px] sm:h-[60px] border-2 border-gray-200 rounded-r-xl sm:rounded-r-2xl focus:outline-none focus:ring-0 focus:border-pt-turquoise bg-gray-50 focus:bg-white text-pt-dark-gray text-base sm:text-lg transition-colors"
          placeholder={placeholder}
          required={required}
        />
      </div>
      
      {showFullNumber && phoneNumber && (
        <p className="text-sm text-pt-light-gray mt-1">
          Full number: <span className="font-mono font-medium text-pt-dark-gray">{getFullPhoneNumber()}</span>
        </p>
      )}
    </div>
  )
}
