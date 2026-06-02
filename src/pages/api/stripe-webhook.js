/**
 * Stripe webhook → Meta Conversions API (CAPI) "Purchase"
 * ---------------------------------------------------------
 * Fires a server-side, un-blockable Purchase event to Meta whenever a real
 * Stripe payment succeeds. This is the reliable revenue signal (the browser
 * pixel Purchase can be blocked/spoofed). Dedupes with the browser pixel via
 * a shared event_id.
 *
 * Deploys automatically on Vercel at:  /api/stripe-webhook
 * Point your Stripe webhook there (events: checkout.session.completed,
 * payment_intent.succeeded).
 *
 * Required Vercel environment variables (Project → Settings → Environment Variables):
 *   META_CAPI_TOKEN        – your Conversions API access token (NEVER commit it)
 *   STRIPE_WEBHOOK_SECRET  – the signing secret from the Stripe webhook (whsec_...)
 * Optional:
 *   META_PIXEL_ID          – defaults to the course dataset id below
 *   META_TEST_EVENT_CODE   – set to a TEST… code to route to Test Events while testing
 *
 * No npm dependencies needed — uses Node's crypto + global fetch (Node 18+/24).
 */
import crypto from 'crypto'

// Stripe needs the raw request body to verify the signature — disable Next's parser.
export const config = { api: { bodyParser: false } }

const DEFAULT_PIXEL_ID = '3295834153930056'

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// Verify Stripe's `stripe-signature` header (scheme: t=timestamp,v1=signature)
function verifyStripeSignature(rawBody, header, secret) {
  if (!header || !secret) return false
  const parts = Object.fromEntries(
    header.split(',').map((kv) => {
      const i = kv.indexOf('=')
      return [kv.slice(0, i), kv.slice(i + 1)]
    })
  )
  const t = parts.t
  const v1 = parts.v1
  if (!t || !v1) return false
  // Reject events older than 5 minutes (replay protection)
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(t)) > 300) return false
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${t}.${rawBody.toString('utf8')}`)
    .digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(v1)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

const sha256 = (v) =>
  crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const rawBody = await readRawBody(req)
  const ok = verifyStripeSignature(
    rawBody,
    req.headers['stripe-signature'],
    process.env.STRIPE_WEBHOOK_SECRET
  )
  if (!ok) return res.status(400).send('Invalid Stripe signature')

  let event
  try {
    event = JSON.parse(rawBody.toString('utf8'))
  } catch {
    return res.status(400).send('Invalid JSON')
  }

  // Only act on a successful payment.
  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'payment_intent.succeeded'
  ) {
    const obj = event.data?.object || {}
    const md = obj.metadata || {}

    const email =
      obj.customer_details?.email ||
      obj.receipt_email ||
      obj.charges?.data?.[0]?.billing_details?.email ||
      md.email ||
      null
    const amount = (obj.amount_total ?? obj.amount ?? 65000) / 100
    const currency = (obj.currency || 'usd').toUpperCase()

    const userData = {}
    if (email) userData.em = [sha256(email)]
    // Pass these through Stripe metadata at checkout time for best match quality:
    if (md.fbp) userData.fbp = md.fbp
    if (md.fbc) userData.fbc = md.fbc
    if (md.client_ip_address) userData.client_ip_address = md.client_ip_address
    if (md.client_user_agent) userData.client_user_agent = md.client_user_agent

    const pixelId = process.env.META_PIXEL_ID || DEFAULT_PIXEL_ID
    const token = process.env.META_CAPI_TOKEN

    const payload = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          // Shared id so Meta dedupes this against the browser-pixel Purchase.
          // Send the same value from the browser fbq('track','Purchase',{},{eventID})
          event_id: md.event_id || obj.id,
          action_source: 'website',
          event_source_url:
            md.event_source_url || 'https://www.raheelab.com/start.html',
          user_data: userData,
          custom_data: {
            currency,
            value: amount,
            content_name: 'AI Product Academy — Cohort 01',
          },
        },
      ],
    }
    if (process.env.META_TEST_EVENT_CODE) {
      payload.test_event_code = process.env.META_TEST_EVENT_CODE
    }

    if (token) {
      try {
        const r = await fetch(
          `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(
            token
          )}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        )
        const json = await r.json().catch(() => ({}))
        console.log('[CAPI] Purchase sent', JSON.stringify(json))
      } catch (err) {
        // Don't fail the webhook on a CAPI hiccup — Stripe would keep retrying.
        console.error('[CAPI] send failed', err)
      }
    } else {
      console.warn('[CAPI] META_CAPI_TOKEN not set — skipping')
    }
  }

  // Always 200 so Stripe doesn't retry a delivered event.
  return res.status(200).json({ received: true })
}
