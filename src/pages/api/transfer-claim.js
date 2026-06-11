/**
 * Bank-transfer flow events from academy.html:
 *   step:'viewed'  — opened the bank-details panel → instant "Your transfer details" email
 *   step:'claimed' — clicked "I've made the transfer" → CRM tag + "send your receipt" email
 * Emails dedupe via CRM metadata flags so repeat clicks never double-send.
 * Best-effort and public: it can only email the address provided and annotate
 * existing applicant records — no data is readable through it.
 */
import { sendEmail, bankDetailsHtml, receiptReminderHtml, BANK_DETAILS_SUBJECT, RECEIPT_SUBJECT } from '../../lib/email'

const firstName = (n) => (n ? String(n).trim().split(/\s+/)[0] : '')

async function stripeFind(key, email) {
  const q = `email:'${String(email).replace(/'/g, '')}' AND metadata['source']:'academy_application'`
  const r = await fetch(`https://api.stripe.com/v1/customers/search?query=${encodeURIComponent(q)}&limit=1`, {
    headers: { Authorization: `Bearer ${key}` },
  })
  const d = await r.json()
  return (d.data || [])[0] || null
}
async function stripeUpdate(key, id, params) {
  await fetch(`https://api.stripe.com/v1/customers/${id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  const { email, name, step } = req.body || {}
  const which = step === 'viewed' ? 'viewed' : 'claimed'
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_REAL_SECRET_KEY

  try {
    const cust = key && email ? await stripeFind(key, email) : null
    const m = (cust && cust.metadata) || {}
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const fn = firstName(name || (cust && cust.name))

    if (which === 'viewed') {
      const alreadyEmailed = m.bank_details_emailed === '1'
      if (email && !alreadyEmailed) {
        await sendEmail({ to: email, subject: BANK_DETAILS_SUBJECT, html: bankDetailsHtml({ firstName: fn }) })
      }
      if (cust) {
        await stripeUpdate(key, cust.id, {
          'metadata[bank_details_emailed]': '1',
          'metadata[notes]': `${m.notes ? m.notes + ' | ' : ''}${stamp}: viewed bank-transfer details`.slice(-450),
        })
      }
    } else {
      const alreadyEmailed = m.receipt_email_sent === '1'
      if (email && !alreadyEmailed) {
        await sendEmail({ to: email, subject: RECEIPT_SUBJECT, html: receiptReminderHtml({ firstName: fn }) })
      }
      if (cust) {
        await stripeUpdate(key, cust.id, {
          'metadata[transfer_claimed]': '1',
          'metadata[receipt_email_sent]': '1',
          'metadata[notes]': `${m.notes ? m.notes + ' | ' : ''}${stamp}: claimed bank transfer (awaiting receipt)`.slice(-450),
        })
      }
    }
  } catch (e) {
    console.error('[transfer-claim]', e)
  }
  return res.status(200).json({ ok: true })
}
