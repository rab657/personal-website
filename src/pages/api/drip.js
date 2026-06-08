/**
 * Application email drip — run daily by Vercel Cron (see vercel.json).
 * Reads applicants from the Stripe-customer CRM (metadata.source=academy_application)
 * and sends the next due email in the sequence, tracking progress in metadata.seq_step.
 *
 * Schedule (days since applied_at): step2 ≥1d · step3 ≥2d · step4 ≥4d.
 * Secured by CRON_SECRET (Vercel sends it as a Bearer header; ?key= also works for manual runs).
 * No-ops on sends if RESEND_API_KEY is unset (still advances safely? no — only advances on attempted send).
 */
import { sendEmail, seqHtml, SEQ_SUBJECTS } from '../../lib/email'

const DUE_AFTER_DAYS = { 2: 1, 3: 2, 4: 3, 5: 5, 6: 7 } // step -> min age in days
const MAX_STEP = 6
const firstName = (n) => (n ? String(n).trim().split(/\s+/)[0] : '')

async function stripeGet(key, path) {
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  return r.json()
}
async function stripePost(key, path, params) {
  const body = new URLSearchParams(params)
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  return r.json()
}

export default async function handler(req, res) {
  // Auth: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Allow ?key= for manual.
  const secret = process.env.CRON_SECRET
  const auth = req.headers.authorization || ''
  const keyParam = req.query.key || ''
  if (secret && auth !== `Bearer ${secret}` && keyParam !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(200).json({ ok: true, note: 'RESEND_API_KEY not set — drip is dormant', sent: 0 })
  }
  const sk = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_REAL_SECRET_KEY
  if (!sk) return res.status(500).json({ error: 'No Stripe key' })

  const now = Date.now()
  let scanned = 0, sent = 0
  const results = []
  let starting_after = null
  try {
    for (let page = 0; page < 20; page++) {
      const q = `customers?limit=100${starting_after ? `&starting_after=${starting_after}` : ''}`
      const d = await stripeGet(sk, q)
      const data = d.data || []
      for (const c of data) {
        const m = c.metadata || {}
        if (m.source !== 'academy_application') continue
        if (m.purchased === '1') continue
        if (!c.email) continue
        scanned++
        const step = parseInt(m.seq_step || '0', 10)
        const next = step + 1
        if (next > MAX_STEP || !(next in DUE_AFTER_DAYS)) continue
        const appliedAt = Date.parse(m.applied_at || c.created * 1000) || now
        const ageDays = (now - appliedAt) / 86400000
        if (ageDays < DUE_AFTER_DAYS[next]) continue
        // due — send it
        const r = await sendEmail({
          to: c.email,
          subject: SEQ_SUBJECTS[next],
          html: seqHtml(next, { firstName: firstName(c.name) }),
        })
        if (!r || r.error) { results.push({ id: c.id, step: next, error: r && r.error }); continue }
        await stripePost(sk, `customers/${c.id}`, {
          'metadata[seq_step]': String(next),
          'metadata[seq_last_at]': new Date(now).toISOString(),
        })
        sent++
        results.push({ id: c.id, email: c.email, step: next })
      }
      if (!d.has_more) break
      starting_after = data[data.length - 1]?.id
      if (!starting_after) break
    }
  } catch (e) {
    return res.status(500).json({ error: String(e), scanned, sent })
  }
  return res.status(200).json({ ok: true, scanned, sent, results })
}
