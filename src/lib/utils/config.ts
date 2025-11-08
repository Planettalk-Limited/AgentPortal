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
      text: `Download PlanetTalk to support and connect with your loved ones.

Use my Code ${code} to enjoy a 100% bonus on your first top-up.

• Cheap international calls
• Send airtime and data
• Buy gift vouchers
• Pay utility bills for family abroad (Water, Electricity, etc.)

Visit ${url} to download PlanetTalk today!`
    },
    es: {
      title: `Descarga PlanetTalk - Código de Agente: ${code}`,
      text: `Descarga PlanetTalk para apoyar y conectarte con tus seres queridos.

Usa mi Código ${code} para disfrutar de un bono del 100% en tu primera recarga.

• Llamadas internacionales económicas
• Envía tiempo aire y datos
• Compra cupones de regalo
• Paga facturas de servicios para familiares en el extranjero (Agua, Electricidad, etc.)

¡Visita ${url} para descargar PlanetTalk hoy!`
    },
    fr: {
      title: `Téléchargez PlanetTalk - Code d'Agent: ${code}`,
      text: `Téléchargez PlanetTalk pour soutenir et rester connecté avec vos proches.

Utilisez mon Code ${code} pour bénéficier d'un bonus de 100% sur votre première recharge.

• Appels internationaux bon marché
• Envoyez du crédit et des données
• Achetez des bons cadeaux
• Payez les factures de services pour votre famille à l'étranger (Eau, Électricité, etc.)

Visitez ${url} pour télécharger PlanetTalk dès aujourd'hui !`
    },
    pt: {
      title: `Baixe o PlanetTalk - Código de Agente: ${code}`,
      text: `Baixe o PlanetTalk para apoiar e se conectar com seus entes queridos.

Use meu Código ${code} para aproveitar um bônus de 100% na sua primeira recarga.

• Chamadas internacionais baratas
• Envie crédito e dados
• Compre vales-presente
• Pague contas de serviços para familiares no exterior (Água, Eletricidade, etc.)

Visite ${url} para baixar o PlanetTalk hoje!`
    }
  }
  
  const message = messages[locale as keyof typeof messages] || messages.en

  try {
    // Try Web Share API first (mobile devices)
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      await navigator.share({
        title: message.title,
        text: message.text
      })
      return { success: true, method: 'share' }
    } else {
      // Fallback to clipboard - copy the full message (URL already included)
      await copyToClipboard(message.text)
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
