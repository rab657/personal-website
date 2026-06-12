/**
 * AIPA Admin — human window into the agent-operated funnel.
 * Reads/writes through /api/agent (same API the AI agents use).
 * Auth: paste the ops key once (CRON_SECRET); kept in localStorage.
 */
import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'

const STAGES = [
  { id: 'applied', label: 'New', icon: '📥' },
  { id: 'nurturing', label: 'Nurturing', icon: '📧' },
  { id: 'hot', label: 'Hot', icon: '🔥' },
  { id: 'won', label: 'Won', icon: '🏆' },
  { id: 'lost', label: 'Lost', icon: '🌑' },
]
const STEP_LABEL = { 1: 'E1 welcome', 2: 'E2 proof', 3: 'E3 inside', 4: 'E4 objections', 5: 'E5 scarcity', 6: 'E6 last call' }

// wa.me link with a warm prefilled hello; fixes 0xxx → 92xxx numbers
function waLink(a) {
  let num = (a.whatsapp || '').replace(/[^\d]/g, '')
  if (num.startsWith('0')) num = '92' + num.slice(1) // local PK format → E.164
  const fn = (a.name || '').trim().split(/\s+/)[0]
  const msg = a.transfer_claimed
    ? `Salam ${fn} — Raheel here from AI Product Academy. Thanks for your transfer! Whenever you're ready, send over the receipt and I'll confirm your seat right away. 🙌`
    : `Salam ${fn} — Raheel here, from AI Product Academy. Thanks for applying to Cohort 01! Just wanted to say hi personally. If you have any questions at all — about the classes, the schedule, anything — I'm right here, ask away. Time's a bit short before we kick off, so don't hesitate. 🙂`
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
}

function ago(iso) {
  if (!iso) return '—'
  const d = (Date.now() - Date.parse(iso)) / 3600000
  if (d < 1) return `${Math.max(1, Math.round(d * 60))}m ago`
  if (d < 24) return `${Math.round(d)}h ago`
  return `${Math.round(d / 24)}d ago`
}

