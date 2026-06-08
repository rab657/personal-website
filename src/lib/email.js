/**
 * Resend email helper + templates.
 * Set in Vercel env: RESEND_API_KEY, EMAIL_FROM (e.g. "AI Product Academy <hello@raheelab.com>"),
 * EMAIL_REPLY_TO (optional, e.g. raheel@autoacquireai.com).
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
      AI Product Academy · Built by the founder of Virtuans AI (acquired)<br>
      You're receiving this because you applied at raheelab.com.
    </p>
  </div></body></html>`
}
const btn = (href, label) =>
  `<a href="${href}" style="display:inline-block;background:#C8A44E;color:#0A0A0A;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:6px;font-size:15px;">${label}</a>`
const p = (t) => `<p style="font-size:15px;line-height:1.7;color:#3a3a3a;margin:0 0 15px;">${t}</p>`
const h1 = (t) => `<h1 style="font-family:Georgia,serif;font-size:27px;font-weight:400;margin:0 0 18px;line-height:1.2;">${t}</h1>`
const eyebrow = (t) => `<div style="font-family:monospace;font-size:12px;color:#8B7332;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;">${t}</div>`
const sign = `<p style="font-size:15px;line-height:1.7;color:#3a3a3a;margin:22px 0 0;">— Raheel</p>`
const box = (inner) =>
  `<div style="background:#faf7f0;border:1px solid #ece4d2;border-radius:6px;padding:18px 20px;margin:20px 0;">${inner}</div>`
const SEAT = 'https://www.raheelab.com/academy.html#pricing'

// ===================================================================
//  APPLICATION FUNNEL  (premium · Pakistan · Raheel's voice · no income claims)
//  Step 1 sent on apply; 2–6 dripped by /api/drip.
//  Arc: shortlist → proof → outcomes → objections → scarcity → last call.
// ===================================================================
export const SEQ_SUBJECTS = {
  1: 'Your application is in — what happens next',
  2: 'We built it in Pakistan. A US company bought it.',
  3: "Here's exactly what you'll be able to do",
  4: "“But Raheel, I can't even code…”",
  5: "We're keeping Cohort 01 small (please read)",
  6: 'Last call before we close applications',
}
export function seqHtml(step, ctx = {}) {
  switch (step) {
    case 2: return proofHtml(ctx)
    case 3: return outcomesHtml(ctx)
    case 4: return objectionsHtml(ctx)
    case 5: return scarcityHtml(ctx)
    case 6: return lastCallHtml(ctx)
    default: return applicationReceivedHtml(ctx)
  }
}
const hey = (firstName) => (firstName ? `Hey ${firstName},` : 'Hey,')
const name1 = (firstName) => (firstName ? `${firstName},` : '')

// ---- Step 1: application received (immediate) ----
export function applicationReceivedHtml({ firstName } = {}) {
  return shell(`
    ${eyebrow('Application received')}
    ${h1("You're in — now claim your seat.")}
    ${p(hey(firstName))}
    ${p("Thanks for applying to <strong>Cohort 01</strong> of the AI Product Academy.")}
    ${p("Here's the honest part: <strong>there are only 10 seats — and they go to whoever locks them in first.</strong> Applying doesn't hold your spot. Locking your seat does.")}
    ${p("Quick context on why this isn't just another online course:")}
    ${box(`<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.8;color:#3a3a3a;">
      <li>It's taught <strong>live</strong> — by me and my co-founder Muddassar, who built and sold an AI company from Pakistan. Real classes and Q&amp;A, not a recording library.</li>
      <li>Cohort 01 is capped at <strong>10 people</strong>, so you get genuine access and 1-on-1 time.</li>
      <li>Everything is built for one outcome: <strong>making real money with AI from Pakistan</strong> — international clients, products that sell, even your own US company.</li>
    </ul>`)}
    ${p('Ready? It takes one minute to lock your seat in — your place in Cohort 01 is confirmed instantly.')}
    <p style="margin:24px 0;">${btn(SEAT, 'Lock in my seat →')}</p>
    ${sign}
  `)
}

// ---- Step 2: proof / story (day 1) ----
export function proofHtml({ firstName } = {}) {
  return shell(`
    ${h1('From Pakistan — to a US acquisition.')}
    ${p(name1(firstName) || 'Quick story —')}
    ${p('A few years ago I was just another engineer in Pakistan with a laptop and an internet connection.')}
    ${p('I started building with AI, turned it into a real company — <strong>Virtuans AI</strong> — and earlier this year a US firm <strong>acquired it</strong>. <em>Business Recorder</em> and <em>Profit by Pakistan Today</em> both covered the deal.')}
    ${p("I'm not telling you this to impress you. I'm telling you because of what it proves: <strong>you do not need to leave Pakistan, and you do not need to be a genius,</strong> to build something the world will pay for.")}
    ${p('You need the right skills and the right path. That is the entire reason I built this cohort — to hand you the exact playbook I used, step by step.')}
    <p style="margin:24px 0;">${btn(SEAT, "See what's inside →")}</p>
    ${sign}
  `)
}

// ---- Step 3: outcomes / what's inside (day 2) ----
export function outcomesHtml({ firstName } = {}) {
  return shell(`
    ${h1('6 live classes. Real skills. Real outcomes.')}
    ${p(hey(firstName))}
    ${p('Most courses leave you with notes and motivation. This one leaves you with skills you can use the same week. By the end of the 6 live classes, you will be able to:')}
    ${box(`<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.8;color:#3a3a3a;">
      <li>Build real things with AI (Claude) — apps, agents, tools — <strong>without being a hardcore coder</strong></li>
      <li>Find and land <strong>international clients</strong>, and package your work so they pay you in dollars</li>
      <li>Turn your skills into a <strong>product you can sell</strong> — not just hourly freelance work</li>
      <li>Set up a <strong>US company</strong> and receive international payments from Pakistan</li>
      <li>And if you want to go all the way — the same <strong>acquisition playbook</strong> I used to sell my company</li>
    </ul>`)}
    ${p('Plus 1-on-1 advisory time with me and my co-founder Muddassar, and a private community you keep for life.')}
    ${p('Six live sessions, taught by someone who has actually done it — not theory off YouTube.')}
    <p style="margin:24px 0;">${btn(SEAT, 'Secure my seat →')}</p>
    ${sign}
  `)
}

// ---- Step 4: objection crusher (day 3) ----
export function objectionsHtml({ firstName } = {}) {
  return shell(`
    ${h1('“I’m not technical. Will this even work for me?”')}
    ${p(name1(firstName) || 'A straight answer —')}
    ${p('This is the #1 thing people message me. So let me be honest with you:')}
    ${box(`
      <p style="font-size:14.5px;line-height:1.7;color:#3a3a3a;margin:0 0 12px;"><strong>“I can't code.”</strong> — Good. The whole point of AI is that you don't have to. I'll show you how to build working things with tools like Claude, in plain English. Class 02 is built exactly for non-technical people.</p>
      <p style="font-size:14.5px;line-height:1.7;color:#3a3a3a;margin:0 0 12px;"><strong>“I don't have time.”</strong> — It's 6 live classes, 60 minutes each, over 4 weeks — all recorded. A few focused hours a week is enough.</p>
      <p style="font-size:14.5px;line-height:1.7;color:#3a3a3a;margin:0;"><strong>“Will it work for someone in Pakistan?”</strong> — It was built by someone in Pakistan, for people in Pakistan. Every example — clients, payments, the US company — is designed for exactly your situation.</p>
    `)}
    ${p('The only people this does not work for are the ones who never start.')}
    <p style="margin:24px 0;">${btn(SEAT, 'Secure my seat →')}</p>
    ${sign}
  `)
}

// ---- Step 5: scarcity / decision (day 5) ----
export function scarcityHtml({ firstName } = {}) {
  return shell(`
    ${h1('Only 10 seats. Here’s why.')}
    ${p(name1(firstName) || 'Quick one —')}
    ${p("Cohort 01 is capped at <strong>10 people</strong>. Not 100, not 50 — 10.")}
    ${p("That's on purpose: Muddassar and I show up live, answer your questions, and give real 1-on-1 advisory time. That only works with a tiny group. It starts <strong>July 1</strong>, and once the 10 seats are taken, that's it for this round.")}
    ${p("If you've been thinking about it, this is the moment — there literally isn't room to wait.")}
    <p style="margin:24px 0;">${btn(SEAT, 'Claim my seat →')}</p>
    ${p('Got a question stopping you? Just reply to this email — it comes straight to me.')}
    ${sign}
  `)
}

// ---- Step 6: last call / re-engagement (day 7) ----
export function lastCallHtml({ firstName } = {}) {
  return shell(`
    ${h1('Last call.')}
    ${p(name1(firstName) || "I'll keep this short —")}
    ${p("This is the last you'll hear from me about Cohort 01. There are only <strong>10 seats</strong>, and it starts <strong>July 1</strong> — so this is your moment to decide.")}
    ${p("You applied for a reason — something told you it's time to stop watching the AI wave and start riding it. That reason hasn't gone anywhere.")}
    ${p('The job market isn’t going to save you. But the skill to build and sell with AI is yours for life.')}
    <p style="margin:24px 0;">${btn(SEAT, 'Secure my seat →')}</p>
    ${p("If you're in, lock your seat now. If one last question is holding you back, just reply to this email — it comes straight to me and I'll personally make sure you get an answer.")}
    ${p("After this I won't keep emailing you about Cohort 01 — but I'd genuinely hate for you to miss it.")}
    ${sign}
  `)
}

// ===================================================================
//  Other transactional emails
// ===================================================================

// ---- Lead opt-in welcome (legacy /start opt-in) ----
export function leadWelcomeHtml({ firstName } = {}) {
  return shell(`
    ${h1('Your training is unlocked 🔓')}
    ${p(hey(firstName))}
    ${p("Thanks for signing up. Here's the one-sentence version: <strong>the people who learn to build and sell with AI right now will be miles ahead of everyone waiting.</strong> In the training I break down the exact system I used to build an AI company in Pakistan and sell it to a US firm.")}
    ${p('Watch it — then if it clicks, apply for one of the 10 seats in Cohort 01 (starts <strong>July 1</strong>).')}
    <p style="margin:26px 0;">${btn('https://www.raheelab.com/academy.html', 'Watch & apply →')}</p>
    ${p("Over the next few days I'll send a couple of real lessons and answer the questions people always ask. Reply anytime — it reaches me directly.")}
    ${sign}
  `)
}

// ---- Post-purchase welcome ----
export function purchaseWelcomeHtml({ firstName } = {}) {
  const hi = firstName ? `Welcome, ${firstName} 🎉` : 'Welcome aboard 🎉'
  return shell(`
    ${eyebrow('Cohort 01 · Starts July 1, 2026')}
    ${h1(hi)}
    ${p("You're officially enrolled in the <strong>AI Product Academy</strong>. Your payment is confirmed and your seat is locked in — smart move. You just got on the right side of the AI gap.")}
    ${box(`<div style="font-family:monospace;font-size:11px;color:#8B7332;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;">What happens next</div>
      <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:#3a3a3a;">
        <li>I'll email your cohort schedule &amp; Zoom links before July 1</li>
        <li>You'll get an invite to the private community where everything happens</li>
        <li>A short pre-work checklist so you hit the ground running on day one</li>
        <li>Lifetime access to all recordings</li>
      </ul>`)}
    ${p('In the meantime, do one thing: create a <a href="https://claude.ai" style="color:#8B7332;">Claude</a> account if you don\'t have one — that\'s our main build tool.')}
    ${p('Questions about anything? Just reply to this email — it comes straight to me.')}
    ${p('See you on the inside,')}
    ${sign}
  `)
}
