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

  const { email, event_id, fbp, fbc, source } = req.body || {}

  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0]
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const base = `${proto}://${host}`
  const pageUrl = source === 'academy' ? `${base}/academy.html` : `${base}/start.html`
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()

  const params = new URLSearchParams()
  params.append('mode', 'payment')
  params.append('line_items[0][price]', price)
  params.append('line_items[0][quantity]', '1')
  params.append('allow_promotion_codes', 'true')
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
