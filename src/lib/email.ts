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

export type SiteReadyResult = SendResult & { id?: string; to?: string }

/**
 * Tell the customer their freshly-built website is live, with the link. Sent by the build
 * worker the moment a job reaches `ready` (Stage 4 — self-serve delivery).
 *
 * The recipient MUST come from the build job's spec snapshot: the worker's database login
 * can read the build queue but NOT the CRM's `leads` table, so the contact email travels
 * inside the spec (`contact.notificationEmail`, falling back to `enquiryEmail`). If neither
 * is present we fall back to CONTACT_TO_EMAIL_FALLBACK, then skip — never throw, so a
 * missing key/recipient can never fail an already-successful build.
 *
 * From-address: SITE_READY_FROM if set, else CONTACT_FROM_EMAIL, else Resend's shared
 * `onboarding@resend.dev` sender (works with no domain verification).
 */
export const sendSiteReadyEmail = async (input: {
  businessName: string
  siteUrl: string
  to: string | null | undefined
}): Promise<SiteReadyResult> => {
  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.SITE_READY_FROM ||
    process.env.CONTACT_FROM_EMAIL ||
    'Deftly <onboarding@resend.dev>'
  const to = input.to?.trim() || process.env.CONTACT_TO_EMAIL_FALLBACK?.trim()

  if (!apiKey) {
    console.warn('[site-ready] RESEND_API_KEY not set — build is ready, notification email skipped.')
    return { sent: false, reason: 'no-api-key' }
  }
  if (!to) {
    console.warn('[site-ready] No recipient in spec or env — notification email skipped.')
    return { sent: false, reason: 'no-recipient' }
  }

  const business = input.businessName || 'your business'
  const url = input.siteUrl
  const subject = `Your new website is ready — ${business}`
  const text = [
    `Good news — the website we built for ${business} is live and ready to view:`,
    '',
    url,
    '',
    'Open the link to see it. This is an early preview you can refine; reply to this email with anything you want changed.',
    '',
    '— Deftly',
  ].join('\n')
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <h2 style="color:#173A5E;margin-bottom:4px">Your new website is ready 🎉</h2>
      <p>The website we built for <strong>${escapeHtml(business)}</strong> is live and ready to view:</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(url)}" style="background:#173A5E;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">View your website</a>
      </p>
      <p style="color:#475569;font-size:14px">Or paste this into your browser:<br><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>
      <p style="color:#475569;font-size:14px;margin-top:16px">This is an early preview you can refine. Reply to this email with anything you'd like changed.</p>
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">— Deftly</p>
    </div>`

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({ from, to, subject, html, text })
    if (error) {
      console.error('[site-ready] Resend error:', error)
      return { sent: false, reason: error.message, to }
    }
    return { sent: true, id: data?.id, to }
  } catch (err) {
    console.error('[site-ready] Email send threw:', err)
    return { sent: false, reason: 'exception', to }
  }
}
