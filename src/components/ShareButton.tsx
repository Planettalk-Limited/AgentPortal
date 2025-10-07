'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { shareReferralLink, generateReferralUrl, copyToClipboard } from '@/lib/utils/config'

interface ShareButtonProps {
  code: string
  agentName?: string
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'compact'
  size?: 'sm' | 'md' | 'lg'
  showUrl?: boolean
  showCode?: boolean
}

export default function ShareButton({ 
  code, 
  agentName = 'Agent',
  className = '',
  variant = 'primary',
  size = 'md',
  showUrl = false,
  showCode = false
}: ShareButtonProps) {
  const locale = useLocale()
  const t = useTranslations('dashboard')
  const [isSharing, setIsSharing] = useState(false)
  const [shareResult, setShareResult] = useState<{ success: boolean; method: string; error?: string } | null>(null)

  const handleShare = async () => {
    try {
      setIsSharing(true)
      setShareResult(null)
      
      const result = await shareReferralLink(code, agentName, locale)
      setShareResult(result)
      
      // Clear success message after 3 seconds
      if (result.success) {
        setTimeout(() => setShareResult(null), 3000)
      }
    } catch (error) {
      setShareResult({ 
        success: false, 
        method: 'clipboard', 
        error: t('failedToShareLink') 
      })
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyCode = async () => {
    try {
      await copyToClipboard(code)
      setShareResult({ success: true, method: 'clipboard' })
      setTimeout(() => setShareResult(null), 2000)
    } catch (error) {
      setShareResult({ success: false, method: 'clipboard', error: t('failedToShareLink') })
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-pt-turquoise text-white hover:bg-pt-turquoise-600 shadow-sm border border-transparent'
      case 'secondary':
        return 'bg-pt-light-gray-100 text-pt-dark-gray hover:bg-pt-light-gray-200 border border-pt-light-gray-300'
      case 'outline':
        return 'border border-pt-turquoise text-pt-turquoise hover:bg-pt-turquoise hover:text-white bg-white'
      case 'compact':
        return 'bg-pt-turquoise-50 text-pt-turquoise hover:bg-pt-turquoise-100 border border-pt-turquoise-200'
      default:
        return 'bg-pt-turquoise text-white hover:bg-pt-turquoise-600 shadow-sm border border-transparent'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm'
      case 'md':
        return 'px-4 py-2.5 text-sm'
      case 'lg':
        return 'px-6 py-3 text-base'
      default:
        return 'px-4 py-2.5 text-sm'
    }
  }

  const referralUrl = generateReferralUrl(code, locale)

  // Compact variant for dashboard integration
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center bg-white rounded-lg border border-pt-light-gray-200 shadow-sm ${className}`}>
        {showCode && (
          <div className="px-3 py-2 border-r border-pt-light-gray-200">
            <span className="text-xs font-medium text-pt-light-gray uppercase tracking-wide">Code</span>
            <div className="font-mono text-sm font-semibold text-pt-turquoise">{code}</div>
          </div>
        )}
        
        <button
          onClick={handleCopyCode}
          className="px-3 py-2 text-pt-dark-gray hover:text-pt-turquoise transition-colors"
          title="Copy code"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        
        <button
          onClick={handleShare}
          disabled={isSharing}
          className="px-3 py-2 text-pt-turquoise hover:bg-pt-turquoise-50 rounded-r-lg transition-colors disabled:opacity-50"
          title="Share referral link"
        >
          {isSharing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pt-turquoise"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          )}
        </button>
        
        {shareResult && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-pt-dark-gray text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
            {shareResult.success ? (
              shareResult.method === 'share' 
                ? 'Link shared!'
                : 'Copied!'
            ) : (
              'Failed to share'
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={`
          inline-flex items-center justify-center space-x-2 
          font-medium rounded-lg transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${getVariantClasses()} ${getSizeClasses()} ${className}
        `}
      >
        {isSharing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>{t('sharing')}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>{t('shareReferralLink')}</span>
          </>
        )}
      </button>

      {/* Show URL if requested */}
      {showUrl && (
        <div className="bg-pt-light-gray-50 border border-pt-light-gray-200 rounded-lg p-3">
          <label className="block text-xs font-medium text-pt-dark-gray mb-1">
            {t('referralUrl')}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={referralUrl}
              readOnly
              className="flex-1 text-sm bg-white border border-pt-light-gray-300 rounded px-2 py-1 font-mono text-pt-dark-gray"
            />
            <button
              onClick={() => copyToClipboard(referralUrl)}
              className="text-pt-turquoise hover:text-pt-turquoise-600 p-1 rounded transition-colors"
              title="Copy URL"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Share result feedback */}
      {shareResult && !showUrl && (
        <div className={`text-sm p-3 rounded-lg border ${
          shareResult.success 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {shareResult.success ? (
            shareResult.method === 'share' 
              ? '✅ Link shared successfully!'
              : '✅ Link copied to clipboard!'
          ) : (
            `❌ ${shareResult.error || 'Failed to share link'}`
          )}
        </div>
      )}
    </div>
  )
}
