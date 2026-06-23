/**
 * Agent-first ops API — the control plane for the AI Product Academy funnel.
 *
 * Designed to be operated by AI agents (Claude orchestrator) with the /admin
 * page as the human window. Auth: CRON_SECRET via ?key= or Bearer header.
 *
 * GET  ?action=help              → self-describing action schema (for agents)
 * GET  ?action=state             → full pipeline state (applicants + checkouts + stats)
 * GET  ?action=audience          → CSV of applicants for Meta custom-audience upload
 * POST {action:'advance_drip', customer_id}            → send next sequence email now
 * POST {action:'send_email', customer_id, subject, body} → custom 1-off email (plain text body)
 * POST {action:'set_stage', customer_id, stage}        → applied|nurturing|hot|won|lost
 * POST {action:'add_note', customer_id, note}          → append timestamped note
 * POST {action:'run_drip'}                             → run full due-now drip pass
 *
 * State storage: Stripe customer metadata (no DB in this stack — deliberate).
 * Keys used: seq_step, seq_last_at, stage, notes, touches, utm_source/campaign/content.
 */
import { sendEmail, seqHtml, SEQ_SUBJECTS, finalHtml, FINAL_SUBJECTS } from '../../lib/email'

const MAX_STEP = 6
const DUE_AFTER_DAYS = { 2: 1, 3: 2, 4: 3, 5: 5, 6: 7 }
const STAGES = ['applied', 'nurturing', 'hot', 'won', 'lost']
const firstName = (n) => (n ? String(n).trim().split(/\s+/)[0] : '')

const HELP = {
  service: 'AIPA agent ops API',
  goal: '10 paid seats for Cohort 01',
  actions: {
    'GET ?action=state': 'Full pipeline: applicants[], paid[], stats{}',
    'GET ?action=audience': 'CSV (email,phone,fn,country) for Meta custom audience upload',
    'POST advance_drip {customer_id}': 'Send the next drip email immediately, bump seq_step',
    'POST send_email {customer_id, subject, body}': 'Send a custom plain-text email (wrapped in brand shell)',
    'POST set_stage {customer_id, stage}': `One of ${STAGES.join('|')}`,
    'POST add_note {customer_id, note}': 'Append timestamped note (kept in Stripe metadata)',
    'POST run_drip {}': 'Run the standard due-now drip pass across all applicants',
    'POST final_push {step:1|2|3}': 'Broadcast a final-week closing email to all warm (non-won/lost) leads; deduped via final_step',
    'POST clear_claim {customer_id}': 'Clear a false/premature "I made the transfer" claim (claims are unverified signals until money lands)',
    'POST mark_contacted {customer_id}': 'Stamp that you reached out (sets contacted_at + increments outreach_count) — fired when the WhatsApp button is clicked',
  },
}

function stripeKey() {
  return process.env.STRIPE_SECRET_KEY || process.env.STRIPE_REAL_SECRET_KEY
}
async function stripe(path, params, method) {
  const opts = { headers: { Authorization: `Bearer ${stripeKey()}` } }
  if (params) {
    opts.method = method || 'POST'
    opts.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    opts.body = new URLSearchParams(params).toString()
  }
  const r = await fetch(`https://api.stripe.com/v1/${path}`, opts)
  return r.json()
}
async function allPages(resource) {
  const out = []
  let after = null
  for (let i = 0; i < 20; i++) {
    const d = await stripe(`${resource}?limit=100${after ? `&starting_after=${after}` : ''}`)
    out.push(...(d.data || []))
    if (!d.has_more) break
    after = d.data[d.data.length - 1]?.id
  }
  return out
}

// Real sale = paid and >= $400-equivalent (filters out old $10 test prices)
function isRealSale(s) {
  return s.payment_status === 'paid' && (s.amount_total || 0) / 100 >= 400
}

async function getApplicants() {
  const custs = await allPages('customers')
  return custs.filter((c) => (c.metadata || {}).source === 'academy_application')
}

