/**
 * Resend email helper + templates.
 * Set in Vercel env: RESEND_API_KEY, EMAIL_FROM (e.g. "AI Product Academy <hello@mail.raheelab.com>"),
 * EMAIL_REPLY_TO (optional, e.g. raheel@raheelab.com).
 * No-ops safely if RESEND_API_KEY isn't set.
 */
export async function sendEmail({ to, subject, html, replyTo }) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[email] RESEND_API_KEY not set — skipping send to', to)
    return { skipped: true }
  }
  const from = process.env.EMAIL_FROM || 'AI Product Academy <onboarding@resend.dev>'
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        reply_to: replyTo || process.env.EMAIL_REPLY_TO || undefined,
      }),
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) console.error('[email] send failed', JSON.stringify(j))
    return j
  } catch (e) {
    console.error('[email] error', e)
    return { error: String(e) }
  }
}

// ---- shared shell ----
function shell(bodyHtml) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f1ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#0A0A0A;margin-bottom:24px;">raheel<span style="color:#C8A44E;">.</span> <span style="font-size:13px;color:#8B7332;font-family:-apple-system,sans-serif;letter-spacing:.04em;">AI PRODUCT ACADEMY</span></div>
    <div style="background:#ffffff;border:1px solid #e7e1d4;border-radius:8px;padding:32px 28px;">
      ${bodyHtml}
    </div>
    <p style="font-size:12px;color:#9b9486;text-align:center;margin-top:22px;line-height:1.6;">
      AI Product Academy · Built by the founders of Virtuans AI (acquired)<br>
      You're receiving this because you signed up at raheelab.com.
    </p>
  </div></body></html>`
}
const btn = (href, label) =>
  `<a href="${href}" style="display:inline-block;background:#C8A44E;color:#0A0A0A;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:6px;font-size:15px;">${label}</a>`

// ---- 1) Lead opt-in welcome (deliver the training) ----
export function leadWelcomeHtml({ firstName } = {}) {
  const hi = firstName ? `Hey ${firstName},` : 'Hey,'
  return shell(`
    <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:400;margin:0 0 16px;">Your training is unlocked 🔓</h1>
    <p style="font-size:15px;line-height:1.7;color:#3a3a3a;">${hi}</p>
    <p style="font-size:15px;line-height:1.7;color:#3a3a3a;">Thanks for signing up. Here's the deal in one sentence: <strong>AI won't take your job — but someone who's mastered it will.</strong> In the training, Muddassar and I break down the exact system the two of us use to do the work of an entire 20-person team.</p>
    <p style="font-size:15px;line-height:1.7;color:#3a3a3a;">Watch it, then if it clicks, grab one of the limited seats in the next cohort (starts <strong>July 1</strong>).</p>
    <p style="margin:26px 0;">${btn('https://www.raheelab.com/start.html', 'Watch the training →')}</p>
    <p style="font-size:15px;line-height:1.7;color:#3a3a3a;">Over the next few days I'll send a couple of real case studies and answer the questions people always ask. Just reply if you have one — it reaches me directly.</p>
    <p style="font-size:15px;line-height:1.7;color:#3a3a3a;margin-top:20px;">— Raheel &amp; Muddassar</p>
  `)
}

// ---- 2) Post-purchase welcome ----
export function purchaseWelcomeHtml({ firstName } = {}) {
  const hi = firstName ? `Welcome, ${firstName} 🎉` : 'Welcome aboard 🎉'
  return shell(`
    <div style="font-family:monospace;font-size:12px;color:#8B7332;letter-spacing:.06em;margin-bottom:6px;">COHORT 01 · STARTS JULY 1, 2026</div>
    <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;margin:0 0 16px;">${hi}</h1>
    <p style="font-size:15px;line-height:1.7;color:#3a3a3a;">You're officially enrolled in the <strong>AI Product Academy</strong>. Your payment is confirmed and your seat is locked in. Smart move — you just got on the right side of the AI gap.</p>
    <div style="background:#faf7f0;border:1px solid #ece4d2;border-radius:6px;padding:18px 20px;margin:22px 0;">
      <div style="font-family:monospace;font-size:11px;color:#8B7332;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;">What happens next</div>
      <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:#3a3a3a;">
        <li>We'll email your cohort schedule &amp; Zoom links before July 1</li>
        <li>You'll get an invite to the private community where everything happens</li>
        <li>A short pre-work checklist so you hit the ground running on day one</li>
        <li>Lifetime access to all recordings</li>
      </ul>
    </div>
    <p style="font-size:15px;line-height:1.7;color:#3a3a3a;">In the meantime, do one thing: create a <a href="https://claude.ai" style="color:#8B7332;">Claude</a> account if you don't have one — that's our main build tool.</p>
    <p style="font-size:15px;line-height:1.7;color:#3a3a3a;">Questions about anything? Just reply to this email — it comes straight to us.</p>
    <p style="font-size:15px;line-height:1.7;color:#3a3a3a;margin-top:20px;">See you on the inside,<br>— Raheel &amp; Muddassar</p>
  `)
}
