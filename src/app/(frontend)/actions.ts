'use server'

import { sendEnquiryEmail } from '@/lib/email'
import { getPayloadClient } from '@/lib/payload'
import { getSiteSettings } from '@/lib/queries'
import { requireRequestTenant } from '@/lib/tenant'
import type { ContactState } from '@/lib/contact-types'

const digits = (s: string): string => s.replace(/[^\d]/g, '')

/**
 * Handle a contact-form submission:
 *  1. resolve the tenant from the hostname (the enquiry belongs to THIS site only)
 *  2. server-side validation + honeypot
 *  3. SAVE the enquiry to the CMS (the owner's lead inbox), tagged to the tenant
 *  4. email the owner (best-effort; never blocks the save)
 * The lead is saved even if email is unconfigured, so a missed key never loses a job.
 */
export const submitEnquiry = async (
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> => {
  // Honeypot — real users never fill this hidden field. Pretend success for bots.
  const honeypot = String(formData.get('company') || '').trim()
  if (honeypot) return { status: 'success' }

  const name = String(formData.get('name') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const postcode = String(formData.get('postcode') || '').trim()
  const message = String(formData.get('message') || '').trim()

  const errors: ContactState['errors'] = {}
  if (name.length < 2) errors.name = 'Please enter your name.'
  if (digits(phone).length < 7) errors.phone = 'Please enter a valid phone number.'
  if (message.length > 2000) errors.message = 'Please shorten your message.'
  if (Object.keys(errors).length > 0) {
    return { status: 'error', message: 'Please check the highlighted fields.', errors }
  }

  try {
    const tenant = await requireRequestTenant()
    const payload = await getPayloadClient()
    // Trusted server-side create: the tenant is fixed from the request hostname, so we
    // bypass the (now auth-only) public create access. enforceTenantWrite still runs.
    await payload.create({
      collection: 'enquiries',
      data: {
        tenant: tenant.id,
        name,
        phone,
        postcode: postcode || undefined,
        message: message || undefined,
        status: 'new',
        source: 'website',
      },
      overrideAccess: true,
    })

    // Best-effort notification; failures are logged inside, never thrown.
    const settings = await getSiteSettings(tenant.id)
    if (settings) await sendEnquiryEmail({ name, phone, postcode, message }, settings)

    return { status: 'success' }
  } catch (err) {
    console.error('[contact] Failed to save enquiry:', err)
    return {
      status: 'error',
      message: 'Sorry, something went wrong. Please call us instead and we’ll help right away.',
    }
  }
}
