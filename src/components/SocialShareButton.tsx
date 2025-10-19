'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'

interface SocialShareButtonProps {
  code: string
  agentName?: string
  className?: string
}

export default function SocialShareButton({ 
  code, 
  agentName = 'Agent',
  className = ''
}: SocialShareButtonProps) {
  const locale = useLocale()
  const t = useTranslations('dashboard')
  const [copySuccess, setCopySuccess] = useState(false)
  const [showAll, setShowAll] = useState(false)

  // Generate the referral URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const referralUrl = `${baseUrl}/${locale}/referral/${code}`

  // Localized share messages
  const getShareMessage = () => {
    const messages = {
      en: `🌟 Join PlanetTalk for affordable international calls & top-ups! Use my agent code: ${code} when you sign up. ${referralUrl}`,
      es: `🌟 ¡Únete a PlanetTalk para llamadas internacionales y recargas económicas! Usa mi código de agente: ${code} al registrarte. ${referralUrl}`,
      fr: `🌟 Rejoignez PlanetTalk pour des appels internationaux et recharges abordables ! Utilisez mon code d'agent : ${code} lors de votre inscription. ${referralUrl}`,
      pt: `🌟 Junte-se ao PlanetTalk para chamadas internacionais e recargas acessíveis! Use meu código de agente: ${code} ao se cadastrar. ${referralUrl}`
    }
    return messages[locale as keyof typeof messages] || messages.en
  }

  const shareMessage = getShareMessage()
  const encodedMessage = encodeURIComponent(shareMessage)

  // Copy to clipboard function
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareMessage
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  // Social media share functions
  const shareOnWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
  }

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodedMessage}`, '_blank')
  }

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodedMessage}`, '_blank')
  }

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`, '_blank')
  }

  const shareOnTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodedMessage}`, '_blank')
  }

  const shareOnInstagram = () => {
    // Instagram doesn't support direct link sharing, so we copy to clipboard
    copyToClipboard()
  }

  const shareOnTikTok = () => {
    // TikTok doesn't support direct link sharing, so we copy to clipboard
    copyToClipboard()
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Join PlanetTalk - Agent Code: ${code}`)
    const emailBody = encodeURIComponent(`Hi,\n\nMy name is ${agentName}.\n\nI'd like to invite you to download the PlanetTalk app for great rates on international calls and mobile top-ups.\n\nPlease use my agent code: ${code} when you sign up - this helps support my business.\n\nDownload the app here: ${referralUrl}\n\nThanks!\n${agentName.split(' ')[0]}\n\n--\nFor questions, contact: agent@planettalk.com`)
    window.open(`mailto:?subject=${subject}&body=${emailBody}`, '_blank')
  }

  const shareViaSMS = () => {
    window.open(`sms:?body=${encodedMessage}`, '_blank')
  }


  // Define all social buttons
  const socialButtons = [
    {
      onClick: shareOnWhatsApp,
      bgColor: 'bg-green-50 hover:bg-green-100',
      borderColor: 'border-green-100',
      iconBg: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-green-700',
      label: 'WhatsApp',
      icon: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>,
      iconSize: 'w-5 h-5'
    },
    {
      onClick: shareViaEmail,
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-100',
      iconBg: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-blue-700',
      label: 'Email',
      icon: <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h1.309l9.055 6.791 9.055-6.791h1.309c.904 0 1.636.732 1.636 1.636z"/>,
      iconSize: 'w-4 h-4'
    },
    {
      onClick: shareOnFacebook,
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-100',
      iconBg: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-blue-700',
      label: 'Facebook',
      icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>,
      iconSize: 'w-4 h-4'
    },
    {
      onClick: copyToClipboard,
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      borderColor: 'border-indigo-100',
      iconBg: 'bg-indigo-600 hover:bg-indigo-700',
      textColor: 'text-indigo-700',
      label: 'Copy',
      icon: <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>,
      iconSize: 'w-4 h-4'
    },
    {
      onClick: shareOnTwitter,
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      borderColor: 'border-gray-100',
      iconBg: 'bg-black hover:bg-gray-800',
      textColor: 'text-gray-700',
      label: 'Twitter',
      icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>,
      iconSize: 'w-4 h-4'
    },
    {
      onClick: shareOnLinkedIn,
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-100',
      iconBg: 'bg-blue-700 hover:bg-blue-800',
      textColor: 'text-blue-700',
      label: 'LinkedIn',
      icon: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>,
      iconSize: 'w-4 h-4'
    },
    {
      onClick: shareOnTelegram,
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-100',
      iconBg: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-blue-700',
      label: 'Telegram',
      icon: <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>,
      iconSize: 'w-4 h-4'
    },
    {
      onClick: shareOnInstagram,
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100',
      borderColor: 'border-purple-100',
      iconBg: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600',
      textColor: 'text-purple-700',
      label: 'Instagram',
      icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>,
      iconSize: 'w-4 h-4'
    },
    {
      onClick: shareOnTikTok,
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      borderColor: 'border-gray-100',
      iconBg: 'bg-black hover:bg-gray-800',
      textColor: 'text-gray-700',
      label: 'TikTok',
      icon: <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>,
      iconSize: 'w-4 h-4'
    },
    {
      onClick: shareViaSMS,
      bgColor: 'bg-green-50 hover:bg-green-100',
      borderColor: 'border-green-100',
      iconBg: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-green-700',
      label: 'SMS',
      icon: <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>,
      iconSize: 'w-4 h-4'
    }
  ]

  // On large screens, always show all; on smaller screens, respect showAll state
  const visibleButtons = (typeof window !== 'undefined' && window.innerWidth >= 1024) || showAll 
    ? socialButtons 
    : socialButtons.slice(0, 3)
  const hasMore = socialButtons.length > 3

  return (
    <div className={`${className}`}>
      {/* Social Media Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {socialButtons.map((button, index) => (
        <button
            key={index}
            onClick={button.onClick}
            className={`flex flex-col items-center justify-center p-3 sm:p-3.5 ${button.bgColor} rounded-xl transition-all duration-200 group border ${button.borderColor} ${
              !showAll && index >= 3 ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className={`w-10 h-10 sm:w-11 sm:h-11 ${button.iconBg} text-white rounded-full flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform shadow-lg`}>
              <svg className={button.iconSize} viewBox="0 0 24 24" fill="currentColor">
                {button.icon}
            </svg>
          </div>
            <span className={`text-xs font-medium ${button.textColor}`}>{button.label}</span>
        </button>
        ))}
          </div>

      {/* Show More / Show Less Button - Only visible below lg breakpoint */}
      {hasMore && (
        <div className="mt-3 sm:mt-4 lg:hidden">
        <button
            onClick={() => setShowAll(!showAll)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors duration-200 border border-gray-200"
          >
            <span className="text-sm font-medium">
              {showAll ? t('showLess') : t('showMore', { count: socialButtons.length - 3 })}
            </span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
        </button>
          </div>
      )}

      {/* Success Message */}
      {copySuccess && (
        <div className="text-center mt-3">
          <div className="inline-flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Copied!
          </div>
        </div>
      )}
    </div>
  )
}
