/**
 * Create a Stripe Checkout Session for the AI Product Academy ($650 one-time).
 * Returns { url } — the browser redirects there. On payment, Stripe fires
 * checkout.session.completed → /api/stripe-webhook → Meta CAPI Purchase.
 *
 * Env-driven so it runs in TEST locally and LIVE on Vercel with no code change:
 *   STRIPE_SECRET_KEY  – sk_test_… locally, sk_live_… in Vercel
 *   STRIPE_PRICE_ID    – test price id locally, live price id in Vercel
 *
 * Dependency-free: Stripe REST API via fetch (Node 18+/24).
 */
import crypto from 'crypto'

const sha256 = (s) => crypto.createHash('sha256').update(String(s).trim().toLowerCase()).digest('hex')

// Fire a server-side InitiateCheckout to Meta CAPI, deduped with the browser
// Pixel event via the shared event_id. Best-effort / non-blocking.
async function sendInitiateCheckoutCAPI({ event_id, email, fbp, fbc, ip, ua, pageUrl }) {
  const token = process.env.META_CAPI_TOKEN
  if (!token) return
  const dataset = process.env.META_PIXEL_ID || '3295834153930056'
  const user_data = {}
  if (email) user_data.em = [sha256(email)]
  if (fbp) user_data.fbp = fbp
  if (fbc) user_data.fbc = fbc
  if (ip) user_data.client_ip_address = ip
  if (ua) user_data.client_user_agent = ua
  const event = {
    event_name: 'InitiateCheckout',
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: pageUrl,
    user_data,
    custom_data: { value: 650, currency: 'USD', content_name: 'AI Product Academy — Cohort 01' },
  }
  if (event_id) event.event_id = event_id
  const body = { data: [event] }
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 2500)
  try {
    await fetch(`https://graph.facebook.com/v21.0/${dataset}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
  } catch (_) {
    /* best-effort: never block checkout on CAPI */
  } finally {
    clearTimeout(timer)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // Secret key: prefer STRIPE_SECRET_KEY; fall back to STRIPE_REAL_SECRET_KEY.
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_REAL_SECRET_KEY
  const live = !!key && key.startsWith('sk_live')
  // Price: explicit STRIPE_PRICE_ID wins; otherwise match the key's mode
  // (live key -> live price, test key -> test price) using the COURSE_* names.
  const price =
    process.env.STRIPE_PRICE_ID ||
    (live ? process.env.STRIPE_COURSE_PRICE_ID_LIVE : process.env.STRIPE_COURSE_PRICE_ID_TEST) ||
    process.env.STRIPE_COURSE_PRICE_ID_TEST ||
    process.env.STRIPE_COURSE_PRICE_ID_LIVE
  if (!key || !price) {
    return res
      .status(500)
      .json({ error: 'Checkout not configured (missing Stripe secret key or price id).' })
  }

  const { email, event_id, fbp, fbc, source, price_variant } = req.body || {}

  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0]
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const base = `${proto}://${host}`
  const pageUrl = source === 'academy' ? `${base}/academy.html` : `${base}/start.html`
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  const ua = req.headers['user-agent'] || ''
  const country = String(req.headers['x-vercel-ip-country'] || '').toUpperCase()
  // Pakistan A/B pricing — apply the coupon DIRECTLY (geo-enforced server-side; can't leak).
  //   variant 'a' = -$100 → $550   |   variant 'b' = -$400 → $250
  const variant = price_variant === 'b' ? 'b' : 'a'
  const PK_COUPONS = {
    a: live ? 'jWXhAVRG' : 'MLxh3Vl8',
    b: live ? 'K3Qqvg9a' : 'tb1WDW7O',
  }

  // Fire CAPI InitiateCheckout in parallel with the Stripe call (hides latency).
  const capiP = sendInitiateCheckoutCAPI({ event_id, email, fbp, fbc, ip, ua, pageUrl }).catch(() => {})

  const params = new URLSearchParams()
  params.append('mode', 'payment')
  params.append('line_items[0][price]', price)
  params.append('line_items[0][quantity]', '1')
  if (country === 'PK') {
    // Auto-apply the Pakistan A/B coupon (forbidden to combine with allow_promotion_codes).
    params.append('discounts[0][coupon]', PK_COUPONS[variant])
  } else {
    params.append('allow_promotion_codes', 'true')
  }
  params.append(
    'success_url',
    `${base}/enrolled.html?eid=${encodeURIComponent(event_id || '')}&session_id={CHECKOUT_SESSION_ID}`
  )
  params.append('cancel_url', pageUrl)
  if (email) params.append('customer_email', email)

  // Pass identifiers through to the webhook → strong CAPI match + Pixel dedup.
  const md = {
    event_id: event_id || '',
    fbp: fbp || '',
    fbc: fbc || '',
    event_source_url: pageUrl,
    client_user_agent: req.headers['user-agent'] || '',
    client_ip_address: ip,
    price_tier: country === 'PK' ? (variant === 'b' ? 'PK_250' : 'PK_550') : 'STD_650',
  }
  for (const k of Object.keys(md)) {
    if (md[k]) {
      params.append(`metadata[${k}]`, md[k])
      params.append(`payment_intent_data[metadata][${k}]`, md[k])
    }
  }

  try {
    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    const session = await r.json()
    try { await capiP } catch (_) {}
    if (session.error) {
      console.error('[checkout] Stripe error', session.error.message)
      return res.status(400).json({ error: session.error.message })
    }
    return res.status(200).json({ url: session.url, id: session.id })
  } catch (err) {
    console.error('[checkout] failed', err)
    return res.status(500).json({ error: 'Could not create checkout session.' })
  }
}