async function buildState() {
  const [apps, sessions] = await Promise.all([getApplicants(), allPages('checkout/sessions')])
  const paidSessions = sessions.filter(isRealSale)
  const paidEmails = new Set(paidSessions.map((s) => ((s.customer_details || {}).email || s.customer_email || '').toLowerCase()).filter(Boolean))
  const startedEmails = new Set(sessions.map((s) => ((s.customer_details || {}).email || s.customer_email || '').toLowerCase()).filter(Boolean))

  const applicants = apps.map((c) => {
    const m = c.metadata || {}
    const email = (c.email || '').toLowerCase()
    const paid = email && paidEmails.has(email)
    const started = email ? startedEmails.has(email) : false
    const step = parseInt(m.seq_step || '1', 10)
    const transferClaimed = m.transfer_claimed === '1'
    // smart default: claimed transfer / reached checkout = hot; else by drip depth
    let stage = m.stage || (paid ? 'won' : transferClaimed || started || step >= 5 ? 'hot' : step >= 2 ? 'nurturing' : 'applied')
    if (paid) stage = 'won'
    return {
      customer_id: c.id,
      name: c.name || '',
      email: c.email || '',
      whatsapp: m.whatsapp || c.phone || '',
      country: m.country || '',
      goal: m.goal || '',
      situation: m.situation || '',
      readiness: m.readiness || '',
      applied_at: m.applied_at || '',
      seq_step: parseInt(m.seq_step || '1', 10),
      seq_last_at: m.seq_last_at || m.applied_at || '',
      stage,
      notes: m.notes || '',
      touches: parseInt(m.touches || '0', 10),
      source: [m.utm_source, m.utm_campaign, m.utm_content].filter(Boolean).join(' / ') || 'direct',
      checkout_started: email ? startedEmails.has(email) : false,
      transfer_claimed: transferClaimed,
      contacted_at: m.contacted_at || '',
      outreach_count: parseInt(m.outreach_count || '0', 10),
      paid,
    }
  }).sort((a, b) => (b.applied_at || '').localeCompare(a.applied_at || ''))

  const won = applicants.filter((a) => a.stage === 'won').length
  return {
    goal: { seats: 10, sold: won, remaining: 10 - won },
    stats: {
      applications: applicants.length,
      nurturing: applicants.filter((a) => a.stage === 'nurturing').length,
      hot: applicants.filter((a) => a.stage === 'hot').length,
      won,
      lost: applicants.filter((a) => a.stage === 'lost').length,
      checkout_started: applicants.filter((a) => a.checkout_started).length,
      real_paid_sessions: paidSessions.length,
    },
    applicants,
    generated_at: new Date().toISOString(),
  }
}

async function touch(c, extra) {
  const m = c.metadata || {}
  const params = {
    'metadata[touches]': String(parseInt(m.touches || '0', 10) + 1),
    'metadata[seq_last_at]': new Date().toISOString(),
  }
  for (const k of Object.keys(extra || {})) params[`metadata[${k}]`] = extra[k]
  return stripe(`customers/${c.id}`, params)
}

