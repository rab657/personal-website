/**
 * Bank-transfer claim: fired when an applicant clicks "I've made the transfer".
 * Tags their Stripe-customer CRM record (transfer_claimed=1 + note) so the
 * dashboard / agents show "💸 transfer claimed — awaiting receipt" and nobody
 * who paid by bank gets lost. Best-effort, public (no secrets exposed; it can
 * only annotate existing applicants).
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_REAL_SECRET_KEY
  const { email, name } = req.body || {}
  if (!key || (!email && !name)) return res.status(200).json({ ok: true })

  try {
    // find the applicant by email (preferred) or exact name
    const q = email
      ? `email:'${String(email).replace(/'/g, '')}' AND metadata['source']:'academy_application'`
      : `name:'${String(name).replace(/'/g, '')}' AND metadata['source']:'academy_application'`
    const r = await fetch(
      `https://api.stripe.com/v1/customers/search?query=${encodeURIComponent(q)}&limit=1`,
      { headers: { Authorization: `Bearer ${key}` } }
    )
    const d = await r.json()
    const c = (d.data || [])[0]
    if (c) {
      const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
      const note = `${c.metadata?.notes ? c.metadata.notes + ' | ' : ''}${stamp}: claimed bank transfer (awaiting receipt)`.slice(-450)
      const body = new URLSearchParams({
        'metadata[transfer_claimed]': '1',
        'metadata[notes]': note,
      })
      await fetch(`https://api.stripe.com/v1/customers/${c.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
    }
  } catch (e) {
    console.error('[transfer-claim]', e)
  }
  return res.status(200).json({ ok: true })
}
