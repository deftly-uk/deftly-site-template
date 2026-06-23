import type { SiteSetting } from '@/payload-types'

/** Strip a phone number down to digits (+ leading plus) for a tel: href. */
export const telHref = (phone?: string | null): string => {
  if (!phone) return ''
  const cleaned = phone.replace(/[^\d+]/g, '')
  return `tel:${cleaned}`
}

/** The phone number as shown to visitors: explicit display value, else the raw number. */
export const phoneLabel = (settings: Pick<SiteSetting, 'phone' | 'phoneDisplay'>): string =>
  settings.phoneDisplay?.trim() || settings.phone || ''

/** WhatsApp click link from a number (international format, digits only). */
export const whatsappHref = (whatsapp?: string | null): string | null => {
  if (!whatsapp) return null
  const cleaned = whatsapp.replace(/[^\d]/g, '')
  return cleaned ? `https://wa.me/${cleaned}` : null
}

/** Single-line address string from the address group, skipping empty parts. */
export const formatAddress = (address?: SiteSetting['address']): string => {
  if (!address) return ''
  return [address.line1, address.line2, address.city, address.county, address.postcode]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(', ')
}
