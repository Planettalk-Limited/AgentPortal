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

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join PlanetTalk - Agent Code: ${code}`,
          text: shareMessage,
          url: referralUrl
        })
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback to copy
      copyToClipboard()
    }
  }

  // Define social buttons - Only 6 buttons in specific order
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
      onClick: shareNative,
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      borderColor: 'border-purple-100',
      iconBg: 'bg-purple-600 hover:bg-purple-700',
      textColor: 'text-purple-700',
      label: 'Share',
      icon: <path d="M15 8a3 3 0 11-6 0 3 3 0 016 0zM6 21V10.5a1.5 1.5 0 011.5-1.5h9a1.5 1.5 0 011.5 1.5V21m-12 0h12m-12 0a1.5 1.5 0 01-1.5-1.5V15m13.5 6a1.5 1.5 0 001.5-1.5V15M12 3v6m-3-2l3-3 3 3" />,
      iconSize: 'w-5 h-5'
    }
  ]

  return (
    <div className={`${className}`}>
      {/* Social Media Grid - 2 columns, 3 rows */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {socialButtons.map((button, index) => (
        <button
            key={index}
            onClick={button.onClick}
            className={`flex flex-col items-center justify-center p-3 sm:p-3.5 lg:p-4 ${button.bgColor} rounded-xl transition-all duration-200 group border ${button.borderColor}`}
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
