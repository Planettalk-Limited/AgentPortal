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
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://agent-portal.planettalk.com'
}

/**
 * Generate a referral URL for sharing
 * @param code - The referral code
 * @param locale - The language locale (en, fr, pt, es)
 * @returns Complete referral URL
 */
export function generateReferralUrl(code: string, locale: string = 'en'): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/${locale}/referral/${code}`
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
 * Share referral link using Web Share API or fallback to clipboard
 * @param code - The referral code
 * @param agentName - Name of the agent for the share message
 * @param locale - The language locale
 */
export async function shareReferralLink(
  code: string, 
  agentName: string = 'Agent', 
  locale: string = 'en'
): Promise<{ success: boolean; method: 'share' | 'clipboard'; error?: string }> {
  const url = generateReferralUrl(code, locale)
  const title = `Join PlanetTalk with ${agentName}'s referral code`
  const text = `Use my referral code ${code} to join PlanetTalk and start saving on international calls and top-ups!`

  try {
    // Try Web Share API first (mobile devices)
    if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      await navigator.share({
        title,
        text,
        url
      })
      return { success: true, method: 'share' }
    } else {
      // Fallback to clipboard
      await copyToClipboard(url)
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
