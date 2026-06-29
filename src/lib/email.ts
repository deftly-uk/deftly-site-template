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

export type SiteReadyEmail = { subject: string; text: string; html: string }

/**
 * Optional, env-tunable copy bits — chosen so we never invent specifics we don't
 * have yet (a wrong price/number in a customer email is worse than omitting it):
 *   SITE_READY_REP_NAME      sign-off name              (default "The Deftly team")
 *   SITE_READY_PRICE         e.g. "£295"                (omitted from the button if unset)
 *   SITE_READY_CONTACT_PHONE a call-back number         (falls back to "just reply")
 *   SITE_READY_CHECKOUT_URL  real Stripe checkout link  (the on/off flag — see below)
 *   SITE_READY_PAYMENT="off" hide the payment block entirely
 *
 * Payment button (plan): greyed-out by default behind an on/off flag, so it flips
 * to a real checkout the day Stripe is ready — no copy change needed. Until then it
 * is a styled grey box (email clients ignore real "disabled" buttons) reading
 * "Secure checkout: available shortly".
 */
const readReadyEmailEnv = () => ({
  repName: process.env.SITE_READY_REP_NAME?.trim() || 'The Deftly team',
  price: process.env.SITE_READY_PRICE?.trim() || '',
  phone: process.env.SITE_READY_CONTACT_PHONE?.trim() || '',
  checkoutUrl: process.env.SITE_READY_CHECKOUT_URL?.trim() || '',
  paymentOff: process.env.SITE_READY_PAYMENT?.trim().toLowerCase() === 'off',
})

/**
 * Build the conversion-oriented "your website is ready" email (plan §"Email").
 * Pure + side-effect-free so the copy is unit-testable. No em dashes. The hold is
 * softened to something the system can actually honour ("I can only keep this
 * preview open for a few days") — it never promises to release a site/address.
 */
export const buildSiteReadyEmail = (input: {
  businessName: string
  siteUrl: string
  env?: ReturnType<typeof readReadyEmailEnv>
}): SiteReadyEmail => {
  const env = input.env ?? readReadyEmailEnv()
  const business = input.businessName || 'your business'
  const url = input.siteUrl
  const claimLabel = env.price ? `Claim my website for ${env.price}` : 'Claim my website'
  const contactLine = env.phone
    ? `just reply to this email or call me on ${env.phone}`
    : 'just reply to this email'

  const subject = `Your new ${business} website is ready (yours to claim for a few days)`

  // — plain text —
  const paymentText = env.paymentOff
    ? []
    : env.checkoutUrl
      ? ['', `   ${claimLabel}: ${env.checkoutUrl}`]
      : ['', `   [ ${claimLabel} ]`, '   Secure checkout: available shortly.']

  const text = [
    'Hi there,',
    '',
    `Thanks for taking my call earlier. As promised, I've built you a free preview of a`,
    `brand-new website for ${business}. Nothing to pay, nothing to set up: just take a`,
    'look and tell me what you think.',
    '',
    `   View your free website:  ${url}`,
    '',
    `It's built around your business: your services, the areas you cover, and a big`,
    '"call now" button so customers reach you straight from their phone.',
    '',
    'Two quick things:',
    " - I can only keep this preview open for a few days, so do take a look while it's here.",
    " - Going live takes a couple of minutes and it's up the same day.",
    ...paymentText,
    '',
    'No pressure: have a look, show the family, and let me know what you think.',
    '',
    `Any questions, ${contactLine}.`,
    '',
    'Cheers,',
    env.repName,
    'Deftly: local websites, done properly',
  ].join('\n')

  // — html —
  const button = (label: string, href: string) =>
    `<a href="${escapeHtml(href)}" style="background:#173A5E;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">${escapeHtml(label)}</a>`

  const paymentHtml = env.paymentOff
    ? ''
    : env.checkoutUrl
      ? `<p style="margin:24px 0">${button(claimLabel, env.checkoutUrl)}</p>`
      : `<div style="margin:24px 0">
           <div style="background:#e2e8f0;color:#64748b;padding:12px 22px;border-radius:8px;font-weight:600;display:inline-block">${escapeHtml(claimLabel)}</div>
           <div style="color:#94a3b8;font-size:13px;margin-top:6px">Secure checkout: available shortly.</div>
         </div>`

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;line-height:1.5">
      <p>Hi there,</p>
      <p>Thanks for taking my call earlier. As promised, I've built you a free preview of a brand-new website for <strong>${escapeHtml(business)}</strong>. Nothing to pay, nothing to set up: just take a look and tell me what you think.</p>
      <p style="margin:24px 0">${button('View your free website', url)}</p>
      <p style="color:#475569;font-size:14px">Or paste this into your browser:<br><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>
      <p>It's built around your business: your services, the areas you cover, and a big "call now" button so customers reach you straight from their phone.</p>
      <ul style="color:#334155;padding-left:18px">
        <li>I can only keep this preview open for a few days, so do take a look while it's here.</li>
        <li>Going live takes a couple of minutes and it's up the same day.</li>
      </ul>
      ${paymentHtml}
      <p style="color:#475569;font-size:14px">No pressure: have a look, show the family, and any questions, ${escapeHtml(contactLine)}.</p>
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Cheers,<br>${escapeHtml(env.repName)}<br>Deftly: local websites, done properly</p>
    </div>`

  return { subject, text, html }
}

/**
 * Send the "your website is ready" email the moment a build reaches `ready`
 * (Stage 4 — self-serve delivery).
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
  siteUrl: string | null | undefined
  to: string | null | undefined
}): Promise<SiteReadyResult> => {
  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.SITE_READY_FROM ||
    process.env.CONTACT_FROM_EMAIL ||
    'Deftly <onboarding@resend.dev>'
  const to = input.to?.trim() || process.env.CONTACT_TO_EMAIL_FALLBACK?.trim()
  const url = input.siteUrl?.trim()

  // Never send a dead link: skip unless the URL is a routable absolute http(s) link.
  // A bare domain string (e.g. "preview.deftly.app/foo") or empty string both fail.
  let isRoutableUrl = false
  if (url) {
    try {
      const { protocol } = new URL(url)
      isRoutableUrl = protocol === 'http:' || protocol === 'https:'
    } catch { /* malformed — not routable */ }
  }
  if (!isRoutableUrl) {
    console.warn('[site-ready] No routable site URL — notification email skipped.')
    return { sent: false, reason: 'no-link' }
  }
  if (!apiKey) {
    console.warn('[site-ready] RESEND_API_KEY not set — build is ready, notification email skipped.')
    return { sent: false, reason: 'no-api-key' }
  }
  if (!to) {
    console.warn('[site-ready] No recipient in spec or env — notification email skipped.')
    return { sent: false, reason: 'no-recipient' }
  }

  const { subject, text, html } = buildSiteReadyEmail({
    businessName: input.businessName,
    siteUrl: url!, // safe: isRoutableUrl true implies url is a non-empty string
  })

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
