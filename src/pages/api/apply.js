/**
 * Premium application handler for AI Product Academy.
 * Captures a qualified lead (name, WhatsApp, goal, qualifier), then:
 *   1) Saves them as a Stripe Customer (interim CRM — visible in dashboard,
 *      ready to bill when the WhatsApp close happens).
 *   2) Fires a Meta CAPI "Lead" event (deduped with the browser Pixel via event_id).
 * Dependency-free: REST via fetch (Node 18+).
 */
import crypto from 'crypto'
import { sendEmail, applicationReceivedHtml, SEQ_SUBJECTS } from '../../lib/email'

const sha256 = (s) => crypto.createHash('sha256').update(String(s).trim().toLowerCase()).digest('hex')
const digits = (s) => String(s || '').replace(/[^\d]/g, '')

async function sendLeadCAPI({ event_id, email, phone, fbp, fbc, ip, ua, pageUrl }) {
  const token = process.env.META_CAPI_TOKEN
  if (!token) return
  const dataset = process.env.META_PIXEL_ID || '3295834153930056'
  const user_data = {}
  if (email) user_data.em = [sha256(email)]
  if (phone) user_data.ph = [sha256(digits(phone))]
  if (fbp) user_data.fbp = fbp
  if (fbc) user_data.fbc = fbc
  if (ip) user_data.client_ip_address = ip
  if (ua) user_data.client_user_agent = ua
  const event = {
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: pageUrl,
    user_data,
    custom_data: { content_name: 'AI Product Academy — Application', currency: 'USD', value: 500 },
  }
  if (event_id) event.event_id = event_id
  const body = { data: [event] }
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 2500)
  try {
    await fetch(`https://graph.facebook.com/v21.0/${dataset}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: ctrl.signal,
    })
  } catch (_) { /* best-effort */ } finally { clearTimeout(timer) }
}

async function upsertStripeCustomer(key, { name, email, whatsapp, country, fields }) {
  const params = new URLSearchParams()
  if (name) params.append('name', name)
  if (email) params.append('email', email)
  if (whatsapp) params.append('phone', whatsapp)
  params.append('description', 'AIPA application lead')
  const md = {
    source: 'academy_application',
    whatsapp: whatsapp || '',
    country: country || '',
    situation: fields.situation || '',
    goal: fields.goal || '',
    readiness: fields.readiness || '',
    utm_source: fields.utm_source || '',
    utm_campaign: fields.utm_campaign || '',
    utm_content: fields.utm_content || '',
    applied_at: new Date().toISOString(),
    seq_step: email ? '1' : '0', // 1 = welcome sent; drip continues from here
  }
  for (const k of Object.keys(md)) if (md[k]) params.append(`metadata[${k}]`, md[k])
  const r = await fetch('https://api.stripe.com/v1/customers', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  return r.json()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  const { name, email, whatsapp, situation, goal, readiness, event_id, fbp, fbc, utm_source, utm_campaign, utm_content } = req.body || {}
  if (!name || !whatsapp || digits(whatsapp).length < 7) {
    return res.status(400).json({ error: 'Name and a valid WhatsApp number are required.' })
  }

  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0]
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const pageUrl = `${proto}://${host}/academy.html`
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  const ua = req.headers['user-agent'] || ''
  const country = String(req.headers['x-vercel-ip-country'] || '').toUpperCase()

  // Fire CAPI Lead in parallel
  const capiP = sendLeadCAPI({ event_id, email, phone: whatsapp, fbp, fbc, ip, ua, pageUrl }).catch(() => {})

  // Save as Stripe customer (interim CRM)
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_REAL_SECRET_KEY
  let customer_id = null
  if (key) {
    try {
      const c = await upsertStripeCustomer(key, {
        name, email, whatsapp, country,
        fields: { situation, goal, readiness, utm_source, utm_campaign, utm_content },
      })
      if (c && c.id) customer_id = c.id
      else if (c && c.error) console.error('[apply] stripe', c.error.message)
    } catch (e) { console.error('[apply] stripe failed', e) }
  }

  // Send the immediate "you're on the shortlist" email (no-ops if Resend unset)
  if (email) {
    try {
      await sendEmail({
        to: email,
        subject: SEQ_SUBJECTS[1],
        html: applicationReceivedHtml({ firstName: String(name).trim().split(/\s+/)[0] }),
      })
    } catch (e) { console.error('[apply] welcome email failed', e) }
  }

  try { await capiP } catch (_) {}
  return res.status(200).json({ ok: true, customer_id })
}