export default function Admin() {
  const [key, setKey] = useState('')
  const [authed, setAuthed] = useState(false)
  const [state, setState] = useState(null)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    const k = typeof window !== 'undefined' && localStorage.getItem('aipa_admin_key')
    if (k) { setKey(k); load(k) }
  }, [])

  async function load(k) {
    setErr('')
    try {
      const r = await fetch(`/api/agent?action=state&key=${encodeURIComponent(k)}`)
      if (r.status === 401) { setAuthed(false); setErr('Invalid key'); return }
      const j = await r.json()
      setState(j); setAuthed(true)
      localStorage.setItem('aipa_admin_key', k)
    } catch (e) { setErr('Could not reach /api/agent') }
  }

  async function act(action, payload, label) {
    setBusy(label || action); setErr('')
    try {
      const r = await fetch('/api/agent?key=' + encodeURIComponent(key), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      })
      const j = await r.json()
      if (!r.ok) setErr(j.error || 'action failed')
      await load(key)
    } catch (e) { setErr(String(e)) } finally { setBusy('') }
  }

  const cols = useMemo(() => {
    const by = {}; STAGES.forEach((s) => (by[s.id] = []))
    ;(state?.applicants || []).forEach((a) => (by[a.stage] || by.applied).push(a))
    return by
  }, [state])

  if (!authed) {
    return (
      <Shell>
        <div className="gate">
          <div className="kicker">{'// AIPA OPS'}</div>
          <h1>Mission control.</h1>
          <p className="sub">Enter the ops key to open the pipeline.</p>
          <input type="password" value={key} placeholder="ops key" onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(key)} />
          <button className="gold" onClick={() => load(key)}>Open dashboard →</button>
          {err && <div className="err">{err}</div>}
        </div>
      </Shell>
    )
  }

  const g = state?.goal || { seats: 10, sold: 0 }
  const s = state?.stats || {}
  return (
    <Shell>
      <header className="top">
        <div>
          <div className="kicker">{'// AIPA MISSION CONTROL'}</div>
          <h1>{g.sold} <span className="dim">/ {g.seats} seats sold</span></h1>
          <div className="bar"><div className="fill" style={{ width: `${(g.sold / g.seats) * 100}%` }} /></div>
        </div>
        <div className="statrow">
          <Stat n={s.applications} l="applications" />
          <Stat n={s.nurturing} l="nurturing" />
          <Stat n={s.hot} l="hot" />
          <Stat n={s.checkout_started} l="hit checkout" />
        </div>
        <div className="actions">
          <button onClick={() => load(key)} disabled={!!busy}>↻ Refresh</button>
          <button onClick={() => act('run_drip', {}, 'drip')} disabled={!!busy}>{busy === 'drip' ? 'Sending…' : '▶ Run drip now'}</button>
          <a className="btnlike" href={`/api/agent?action=audience&key=${encodeURIComponent(key)}`}>⬇ Meta audience CSV</a>
        </div>
        {err && <div className="err">{err}</div>}
      </header>

      <main className="board">
        {STAGES.map((st) => (
          <section key={st.id} className="col">
            <div className="colhead">{st.icon} {st.label} <span className="count">{cols[st.id].length}</span></div>
            {cols[st.id].map((a) => (
              <article key={a.customer_id} className={`card ${a.stage}`}>
                <div className="row1">
                  <b>{a.name || '—'}</b>
                  <span className="when">{ago(a.applied_at)}</span>
                </div>
                <div className="meta">{a.email || 'no email'}</div>
                <div className="meta">{a.goal || '—'}</div>
                <div className="tags">
                  <span className="tag">{STEP_LABEL[a.seq_step] || `step ${a.seq_step}`}</span>
                  {a.country && <span className="tag">{a.country}</span>}
                  <span className="tag">{a.source}</span>
                  {a.checkout_started && <span className="tag hotTag">💳 reached checkout</span>}
                  {a.transfer_claimed && <span className="tag hotTag">💸 claims transfer — VERIFY in bank first</span>}
                </div>
                {a.notes && <div className="notes">{a.notes}</div>}
                <div className="cardacts">
                  {a.whatsapp && <a href={waLink(a)} target="_blank" rel="noreferrer">WhatsApp</a>}
                  {a.seq_step < 6 && a.stage !== 'won' && (
                    <button disabled={!!busy} onClick={() => act('advance_drip', { customer_id: a.customer_id }, a.customer_id)}>
                      {busy === a.customer_id ? '…' : `Send E${a.seq_step + 1} now`}
                    </button>
                  )}
                  {a.transfer_claimed && (
                    <button disabled={!!busy} onClick={() => act('clear_claim', { customer_id: a.customer_id })}>✕ didn&apos;t pay</button>
                  )}
                  <button disabled={!!busy} onClick={() => { const n = prompt('Note:'); if (n) act('add_note', { customer_id: a.customer_id, note: n }) }}>Note</button>
                  <select value={a.stage} disabled={!!busy} onChange={(e) => act('set_stage', { customer_id: a.customer_id, stage: e.target.value })}>
                    {STAGES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                  </select>
                </div>
              </article>
            ))}
            {!cols[st.id].length && <div className="empty">empty</div>}
          </section>
        ))}
      </main>
      <footer className="foot">agent ops API: <code>/api/agent</code> · state {state?.generated_at?.slice(0, 16).replace('T', ' ')} UTC</footer>
    </Shell>
  )
}

function Stat({ n, l }) {
  return <div className="stat"><div className="n">{n ?? '—'}</div><div className="l">{l}</div></div>
}

