/**
 * Commission Constants
 * Configuration values for commission system
 */

export const COMMISSION_CONSTANTS = {
  /**
   * Default commission rate for new agents (percentage)
   * This is the standard commission rate applied to referral activity
   */
  DEFAULT_RATE: 10,
  
  /**
   * Commission rates by tier (percentage)
   * Higher tiers may earn better commission rates
   */
  TIER_RATES: {
    bronze: 10,
    silver: 10,
    gold: 10,
    platinum: 10
  },
  
  /**
   * Commission period in months
   * Agents earn commissions for this many months from first successful top-up
   */
  COMMISSION_PERIOD_MONTHS: 24
} as const

export const DEFAULT_COMMISSION_RATE = COMMISSION_CONSTANTS.DEFAULT_RATE

