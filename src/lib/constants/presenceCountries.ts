/**
 * Countries where PlanetTalk has an active business presence.
 *
 * Used to restrict the country selector during Business Partner
 * applications so only prospects from supported markets can apply.
 *
 * Individual partner registration and existing user-facing flows
 * (profile, admin screens) intentionally continue to accept the full
 * worldwide list — this list is opt-in via the `allowedCodes` prop on
 * the `CountryPicker` component.
 *
 * ISO 3166-1 alpha-2 country codes.
 */
export const BUSINESS_PARTNER_PRESENCE_COUNTRIES = [
  'GB', // United Kingdom
  'US', // United States
  'CA', // Canada
  'FR', // France
  'IE', // Ireland
] as const

export type BusinessPartnerPresenceCountry =
  typeof BUSINESS_PARTNER_PRESENCE_COUNTRIES[number]

export const isBusinessPartnerPresenceCountry = (
  code: string | undefined | null
): code is BusinessPartnerPresenceCountry =>
  !!code &&
  (BUSINESS_PARTNER_PRESENCE_COUNTRIES as readonly string[]).includes(code)
