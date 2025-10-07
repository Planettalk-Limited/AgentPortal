/**
 * Configuration utilities for environment-based settings
 */

/**
 * Get the base URL for the application
 * In development: http://localhost:3001
 * In production: Use NEXT_PUBLIC_BASE_URL environment variable
 */
export function getBaseUrl(): string {
  // Check if we're in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001'
  }
  
  // In production, use the environment variable
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://portal.planettalk.com'
}

/**
 * Generate the PlanetTalk app share URL
 * @param code - The agent code (included in share message, not URL)
 * @param locale - The language locale (en, fr, pt, es)
 * @returns PlanetTalk app share URL
 */
export function generateReferralUrl(code: string, locale: string = 'en'): string {
  // Use the official PlanetTalk app share link
  return 'https://app.planettalk.com/Jxk8/shareapp'
}

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copy is complete
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    // Use modern clipboard API if available
    await navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'absolute'
    textArea.style.left = '-999999px'
    document.body.prepend(textArea)
    textArea.select()
    
    try {
      document.execCommand('copy')
    } finally {
      textArea.remove()
    }
  }
}

/**
 * Share the PlanetTalk app with agent code using Web Share API or fallback to clipboard
 * @param code - The agent code to include in the message
 * @param agentName - Name of the agent for the share message
 * @param locale - The language locale
 */
export async function shareReferralLink(
  code: string, 
  agentName: string = 'Agent', 
  locale: string = 'en'
): Promise<{ success: boolean; method: 'share' | 'clipboard'; error?: string }> {
  const url = generateReferralUrl(code, locale)
  
  // Localized messages
  const messages = {
    en: {
      title: `Download PlanetTalk - Agent Code: ${code}`,
      text: `Hi! Download the PlanetTalk app for great international calls & top-ups. Use my agent code: ${code} when you sign up!`
    },
    es: {
      title: `Descarga PlanetTalk - Código de Agente: ${code}`,
      text: `¡Hola! Descarga la app PlanetTalk para llamadas internacionales y recargas económicas. ¡Usa mi código de agente: ${code} al registrarte!`
    },
    fr: {
      title: `Téléchargez PlanetTalk - Code d'Agent: ${code}`,
      text: `Salut! Téléchargez l'app PlanetTalk pour des appels internationaux et recharges pas chers. Utilisez mon code d'agent: ${code} lors de votre inscription!`
    },
    pt: {
      title: `Baixe o PlanetTalk - Código de Agente: ${code}`,
      text: `Oi! Baixe o app PlanetTalk para chamadas internacionais e recargas baratas. Use meu código de agente: ${code} ao se cadastrar!`
    }
  }
  
  const message = messages[locale as keyof typeof messages] || messages.en

  try {
    // Try Web Share API first (mobile devices)
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      await navigator.share({
        title: message.title,
        text: message.text,
        url
      })
      return { success: true, method: 'share' }
    } else {
      // Fallback to clipboard - copy the full message with URL
      const fullMessage = `${message.text}\\n\\n${url}`
      await copyToClipboard(fullMessage)
      return { success: true, method: 'clipboard' }
    }
  } catch (error) {
    console.error('Failed to share:', error)
    return { 
      success: false, 
      method: 'clipboard', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
