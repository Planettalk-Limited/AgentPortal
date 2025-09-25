/**
 * Currency formatting utilities
 */

/**
 * Safely format a currency amount to 2 decimal places
 * Handles both string and number inputs
 */
export function formatCurrency(amount: string | number | null | undefined): string {
  // Handle null/undefined cases
  if (amount === null || amount === undefined) {
    return '0.00'
  }
  
  // Convert to number
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  // Handle NaN cases
  if (isNaN(numAmount)) {
    return '0.00'
  }
  
  return numAmount.toFixed(2)
}

/**
 * Format currency with dollar sign
 */
export function formatCurrencyWithSymbol(amount: string | number | null | undefined): string {
  return `$${formatCurrency(amount)}`
}

/**
 * Parse currency string to number
 */
export function parseCurrency(amount: string | number | null | undefined): number {
  if (amount === null || amount === undefined) {
    return 0
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return isNaN(numAmount) ? 0 : numAmount
}