// Plain-text body → branded HTML (same shell vibe as the sequence)
function customHtml(body, fn) {
  const paras = String(body).trim().split(/\n{2,}/).map((p) => `<p style="font-size:15px;line-height:1.7;color:#3a3a3a;margin:0 0 15px;">${p.replace(/\n/g, '<br>')}</p>`).join('')
  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f1ea;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;"><div style="max-width:560px;margin:0 auto;padding:32px 20px;"><div style="font-family:Georgia,serif;font-size:22px;color:#0A0A0A;margin-bottom:24px;">raheel<span style="color:#C8A44E;">.</span> <span style="font-size:13px;color:#8B7332;letter-spacing:.04em;font-family:-apple-system,sans-serif;">AI PRODUCT ACADEMY</span></div><div style="background:#fff;border:1px solid #e7e1d4;border-radius:8px;padding:32px 28px;">${fn ? `<p style="font-size:15px;line-height:1.7;color:#3a3a3a;margin:0 0 15px;">Hey ${fn},</p>` : ''}${paras}<p style="font-size:15px;line-height:1.7;color:#3a3a3a;margin:22px 0 0;">— Raheel</p></div></div></body></html>`
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  const given = (req.query.key || '') || String(req.headers.authorization || '').replace('Bearer ', '')
  if (!secret || given !== secret) return res.status(401).json({ error: 'Unauthorized' })

  try {
    if (req.method === 'GET') {
      const action = req.query.action || 'help'
      if (action === 'help') return res.status(200).json(HELP)
      if (action === 'state') return res.status(200).json(await buildState())
      if (action === 'audience') {
        const apps = await getApplicants()
        const rows = [['email', 'phone', 'fn', 'country'].join(',')]
        for (const c of apps) {
          const m = c.metadata || {}
          rows.push([c.email || '', (m.whatsapp || c.phone || '').replace(/[^+\d]/g, ''), firstName(c.name), (m.country || '').toLowerCase()].join(','))
        }
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename="aipa-meta-audience.csv"')
        return res.status(200).send(rows.join('\n'))
      }
      return res.status(400).json({ error: `Unknown action '${action}'`, help: HELP })
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
    const { action, customer_id, stage, note, subject, body } = req.body || {}

    if (action === 'final_push') {
      const step = parseInt(req.body.step || '1', 10)
      if (!(step in FINAL_SUBJECTS)) return res.status(400).json({ error: 'step must be 1, 2, or 3' })
      const apps = await getApplicants()
      let sent = 0
      const results = []
      for (const c of apps) {
        const m = c.metadata || {}
        if (!c.email || m.stage === 'won' || m.stage === 'lost' || m.purchased === '1') continue
        if (parseInt(m.final_step || '0', 10) >= step) continue // already got this step or later
        const r = await sendEmail({ to: c.email, subject: FINAL_SUBJECTS[step], html: finalHtml(step, { firstName: firstName(c.name) }) })
        if (r && !r.error && !r.skipped) {
          await stripe(`customers/${c.id}`, { 'metadata[final_step]': String(step) })
          sent++; results.push({ id: c.id, email: c.email })
        }
      }
      return res.status(200).json({ ok: true, step, sent, results })
    }

    if (action === 'run_drip') {
      const apps = await getApplicants()
      const now = Date.now()
      let sent = 0
      const results = []
      for (const c of apps) {
        const m = c.metadata || {}
        if (!c.email || m.stage === 'won' || m.stage === 'lost' || m.purchased === '1') continue
        const next = parseInt(m.seq_step || '1', 10) + 1
        if (next > MAX_STEP || !(next in DUE_AFTER_DAYS)) continue
        const age = (now - (Date.parse(m.applied_at || '') || now)) / 86400000
        if (age < DUE_AFTER_DAYS[next]) continue
        const r = await sendEmail({ to: c.email, subject: SEQ_SUBJECTS[next], html: seqHtml(next, { firstName: firstName(c.name) }) })
        if (r && !r.error && !r.skipped) {
          await touch(c, { seq_step: String(next) })
          sent++; results.push({ customer_id: c.id, step: next })
        }
      }
      return res.status(200).json({ ok: true, sent, results })
    }

    if (!customer_id) return res.status(400).json({ error: 'customer_id required' })
    const c = await stripe(`customers/${customer_id}`, null)
    if (!c || c.error) return res.status(404).json({ error: 'customer not found' })
    const m = c.metadata || {}

    if (action === 'advance_drip') {
      const next = parseInt(m.seq_step || '1', 10) + 1
      if (next > MAX_STEP) return res.status(400).json({ error: 'sequence complete (step 6 sent)' })
      if (!c.email) return res.status(400).json({ error: 'no email on file' })
      const r = await sendEmail({ to: c.email, subject: SEQ_SUBJECTS[next], html: seqHtml(next, { firstName: firstName(c.name) }) })
      if (!r || r.error || r.skipped) return res.status(502).json({ error: 'send failed', detail: r })
      await touch(c, { seq_step: String(next) })
      return res.status(200).json({ ok: true, sent_step: next, email_id: r.id })
    }
    if (action === 'send_email') {
      if (!c.email) return res.status(400).json({ error: 'no email on file' })
      if (!subject || !body) return res.status(400).json({ error: 'subject and body required' })
      const r = await sendEmail({ to: c.email, subject, html: customHtml(body, firstName(c.name)) })
      if (!r || r.error || r.skipped) return res.status(502).json({ error: 'send failed', detail: r })
      await touch(c)
      return res.status(200).json({ ok: true, email_id: r.id })
    }
    if (action === 'set_stage') {
      if (!STAGES.includes(stage)) return res.status(400).json({ error: `stage must be one of ${STAGES.join('|')}` })
      await stripe(`customers/${customer_id}`, { 'metadata[stage]': stage })
      return res.status(200).json({ ok: true, stage })
    }
    if (action === 'mark_contacted') {
      const n = parseInt(m.outreach_count || '0', 10) + 1
      await stripe(`customers/${customer_id}`, {
        'metadata[contacted_at]': new Date().toISOString(),
        'metadata[outreach_count]': String(n),
      })
      return res.status(200).json({ ok: true, outreach_count: n })
    }
    if (action === 'clear_claim') {
      const stamp = new Date().toISOString().slice(0, 10)
      const merged = `${m.notes ? m.notes + ' | ' : ''}${stamp}: transfer claim cleared (not paid)`.slice(-450)
      await stripe(`customers/${customer_id}`, {
        'metadata[transfer_claimed]': '',
        'metadata[notes]': merged,
      })
      return res.status(200).json({ ok: true })
    }
    if (action === 'add_note') {
      if (!note) return res.status(400).json({ error: 'note required' })
      const stamp = new Date().toISOString().slice(0, 10)
      const merged = `${m.notes ? m.notes + ' | ' : ''}${stamp}: ${note}`.slice(-450)
      await stripe(`customers/${customer_id}`, { 'metadata[notes]': merged })
      return res.status(200).json({ ok: true, notes: merged })
    }
    return res.status(400).json({ error: `Unknown action '${action}'`, help: HELP })
  } catch (e) {
    console.error('[agent]', e)
    return res.status(500).json({ error: String(e) })
  }
}
