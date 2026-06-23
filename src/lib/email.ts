import { Resend } from 'resend'

import type { SiteSetting } from '@/payload-types'

export type EnquiryInput = {
  name: string
  phone: string
  postcode?: string
  message?: string
}

export type SendResult = { sent: boolean; reason?: string }

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Email the business owner about a new enquiry. Recipient + business name come
 * from the CMS (Article I). If RESEND_API_KEY is not set the enquiry has still
 * been saved to the CMS; we just skip the email and say so — never throw, so a
 * missing key can never lose a lead.
 */
export const sendEnquiryEmail = async (
  enquiry: EnquiryInput,
  settings: Pick<SiteSetting, 'businessName' | 'notificationEmail' | 'email'>,
): Promise<SendResult> => {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.CONTACT_FROM_EMAIL || 'Enquiries <onboarding@resend.dev>'
  const to =
    settings.notificationEmail?.trim() ||
    settings.email?.trim() ||
    process.env.CONTACT_TO_EMAIL_FALLBACK?.trim()

  if (!apiKey) {
    console.warn('[contact] RESEND_API_KEY not set — enquiry saved to CMS, email skipped.')
    return { sent: false, reason: 'no-api-key' }
  }
  if (!to) {
    console.warn('[contact] No notification recipient configured in CMS or env — email skipped.')
    return { sent: false, reason: 'no-recipient' }
  }

  const business = settings.businessName || 'your website'
  const subject = `New enquiry from ${enquiry.name} — ${business}`
  const rows = [
    ['Name', enquiry.name],
    ['Phone', enquiry.phone],
    ['Postcode', enquiry.postcode || '—'],
    ['Message', enquiry.message || '—'],
  ]
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n')
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#173A5E">New website enquiry</h2>
      <p>You've had a new enquiry through ${escapeHtml(business)}:</p>
      <table style="border-collapse:collapse;width:100%">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:8px 12px;border:1px solid #E2E8F0;font-weight:600;background:#F4F7FA;width:120px">${escapeHtml(
                k,
              )}</td><td style="padding:8px 12px;border:1px solid #E2E8F0">${escapeHtml(v)}</td></tr>`,
          )
          .join('')}
      </table>
      <p style="color:#475569;font-size:14px;margin-top:16px">Reply to this person on ${escapeHtml(
        enquiry.phone,
      )}. This lead is also saved in your admin panel.</p>
    </div>`

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({ from, to, subject, html, text })
    if (error) {
      console.error('[contact] Resend error:', error)
      return { sent: false, reason: error.message }
    }
    return { sent: true }
  } catch (err) {
    console.error('[contact] Email send threw:', err)
    return { sent: false, reason: 'exception' }
  }
}
