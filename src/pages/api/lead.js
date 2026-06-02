/**
 * Opt-in handler: sends the "your training is unlocked" welcome email via Resend.
 * Called by the /start opt-in form. No-ops gracefully if RESEND_API_KEY isn't set.
 */
import { sendEmail, leadWelcomeHtml } from '../../lib/email'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  const { email, firstName } = req.body || {}
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' })
  }
  await sendEmail({
    to: email,
    subject: 'Your training is unlocked 🔓',
    html: leadWelcomeHtml({ firstName }),
  })
  return res.status(200).json({ ok: true })
}