function Shell({ children }) {
  return (
    <div className="wrap">
      <Head>
        <title>AIPA Mission Control</title>
        <meta name="robots" content="noindex,nofollow" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      {children}
      <style jsx global>{`
        :root { --bg:#0A0A0A; --card:#161616; --gold:#C8A44E; --goldL:#E8D5A0; --goldD:#8B7332; --tx:#F5F0E8; --tx2:#A09882; --mut:#6B6355; --bd:#2A2520; --bdG:#3D3425; }
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:var(--bg); color:var(--tx); font-family:'DM Sans',-apple-system,sans-serif; }
        .wrap { min-height:100vh; padding:28px 22px 60px; background:radial-gradient(80% 50% at 50% -10%, #1b1305 0%, #0A0A0A 60%); }
        .kicker { font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.18em; color:var(--goldD); text-transform:uppercase; margin-bottom:10px; }
        h1 { font-family:'Instrument Serif',Georgia,serif; font-weight:400; font-size:40px; }
        h1 .dim { color:var(--tx2); font-size:24px; }
        .gate { max-width:380px; margin:18vh auto 0; text-align:center; }
        .gate .sub { color:var(--tx2); margin:10px 0 22px; font-size:14px; }
        .gate input { width:100%; background:#0d0b08; border:1px solid var(--bdG); color:var(--tx); padding:13px 14px; font-size:15px; outline:none; margin-bottom:12px; }
        .gate input:focus { border-color:var(--gold); }
        button, .btnlike { background:transparent; border:1px solid var(--bdG); color:var(--tx2); padding:9px 14px; font-size:13px; cursor:pointer; font-family:inherit; text-decoration:none; display:inline-block; }
        button:hover, .btnlike:hover { border-color:var(--gold); color:var(--goldL); }
        button.gold { background:var(--gold); color:#0a0a0a; border:none; font-weight:700; width:100%; padding:13px; font-size:15px; }
        button.gold:hover { background:var(--goldL); }
        button:disabled { opacity:.45; cursor:default; }
        .err { color:#C44D3F; font-size:13px; margin-top:12px; }
        .top { max-width:1500px; margin:0 auto 26px; }
        .bar { height:6px; background:#1d1813; border:1px solid var(--bdG); max-width:420px; margin-top:12px; }
        .fill { height:100%; background:linear-gradient(90deg,var(--gold),var(--goldL)); transition:width .4s; }
        .statrow { display:flex; gap:26px; margin:20px 0 16px; flex-wrap:wrap; }
        .stat .n { font-family:'Instrument Serif',serif; font-size:30px; color:var(--goldL); }
        .stat .l { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--mut); text-transform:uppercase; letter-spacing:.1em; }
        .actions { display:flex; gap:10px; flex-wrap:wrap; }
        .board { max-width:1500px; margin:0 auto; display:grid; grid-template-columns:repeat(5,1fr); gap:14px; align-items:start; }
        @media (max-width:1100px){ .board { grid-template-columns:repeat(2,1fr);} }
        @media (max-width:640px){ .board { grid-template-columns:1fr;} h1{font-size:30px;} }
        .col { background:#100e0b; border:1px solid var(--bd); padding:12px; min-height:120px; }
        .colhead { font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--tx2); margin-bottom:12px; display:flex; align-items:center; gap:6px; }
        .colhead .count { margin-left:auto; color:var(--gold); }
        .card { background:var(--card); border:1px solid var(--bd); padding:13px; margin-bottom:10px; }
        .card.won { border-color:var(--gold); }
        .card.hot { border-color:#7a5a23; }
        .row1 { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px; }
        .row1 b { font-size:14.5px; }
        .when { font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--mut); }
        .meta { font-size:12px; color:var(--tx2); margin-bottom:3px; word-break:break-all; }
        .tags { display:flex; gap:5px; flex-wrap:wrap; margin:8px 0; }
        .tag { font-family:'JetBrains Mono',monospace; font-size:9.5px; color:var(--goldD); border:1px solid var(--bdG); padding:2px 7px; text-transform:uppercase; letter-spacing:.05em; }
        .hotTag { color:#c9f7dc; border-color:#1f6e43; }
        .notes { font-size:11.5px; color:var(--mut); font-style:italic; margin:6px 0; }
        .cardacts { display:flex; gap:6px; flex-wrap:wrap; align-items:center; margin-top:8px; }
        .cardacts a { color:#8fe7b4; font-size:12px; text-decoration:none; border:1px solid #1f6e43; padding:7px 10px; }
        .cardacts button { padding:7px 10px; font-size:12px; }
        .cardacts select { background:#0d0b08; color:var(--tx2); border:1px solid var(--bdG); padding:7px 6px; font-size:12px; font-family:inherit; }
        .empty { color:var(--mut); font-size:12px; font-family:'JetBrains Mono',monospace; text-align:center; padding:18px 0; }
        .foot { max-width:1500px; margin:26px auto 0; color:var(--mut); font-size:11.5px; font-family:'JetBrains Mono',monospace; }
        .foot code { color:var(--goldD); }
      `}</style>
    </div>
  )
}
