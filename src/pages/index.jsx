/* eslint-disable @next/next/no-img-element */
import Head from 'next/head'
import { useState, useEffect } from 'react'

const FALLBACK_POSTS = [
  { title: "Weekly Snapshot: The World Owes You Nothing", slug: "weekly-snapshot-the-world-owes-you-nothing", feature_image: "https://images.unsplash.com/photo-1733866055327-762ba798ed48?w=720", excerpt: "The world doesn't owe you a thing. The sooner you internalize that, the sooner you start building with urgency.", published_at: "2025-10-13", reading_time: 2, tag: "Weekly Snapshot" },
  { title: "Weekly Snapshot: The Empty Boat", slug: "weekly-snapshot-the-empty-boat", feature_image: "https://images.unsplash.com/photo-1607724764418-457a6efc920d?w=720", excerpt: "An ancient Zen parable about anger, expectations, and the stories we tell ourselves.", published_at: "2025-09-28", reading_time: 2, tag: "Weekly Snapshot" },
  { title: "Weekly Snapshot: Fate", slug: "weekly-snapshot-destiny-fate", feature_image: "https://images.unsplash.com/photo-1698086033556-b2d3d6583951?w=720", excerpt: "Is our path predetermined or do we carve it ourselves?", published_at: "2025-09-21", reading_time: 2, tag: "Startup" },
  { title: "Abundance of Time is an Illusion", slug: "weekly-snapsho", feature_image: "https://images.unsplash.com/photo-1559199882-6959a71820bc?w=720", excerpt: "We think we have all the time in the world. We don't.", published_at: "2025-09-13", reading_time: 3, tag: "Weekly Snapshot" },
  { title: "Pillars of Creation", slug: "weekly-snapshot-pillars-of-creation", feature_image: "https://images.unsplash.com/photo-1708112292872-fd5612affa79?w=720", excerpt: "What the cosmos teaches us about building things that last.", published_at: "2024-11-03", reading_time: 2, tag: "Weekly Snapshot" },
  { title: "Making Good Decisions", slug: "weekly-snapshot-making-good-decisions", feature_image: "https://images.unsplash.com/photo-1614767629805-3bbcf6e26c7d?w=720", excerpt: "A framework for decision-making from years of building companies.", published_at: "2024-09-29", reading_time: 3, tag: "Weekly Snapshot" },
]

const VENTURES = [
  { name: "AutoAcquire AI", role: "Head of AI Product", period: "2026 — Present", status: "current", desc: "Leading AI product for America's $1T used car market. Building agentic AI that automates vehicle acquisition for US dealerships at scale.", url: "https://www.autoacquireai.com", img: "https://cdn.prod.website-files.com/6894e52d14329566400cacd8/691c991abf205d70be8c18c4_key1.webp", badge: "CURRENT" },
  { name: "Virtuans AI", role: "Co-Founder & CEO", period: "2024 — 2026", status: "acquired", desc: "Autonomous AI voice & chat agents for enterprise sales. 40+ languages. $12M pipeline generated. Acquired by AutoAcquire AI in a seven-figure cash-and-equity deal.", url: "https://www.virtuans.ai", img: "https://cdn.sanity.io/images/2wqe6h5m/production/f666d074c5ee78f8c509f66ceccb0202a8da3247-5437x3628.jpg?w=600&auto=format", badge: "ACQUIRED" },
  { name: "Magnara, Inc.", role: "Founder", period: "2025 — Present", status: "building", desc: "AI procurement platform for hardware manufacturers. Cross-border China sourcing autopilot. Delaware C-Corp. Building AgenticCalling (MCP-native AI voice infra).", url: null, img: null, badge: "BUILDING" },
  { name: "Voltec Appliances", role: "Operator", period: "2023 — Present", status: "current", desc: "Solar equipment & EVE LFP lithium battery import/export from China to Pakistan. Family business modernized with AI-driven procurement.", url: null, img: null, badge: "OPERATING" },
  { name: "DevNation", role: "Co-Founder", period: "2021 — Present", status: "current", desc: "Pakistan's first ISA-based tech accelerator. Techstars Toronto '21 — first Pakistani startup accepted. 80-90% job placement rate.", url: "https://www.thedevnation.com", img: "https://cdn.prod.website-files.com/62d08ba41587731f3556644b/62f0a117b7b0923dee92b90e_Screenshot%202022-08-08%20at%2010.37.14%20AM.png", badge: "TECHSTARS" },
  { name: "explainX.ai", role: "Co-Founder", period: "2019 — 2021", status: "exited", desc: "Open-source Explainable AI framework. 300+ GitHub stars, 100K+ downloads. NVIDIA Inception. Exited.", url: "https://github.com/explainX/explainx", img: null, badge: "EXITED" },
  { name: "mltrons", role: "Co-Founder", period: "2017 — 2020", status: "exited", desc: "No-code AutoML platform. First company, started as a junior at NYU.", url: null, img: null, badge: "FIRST CO" },
]

// Your own YouTube channel — the "Latest from YouTube" section auto-pulls the
// most recent uploads from this channel's RSS feed (see getStaticProps below).
const YT_CHANNEL_ID = "UC34y3BNyf3WVhbMDOTWgKNQ" // youtube.com/@raheel1

// Invitations & Speeches — curated talks, conference invites, and guest
// appearances. To add one, just paste the YouTube video ID (the part after
// "watch?v=") and a short title + description.
const INVITED = [
  { id: "tLYa0dVAr_0", title: "ExplainX — Explainable AI (AISC Conference)", desc: "Presenting our open-source Explainable AI framework at the Aggregate Intellect conference." },
]

// Decode the HTML entities YouTube uses in RSS titles (&amp; &#39; etc.)
function decodeEntities(s) {
  return (s || "")
    .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
}

const PRESS = [
  { title: "Pakistani Startup Virtuans AI Acquired in Seven-Figure Deal", source: "TechJuice", url: "https://www.techjuice.pk/pakistani-startup-virtuans-ai-acquired-in-seven-figure-deal-by-us-bases-autoacquire-ai", date: "Feb 2026", feat: true },
  { title: "AutoAcquire AI Acquires Virtuans to Accelerate Agentic AI", source: "EIN Presswire", url: "https://www.einpresswire.com/article/888787552/autoacquire-ai-acquires-virtuans-to-accelerate-agentic-ai-innovation-in-automotive-dealer-acquisition", date: "Feb 2026", feat: true },
  { title: "AutoAcquire AI Acquires Virtuans AI Startup", source: "LetsDataScience", url: "https://www.letsdatascience.com/news/autoacquire-ai-acquires-virtuans-ai-startup-d9237b8c", date: "Feb 2026" },
  { title: "AutoAcquire AI Acquires Virtuans — Press Coverage", source: "National Law Review", url: "https://natlawreview.com/press-releases/autoacquire-ai-acquires-virtuans-accelerate-agentic-ai-innovation-automotive", date: "Feb 2026" },
  { title: "Techstars Invests in Pakistani Startup DevNation", source: "TechJuice", url: "https://www.techjuice.pk/techstars-invests-in-pakistani-startup-devnation-to-provide-50-million-under-skilled-pakistanis-with-full-time-jobs/", date: "Oct 2021" },
  { title: "Virtuans AI — Featured Launch", source: "Product Hunt", url: "https://www.producthunt.com/products/virtuans-ai", date: "May 2025" },
]

// Reused on-brand assets for items whose source blocks scrapers / has no og:image
const IMG_VIRTUANS = "https://cdn.sanity.io/images/2wqe6h5m/production/f666d074c5ee78f8c509f66ceccb0202a8da3247-5437x3628.jpg?w=600&auto=format"
const IMG_AUTOACQUIRE = "https://cdn.prod.website-files.com/6894e52d14329566400cacd8/691c991abf205d70be8c18c4_key1.webp"
const IMG_AUTOACQUIRE_BANNER = "https://cdn.prod.website-files.com/6894e52d14329566400cacd8/697bbf7ed1f08814379f9e89_0082_2026-01_AutoAcquire_Widget-Banner.png"
const IMG_EXPLAINX = "https://cdn.prod.website-files.com/62d08ba41587731f3556644b/62f0a51dac1aca4b7333421d_Screenshot%202022-08-08%20at%2010.54.26%20AM.png"
const IMG_DEVNATION = "https://cdn.prod.website-files.com/62d08ba41587731f3556644b/62f0a117b7b0923dee92b90e_Screenshot%202022-08-08%20at%2010.37.14%20AM.png"

// Press grouped by category — each item links out, most with a real preview image
const PRESS_GROUPS = [
  {
    label: "// The Acquisition", title: "In the press.",
    desc: "Our seven-figure acquisition by AutoAcquire AI, covered across U.S. and Pakistani media.",
    items: [
      { source: "Business Recorder", title: "US tech firm AutoAcquire AI acquires Pakistani AI startup Virtuans in seven-figure deal", date: "Feb 2026", feat: true, url: "https://www.brecorder.com/news/40406499/us-tech-firm-autoacquire-ai-acquires-pakistani-ai-startup-virtuans-in-seven-figure-deal", img: IMG_VIRTUANS },
      { source: "TechJuice", title: "Pakistani Startup Virtuans AI Acquired in Seven-Figure Deal by U.S. AI Firm", date: "Feb 2026", feat: true, url: "https://www.techjuice.pk/pakistani-startup-virtuans-ai-acquired-in-seven-figure-deal-by-us-bases-autoacquire-ai/", img: "https://www.techjuice.pk/wp-content/uploads/2026/02/pakistani-startup-virtuans-ai-acquired-in-seven-figure-deal-by-u-s-ai-firm-techjuice-216516-1.jpg" },
      { source: "Profit — Pakistan Today", title: "Pakistani startup Virtuans AI acquired by US automotive tech firm", date: "Feb 2026", url: "https://profit.pakistantoday.com.pk/2026/02/10/pakistani-startup-virtuans-ai-acquired-by-us-automotive-tech-firm/", img: "https://profit.pakistantoday.com.pk/wp-content/uploads/2026/02/Virtuans.webp" },
      { source: "HUM English", title: "US firm AutoAcquire acquires Pakistani AI startup Virtuans in multimillion-dollar deal", date: "Feb 2026", url: "https://humenglish.com/latest/us-firm-autoacquire-acquires-pakistani-ai-startup-virtuans-in-multimillion-dollar-deal/", img: "https://humenglish341f88e60e.blob.core.windows.net/humenglish/uploads/2026/02/ai.jpg" },
      { source: "Let's Data Science", title: "AutoAcquire AI Acquires Virtuans AI Startup", date: "Feb 2026", url: "https://letsdatascience.com/news/autoacquire-ai-acquires-virtuans-ai-startup-d9237b8c", img: IMG_VIRTUANS },
      { source: "EIN Presswire", title: "AutoAcquire AI Acquires Virtuans to Accelerate Agentic AI Innovation", date: "Feb 2026", url: "https://www.einpresswire.com/article/888787552/autoacquire-ai-acquires-virtuans-to-accelerate-agentic-ai-innovation-in-automotive-dealer-acquisition", img: IMG_AUTOACQUIRE },
      { source: "Desert Sun", title: "AutoAcquire AI Acquires Virtuans to Accelerate Agentic AI Innovation", date: "Feb 2026", url: "https://www.desertsun.com/press-release/story/85983/autoacquire-ai-acquires-virtuans-to-accelerate-agentic-ai-innovation-in-automotive-dealer-acquisition/", img: IMG_AUTOACQUIRE_BANNER },
      { source: "Pensacola News Journal", title: "AutoAcquire AI Acquires Virtuans to Accelerate Agentic AI Innovation", date: "Feb 2026", url: "https://www.pnj.com/press-release/story/29596/autoacquire-ai-acquires-virtuans-to-accelerate-agentic-ai-innovation-in-automotive-dealer-acquisition/", img: IMG_AUTOACQUIRE_BANNER },
      { source: "National Law Review", title: "AutoAcquire AI Acquires Virtuans — Press Coverage", date: "Feb 2026", url: "https://natlawreview.com/press-releases/autoacquire-ai-acquires-virtuans-accelerate-agentic-ai-innovation-automotive", img: IMG_AUTOACQUIRE_BANNER },
      { source: "Product Hunt", title: "Virtuans AI — Featured Launch", date: "May 2025", url: "https://www.producthunt.com/products/virtuans-ai", img: "https://cdn.sanity.io/images/2wqe6h5m/production/94547f4a11ccb789f3d222a3e6540676e6c78eef-794x491.webp?w=600&auto=format" },
    ],
  },
  {
    label: "// Writing & Features", title: "Articles & publications.",
    desc: "Bylines and features on AI, explainability, and building from emerging markets.",
    items: [
      { source: "HackerNoon", title: "Building Machine Learning Algorithms That We Can Trust", date: "2020", url: "https://hackernoon.com/building-machine-learning-algorithms-that-we-can-trust-nzcw32td", img: "https://hackernoon.imgix.net/images/tshy3y20.jpg" },
      { source: "AI Time Journal", title: "Practical Explainable AI: Unlocking the Black Box & Building Trustworthy AI", date: "2020", url: "https://www.aitimejournal.com/practical-explainable-ai-unlocking-the-black-box-and-building-trustworthy-ai-systems-2/24799/", img: "https://cdn.bcl.to/sites/aitimejournal/wp-content/uploads/2020/07/5ef2d79a4cea7748500a4477_Screen-Shot-2020-06-24-at-12.33.17-AM.png" },
      { source: "Towards Data Science", title: "How Can We Build Explainable AI?", date: "2020", url: "https://medium.com/data-science/how-can-we-build-explainable-ai-f79f4a134406", img: IMG_EXPLAINX },
      { source: "Towards Data Science", title: "6 Essential Practices to Implement Machine Learning in Your Organization", date: "2020", url: "https://medium.com/data-science/6-essential-practices-to-successfully-implement-machine-learning-in-your-organization-cfba8d7cafbb", img: IMG_EXPLAINX },
      { source: "Towards Data Science", title: "Get Started With Data Science and Win During COVID-19", date: "2020", url: "https://medium.com/data-science/get-started-with-data-science-and-win-during-covid-19-97365da7bccb", img: IMG_EXPLAINX },
      { source: "TechNode", title: "Investors say capital winter will prune China's overheated tech sector (quoted)", date: "Jun 2019", url: "https://technode.com/2019/06/04/investors-say-capital-winter-will-prune-chinas-overheated-tech-sector/", img: "https://i0.wp.com/technode.com/wp-content/uploads/2019/05/snow-3762470_1280.jpg?fit=1280%2C720&ssl=1" },
      { source: "Daily Times", title: "The Dark Side of the Moon", date: "2020", url: "https://dailytimes.com.pk/618510/the-dark-side-of-the-moon/" },
      { source: "Crypto Investment Times", title: "Pieces of the Same Puzzle: AI & Blockchain (feature)", date: "2020", url: "https://www.linkedin.com/pulse/pieces-same-puzzle-ai-blockchain-aly-madhavji-%E7%A9%86%E4%BA%9A%E9%9C%96/" },
      { source: "Formtek", title: "Algorithmic Economy: Unintended Consequences from Algorithmic Errors (quoted)", date: "2020", url: "https://formtek.com/blog/algorithmic-economy-unintended-consequences-from-algorithmic-errors/" },
      { source: "Towards Data Science", title: "All articles on Medium / TDS", date: "Archive", url: "https://medium.com/@raheelb" },
      { source: "HackerNoon", title: "All articles on HackerNoon", date: "Archive", url: "https://hackernoon.com/u/rab657" },
    ],
  },
  {
    label: "// Stage & Screen", title: "Talks & interviews.",
    desc: "Conference talks, fireside chats, and interviews — from TEDx Beijing to AI research conferences.",
    items: [
      { source: "AISC", title: "ExplainX — Explainable AI (AISC Live Session)", date: "2020", url: "https://www.youtube.com/watch?v=tLYa0dVAr_0", img: "https://i.ytimg.com/vi/tLYa0dVAr_0/hqdefault.jpg" },
      { source: "FDML Conference", title: "Speaker — Federated & Distributed Machine Learning Conference 2020", date: "2020", url: "https://www.youtube.com/watch?v=6t1HtbDBP1c", img: "https://i.ytimg.com/vi/6t1HtbDBP1c/hqdefault.jpg" },
      { source: "Daftarkhwan", title: "Fireside Chat at Daftarkhwan Conference", date: "2021", url: "https://www.youtube.com/watch?v=oZJUlPo8Nvw", img: "https://i.ytimg.com/vi/oZJUlPo8Nvw/hqdefault.jpg" },
      { source: "The New York News", title: "Fireside Chat with Raheel Ahmad, Co-Founder of DevNation", date: "2021", url: "https://www.thenewyork.news/fireside-chat-with-raheel-ahmad-co-founder-of-devnation", img: "https://www.thenewyork.news/wp-content/uploads/2021/08/54728557_10218954140628659_7024503790967455744_n-1024x692.jpeg" },
      { source: "TechJuice", title: "DevNation: Become a Software Engineer with Zero Upfront Cost", date: "2021", url: "https://www.techjuice.pk/become-a-software-engineer-with-zero-upfront-cost-devnation-is-on-a-mission-to-create-1-million-software-engineers-in-pakistan-by-2025", img: "https://www.techjuice.pk/wp-content/uploads/2021/03/value-proposition1.png" },
      { source: "SuperVisas", title: "Interview: The Techstars Co-Founders of DevNation", date: "2021", url: "https://supervisas.com/blog/techstars-co-founders-of-devnation/", img: IMG_DEVNATION },
      { source: "Koko Spotlights", title: "Startup Spotlight: DevNation", date: "2021", url: "https://kokospotlights.me/blogs/devnation/", img: IMG_DEVNATION },
      { source: "TEDx", title: "Speaker @ TEDxYouth (Beijing)", date: "2019", url: "https://www.ted.com/tedx/events/34424" },
    ],
  },
]

const AWARDS = [
  "UAE Golden Visa — 10-year residency",
  "NVIDIA Inception Program for AI Startups (2019)",
  "ALPHA Startup Track — RISE 2019, Hong Kong",
  "Winner — TECOM Conf. Startup Pitch, Shanghai (2019)",
  "2nd Prize — Smart China Expo Cup in Big Data (2019)",
  "Top 2 — Caohejing Overseas Pitch Competition (2019)",
  "Top 8 — Intel FPGA Competition (2019)",
  "Winner — $50,000 Zhenjiang Government High-Tech Grant (2020)",
  "Visiting Research Scholar, Explainable AI — NYU Tandon",
]

const GALLERY = [
  "/gallery/image-1.jpg",
  "/gallery/image-2.jpg",
  "/gallery/image-3.jpg",
  "/gallery/image-4.jpg",
  "/gallery/image-5.jpg",
]

const TIMELINE = [
  { year: 2026, t: "Virtuans AI acquired by AutoAcquire AI", d: "Seven-figure cash + equity deal. Now Head of AI Product.", hl: true },
  { year: 2025, t: "Built & launched AgenticCalling", d: "MCP-native AI voice infrastructure. YC S2026 application submitted.", hl: false },
  { year: 2024, t: "Founded Virtuans AI", d: "Autonomous AI agents for enterprise sales. 40+ languages.", hl: false },
  { year: 2023, t: "Started Voltec Appliances", d: "Solar & lithium battery import/export from China.", hl: false },
  { year: 2021, t: "DevNation — Techstars Toronto", d: "First Pakistani startup in Techstars. ISA-based accelerator.", hl: true },
  { year: 2019, t: "Co-founded explainX.ai", d: "Open-source Explainable AI. 300+ GitHub stars. Exited.", hl: false },
  { year: 2018, t: "Graduated NYU Stern", d: "Business & Marketing, CS minor. Shanghai + New York.", hl: false },
  { year: 2017, t: "Co-founded mltrons", d: "First company. No-code AutoML. Started as junior at NYU.", hl: false },
]

const SOCIALS = [
  { l: "LinkedIn", u: "https://linkedin.com/in/raheelahmad12" },
  { l: "X / Twitter", u: "https://twitter.com/raheelahmadxai" },
  { l: "YouTube", u: "https://youtube.com/@raheel1" },
  { l: "GitHub", u: "https://github.com/rab657" },
]

const sColor = (s) => s==="acquired"?"#D4A853":s==="exited"?"#888":s==="building"?"#60A5FA":"#4ADE80"

// Admin panel is dev-only — never rendered in production builds
const DEV = process.env.NODE_ENV !== "production"

// "As seen in" logo strip on the home page (favicon-based brand marks)
const SEEN_IN = [
  { name: "Business Recorder", domain: "brecorder.com", url: "https://www.brecorder.com/news/40406499/us-tech-firm-autoacquire-ai-acquires-pakistani-ai-startup-virtuans-in-seven-figure-deal" },
  { name: "Pakistan Today", domain: "pakistantoday.com.pk", url: "https://profit.pakistantoday.com.pk/2026/02/10/pakistani-startup-virtuans-ai-acquired-by-us-automotive-tech-firm/" },
  { name: "TechJuice", domain: "techjuice.pk", url: "https://www.techjuice.pk/pakistani-startup-virtuans-ai-acquired-in-seven-figure-deal-by-us-bases-autoacquire-ai/" },
  { name: "EIN Presswire", domain: "einpresswire.com", url: "https://www.einpresswire.com/article/888787552/autoacquire-ai-acquires-virtuans-to-accelerate-agentic-ai-innovation-in-automotive-dealer-acquisition" },
  { name: "Product Hunt", domain: "producthunt.com", url: "https://www.producthunt.com/products/virtuans-ai" },
  { name: "National Law Review", domain: "natlawreview.com", url: "https://natlawreview.com/press-releases/autoacquire-ai-acquires-virtuans-accelerate-agentic-ai-innovation-automotive" },
]

function Admin({ c, setC, close }) {
  const [f, setF] = useState({...c})
  const [ok, setOk] = useState(false)
  const save = () => { setC(f); try{localStorage.setItem("rs-v3",JSON.stringify(f))}catch(e){} setOk(true); setTimeout(()=>setOk(false),1000) }
  const I = ({l,k,m}) => (
    <div style={{marginBottom:12}}>
      <label style={{display:"block",fontSize:10,color:"#666",marginBottom:2,fontFamily:"var(--m)",textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</label>
      {m ? <textarea value={f[k]||""} onChange={e=>setF({...f,[k]:e.target.value})} style={{width:"100%",background:"#151515",border:"1px solid #252525",color:"#ccc",padding:"7px 9px",fontSize:12,fontFamily:"inherit",minHeight:60,resize:"vertical",boxSizing:"border-box"}} />
        : <input value={f[k]||""} onChange={e=>setF({...f,[k]:e.target.value})} style={{width:"100%",background:"#151515",border:"1px solid #252525",color:"#ccc",padding:"7px 9px",fontSize:12,fontFamily:"inherit",boxSizing:"border-box"}} />}
    </div>
  )
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:9999,overflow:"auto",display:"flex",justifyContent:"center",padding:"32px 16px"}}>
      <div style={{background:"#0d0d0d",border:"1px solid #222",maxWidth:540,width:"100%",padding:"28px 26px",position:"relative",height:"fit-content"}}>
        <button onClick={close} style={{position:"absolute",top:12,right:14,background:"none",border:"none",color:"#555",fontSize:20,cursor:"pointer"}}>x</button>
        <h2 style={{fontFamily:"var(--s)",fontSize:22,marginBottom:20,color:"#eee"}}>Admin Panel</h2>
        <I l="Headline" k="headline" /><I l="Bio" k="bio" m /><I l="Profile Image URL" k="profileImg" />
        <div style={{fontFamily:"var(--m)",fontSize:9,color:"#D4A853",marginTop:16,marginBottom:8,textTransform:"uppercase"}}>Ghost Blog</div>
        <I l="Ghost URL" k="ghostUrl" /><I l="Content API Key" k="ghostKey" />
        <div style={{fontFamily:"var(--m)",fontSize:9,color:"#D4A853",marginTop:16,marginBottom:8,textTransform:"uppercase"}}>Course</div>
        <I l="Course Name" k="courseName" /><I l="Tagline" k="courseTag" m /><I l="Price" k="coursePrice" /><I l="External URL" k="courseUrl" />
        <button onClick={save} style={{width:"100%",padding:11,background:ok?"#4ADE80":"#D4A853",color:"#000",fontWeight:700,border:"none",cursor:"pointer",fontSize:12,marginTop:16}}>{ok?"Saved!":"Save"}</button>
      </div>
    </div>
  )
}

function SH({l,t,s}){ return <div style={{marginBottom:36}}><div style={{fontFamily:"var(--m)",fontSize:11,color:"#D4A853",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8}}>{l}</div><h2 style={{fontFamily:"var(--s)",fontSize:32,lineHeight:1.15,fontWeight:400,marginBottom:s?8:0}}>{t}</h2>{s&&<p style={{fontSize:14,color:"#777",maxWidth:580,lineHeight:1.6}}>{s}</p>}</div> }

export default function Home({ ytVideos = [] }) {
  const [pg, setPg] = useState("home")
  const [posts, setPosts] = useState(FALLBACK_POSTS)
  const [adm, setAdm] = useState(false)
  const [menu, setMenu] = useState(false)
  const [c, setC] = useState({
    headline: "Entrepreneur, AI nerd & restless builder.",
    bio: "Entrepreneur and AI product leader. Co-founded Virtuans AI (acquired by AutoAcquire AI, seven-figure deal). Head of AI Product at AutoAcquire AI. NYU Stern '18. Based in Dubai.",
    profileImg: "/profile.jpeg",
    ghostUrl: "https://blog.raheelab.com", ghostKey: "",
    courseName: "AI Product Academy", courseTag: "A 30-day live course for PMs, engineers & entrepreneurs who want to build AI products that get acquired. 6 live classes. Real tools. Real outcomes.", coursePrice: "$800", courseUrl: "",
  })

  useEffect(()=>{ try{const s=localStorage.getItem("rs-v3");if(s)setC(JSON.parse(s))}catch(e){} },[])
  useEffect(()=>{ if(!c.ghostKey)return; fetch(`${c.ghostUrl}/ghost/api/content/posts/?key=${c.ghostKey}&limit=12&include=tags&fields=title,slug,feature_image,excerpt,published_at,reading_time`).then(r=>r.json()).then(d=>{if(d.posts?.length)setPosts(d.posts)}).catch(()=>{}) },[c.ghostKey,c.ghostUrl])
  useEffect(()=>{ if(!DEV)return; const h=(e)=>{if(e.ctrlKey&&e.shiftKey&&e.key==="A")setAdm(true)}; window.addEventListener("keydown",h); return()=>window.removeEventListener("keydown",h) },[])
  // Swap any preview image that failed to load (incl. before hydration) for its branded placeholder
  useEffect(()=>{ document.querySelectorAll("img[data-ph]").forEach((img)=>{ const swap=()=>{ img.style.display="none"; const ph=img.nextElementSibling; if(ph) ph.style.display="flex" }; if(img.complete && img.naturalWidth===0) swap(); else img.addEventListener("error", swap, {once:true}) }) },[pg])

  const go = (p) => { setPg(p); setMenu(false); window.scrollTo(0,0) }
  const NAV = [{k:"home",l:"Home"},{k:"ventures",l:"Ventures"},{k:"blog",l:"Blog"},{k:"videos",l:"Videos"},{k:"press",l:"Press"},{k:"course",l:c.courseName,href:"/academy.html"}]

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0a",color:"#E8E6E3",fontFamily:"'DM Sans',sans-serif",fontSize:15,lineHeight:1.65}}>
      <Head>
        <title>Raheel Ahmad — Entrepreneur, AI Builder & Investor</title>
        <meta name="description" content="Raheel Ahmad — entrepreneur and AI product leader. Co-founded Virtuans AI (acquired by AutoAcquire AI in a seven-figure deal). Head of AI Product at AutoAcquire AI. NYU Stern '18. Based in Dubai." />
        <meta property="og:title" content="Raheel Ahmad — Entrepreneur, AI Builder & Investor" />
        <meta property="og:description" content="Co-founded Virtuans AI (acquired by AutoAcquire AI, seven-figure deal). Head of AI Product at AutoAcquire AI." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.raheelab.com/profile.jpeg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap');:root{--s:'Instrument Serif',Georgia,serif;--m:'JetBrains Mono',monospace;--g:#D4A853;--bd:#1c1c1c}body{margin:0;padding:0}::selection{background:rgba(212,168,83,0.25)}.nb{background:none;border:none;color:#555;font-size:13px;cursor:pointer;padding:8px 14px;font-family:inherit;transition:color .2s}.nb:hover{color:#ccc}.nb.on{color:var(--g)}.sp{font-family:var(--m);font-size:11px;color:var(--g);text-decoration:none;padding:6px 14px;border:1px solid #2a2a2a;transition:all .25s;display:inline-block}.sp:hover{border-color:var(--g);background:rgba(212,168,83,.06)}.bc{border:1px solid var(--bd);overflow:hidden;transition:border-color .3s;text-decoration:none;color:inherit;display:block}.bc:hover{border-color:var(--g)}.gi{flex:none;width:220px;height:280px;object-fit:cover;border-radius:12px;transition:transform .4s}.gi:nth-child(odd){transform:rotate(2deg)}.gi:nth-child(even){transform:rotate(-2deg)}.gi:hover{transform:rotate(0) scale(1.03)}.gscroll{overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:#2a2a2a transparent}.gscroll::-webkit-scrollbar{height:6px}.gscroll::-webkit-scrollbar-track{background:transparent}.gscroll::-webkit-scrollbar-thumb{background:#2a2a2a;border-radius:3px}.gscroll::-webkit-scrollbar-thumb:hover{background:var(--g)}.navlinks{display:flex;align-items:center;gap:2px}.navtoggle{display:none;background:none;border:none;color:#ccc;font-size:23px;line-height:1;cursor:pointer;padding:6px 8px;font-family:inherit}.navmobile{display:none}@media(max-width:768px){.hg,.vg,.bg{grid-template-columns:1fr!important}.sg{grid-template-columns:repeat(2,1fr)!important}.gi{width:150px;height:200px}.navlinks{display:none!important}.navtoggle{display:block!important}.navmobile{display:flex!important}}` }} />

      {/* Nav */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(10,10,10,.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid #141414",padding:"0 24px"}}>
        <div style={{maxWidth:1080,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",height:54}}>
          <span onClick={()=>go("home")} style={{fontFamily:"var(--s)",fontSize:18,cursor:"pointer"}}>raheel<span style={{color:"var(--g)"}}>.</span></span>
          <div className="navlinks">
            {NAV.map(n=> n.href
              ? <a key={n.k} href={n.href} className="nb" style={{textDecoration:"none"}}>{n.l}</a>
              : <button key={n.k} onClick={()=>go(n.k)} className={`nb ${pg===n.k?"on":""}`}>{n.l}</button>)}
            {DEV && <button onClick={()=>setAdm(true)} className="nb" style={{fontSize:11,opacity:.3}} title="Ctrl+Shift+A">⚙</button>}
          </div>
          <button className="navtoggle" onClick={()=>setMenu(m=>!m)} aria-label="Toggle menu">{menu?"✕":"☰"}</button>
        </div>
        {menu && <div className="navmobile" style={{maxWidth:1080,margin:"0 auto",flexDirection:"column",borderTop:"1px solid #141414",padding:"6px 0 10px"}}>
          {NAV.map(n=> n.href
            ? <a key={n.k} href={n.href} className="nb" style={{textAlign:"left",width:"100%",padding:"12px 6px",fontSize:15,textDecoration:"none"}}>{n.l}</a>
            : <button key={n.k} onClick={()=>go(n.k)} className={`nb ${pg===n.k?"on":""}`} style={{textAlign:"left",width:"100%",padding:"12px 6px",fontSize:15}}>{n.l}</button>)}
          {DEV && <button onClick={()=>{setAdm(true);setMenu(false)}} className="nb" style={{textAlign:"left",width:"100%",padding:"12px 6px",fontSize:13,opacity:.5}}>⚙ Admin</button>}
        </div>}
      </nav>

      {DEV && adm && <Admin c={c} setC={setC} close={()=>setAdm(false)} />}

      <div style={{maxWidth:1080,margin:"0 auto",padding:"0 24px"}}>

        {/* ══ HOME ══ */}
        {pg==="home" && <>
          {/* Banner */}
          <a href={PRESS_GROUPS[0].items[0].url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",margin:"20px 0 0",border:"1px solid rgba(212,168,83,.2)",background:"rgba(212,168,83,.04)",textDecoration:"none"}}>
            <span style={{fontSize:16,flexShrink:0}}>🏆</span>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#ddd"}}>Virtuans AI acquired by AutoAcquire AI — seven-figure deal</div><div style={{fontSize:11,color:"#777",fontFamily:"var(--m)"}}>Business Recorder · Feb 2026</div></div>
            <span style={{color:"#444",flexShrink:0}}>→</span>
          </a>

          {/* Hero */}
          <div className="hg" style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:48,alignItems:"center",padding:"60px 0 44px"}}>
            <div>
              <div style={{fontFamily:"var(--m)",fontSize:11,color:"var(--g)",textTransform:"uppercase",letterSpacing:".12em",marginBottom:14}}>Entrepreneur · AI Builder · Investor</div>
              <h1 style={{fontFamily:"var(--s)",fontSize:48,lineHeight:1.08,fontWeight:400,marginBottom:18}}>{c.headline}</h1>
              <div style={{fontSize:15,color:"#999",lineHeight:1.75,whiteSpace:"pre-line",marginBottom:24}}>{c.bio}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{SOCIALS.map(s=><a key={s.l} href={s.u} target="_blank" rel="noopener noreferrer" className="sp">{s.l}</a>)}</div>
            </div>
            <div>
              <img src={c.profileImg} alt="Raheel Ahmad" style={{width:"100%",border:"2px solid var(--g)",display:"block"}} />
              <div style={{fontFamily:"var(--m)",fontSize:10,color:"#444",textAlign:"center",marginTop:8}}>Dubai, UAE · Pakistan</div>
            </div>
          </div>

          {/* Gallery — horizontal scroll */}
          <div className="gscroll" style={{margin:"0 -24px",padding:"0 24px"}}>
            <div style={{display:"flex",gap:20,padding:"20px 0",width:"max-content"}}>{GALLERY.map((s,i)=><img key={i} src={s} alt="" className="gi" loading="lazy" draggable="false" />)}</div>
          </div>

          {/* Stats */}
          <div className="sg" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,padding:"48px 0",borderBottom:"1px solid var(--bd)"}}>
            {[{n:"7+",l:"Figure acquisition deal"},{n:"4",l:"AI companies built"},{n:"40+",l:"Languages our AI speaks"},{n:"2",l:"Successful exits"}].map((s,i)=>(
              <div key={i} style={{background:"#111",border:"1px solid var(--bd)",padding:22,textAlign:"center"}}>
                <div style={{fontFamily:"var(--s)",fontSize:30,color:"var(--g)"}}>{s.n}</div>
                <div style={{fontSize:12,color:"#666",marginTop:4}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Press logo strip */}
          <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"16px 24px",padding:"22px 0",borderBottom:"1px solid var(--bd)"}}>
            <span style={{fontFamily:"var(--m)",fontSize:10,color:"#444",textTransform:"uppercase",letterSpacing:".1em"}}>As seen in</span>
            {SEEN_IN.map((s,i)=>(
              <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" title={s.name} style={{display:"flex",alignItems:"center",gap:8,textDecoration:"none",opacity:.55,transition:"opacity .25s"}} onMouseEnter={e=>e.currentTarget.style.opacity=1} onMouseLeave={e=>e.currentTarget.style.opacity=.55}>
                <img src={`https://www.google.com/s2/favicons?domain=${s.domain}&sz=128`} alt="" width={20} height={20} style={{display:"block",borderRadius:4,flexShrink:0}} loading="lazy" />
                <span style={{fontFamily:"var(--m)",fontSize:12,color:"#999",whiteSpace:"nowrap"}}>{s.name}</span>
              </a>
            ))}
          </div>

          {/* Featured acquisition coverage */}
          <div style={{padding:"48px 0 8px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:12,flexWrap:"wrap",marginBottom:22}}>
              <div>
                <div style={{fontFamily:"var(--m)",fontSize:11,color:"var(--g)",textTransform:"uppercase",letterSpacing:".12em",marginBottom:8}}>{"// Acquisition Coverage"}</div>
                <h2 style={{fontFamily:"var(--s)",fontSize:28,lineHeight:1.15,fontWeight:400}}>Virtuans AI → AutoAcquire AI</h2>
              </div>
              <button onClick={()=>go("press")} style={{background:"none",border:"1px solid var(--bd)",color:"#999",padding:"9px 18px",fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>All press →</button>
            </div>
            <div className="bg" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
              {PRESS_GROUPS[0].items.slice(0,3).map((p,i)=>(
                <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="bc">
                  <div style={{position:"relative"}}>
                    {p.img && <img src={p.img} alt="" loading="lazy" data-ph="1" onError={e=>{e.currentTarget.style.display="none"; const ph=e.currentTarget.nextElementSibling; if(ph) ph.style.display="flex"}} style={{width:"100%",height:160,objectFit:"cover",display:"block",borderBottom:"1px solid var(--bd)"}} />}
                    <div style={{display:p.img?"none":"flex",height:160,alignItems:"center",justifyContent:"center",padding:"0 18px",textAlign:"center",borderBottom:"1px solid var(--bd)",background:"linear-gradient(135deg,#161616,rgba(212,168,83,.07))"}}><span style={{fontFamily:"var(--s)",fontSize:22,color:"#8B7332"}}>{p.source}</span></div>
                  </div>
                  <div style={{padding:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                      <span style={{fontFamily:"var(--m)",fontSize:10,color:"var(--g)"}}>{p.source}</span>
                      {p.date&&<span style={{fontFamily:"var(--m)",fontSize:10,color:"#444"}}>{p.date}</span>}
                      {p.feat&&<span style={{fontSize:8,background:"rgba(212,168,83,.15)",color:"var(--g)",padding:"2px 6px",fontFamily:"var(--m)",fontWeight:600}}>NEW</span>}
                    </div>
                    <div style={{fontFamily:"var(--s)",fontSize:16,lineHeight:1.3,color:"#eee"}}>{p.title}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Articles + Sidebar */}
          <div className="hg" style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:48,padding:"56px 0"}}>
            <div>
              <SH l="// On My Mind" t="Latest writing" />
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {posts.slice(0,4).map((p,i)=>(
                  <a key={i} href={`${c.ghostUrl}/${p.slug}/`} target="_blank" rel="noopener noreferrer" className="bc" style={{display:"grid",gridTemplateColumns:"150px 1fr"}}>
                    {p.feature_image&&<img src={p.feature_image} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block",minHeight:100}} />}
                    <div style={{padding:"14px 16px"}}>
                      {p.tag&&<div style={{fontFamily:"var(--m)",fontSize:10,color:"var(--g)",marginBottom:3}}>{p.tag}</div>}
                      <div style={{fontFamily:"var(--s)",fontSize:16,lineHeight:1.3,marginBottom:5}}>{p.title}</div>
                      <div style={{fontSize:11,color:"#555"}}>{p.reading_time||2} min · {new Date(p.published_at).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</div>
                    </div>
                  </a>
                ))}
              </div>
              <button onClick={()=>go("blog")} style={{marginTop:14,background:"none",border:"1px solid var(--bd)",color:"#777",padding:"10px",fontSize:13,cursor:"pointer",fontFamily:"inherit",width:"100%"}}>View all articles →</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              {/* Course CTA */}
              <div style={{border:"1px solid rgba(212,168,83,.25)",background:"rgba(212,168,83,.04)",padding:22}}>
                <div style={{fontFamily:"var(--m)",fontSize:10,color:"var(--g)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>New Course</div>
                <div style={{fontFamily:"var(--s)",fontSize:20,marginBottom:6}}>{c.courseName}</div>
                <p style={{fontSize:12,color:"#888",lineHeight:1.5,marginBottom:12}}>{c.courseTag}</p>
                <a href="/academy.html" style={{display:"block",textAlign:"center",textDecoration:"none",width:"100%",background:"var(--g)",color:"#000",border:"none",padding:"10px 0",fontWeight:700,fontSize:12,cursor:"pointer",boxSizing:"border-box"}}>Learn more → {c.coursePrice}</a>
              </div>
              {/* Newsletter */}
              <div style={{border:"1px solid var(--bd)",padding:22}}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>On My Mind — Newsletter</div>
                <p style={{fontSize:12,color:"#777",lineHeight:1.5,marginBottom:12}}>Weekly musings on entrepreneurship, AI, and decision-making.</p>
                <a href={`${c.ghostUrl}/#/portal/signup`} target="_blank" rel="noopener noreferrer" style={{display:"block",textAlign:"center",border:"1px solid var(--bd)",padding:9,fontSize:12,color:"#aaa",textDecoration:"none"}}>Subscribe →</a>
              </div>
              {/* Resume */}
              <div style={{border:"1px solid var(--bd)",padding:22}}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:14}}>Work</div>
                {VENTURES.slice(0,5).map((v,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div><div style={{fontSize:13,fontWeight:600,color:"#ddd"}}>{v.name}</div><div style={{fontSize:11,color:"#555"}}>{v.role}</div></div><div style={{fontSize:10,color:"#444",fontFamily:"var(--m)",flexShrink:0}}>{v.period.split("—")[0].trim()}</div></div>)}
              </div>
            </div>
          </div>

          {/* Latest videos */}
          {ytVideos.length>0 && <div style={{padding:"0 0 56px"}}>
            <SH l="// On YouTube" t="Latest videos" />
            <div className="bg" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
              {ytVideos.slice(0,3).map((v,i)=>(
                <a key={i} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="bc">
                  <div style={{position:"relative"}}>
                    <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" style={{width:"100%",height:160,objectFit:"cover",display:"block"}} loading="lazy" />
                    <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><span style={{background:"rgba(255,0,0,.9)",color:"#fff",borderRadius:"50%",width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>▶</span></span>
                  </div>
                  <div style={{padding:14}}>
                    <div style={{fontFamily:"var(--s)",fontSize:15,lineHeight:1.3,marginBottom:4}}>{v.title}</div>
                    {v.published&&<div style={{fontFamily:"var(--m)",fontSize:10,color:"#444"}}>{new Date(v.published).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>}
                  </div>
                </a>
              ))}
            </div>
            <button onClick={()=>go("videos")} style={{marginTop:14,background:"none",border:"1px solid var(--bd)",color:"#777",padding:"10px",fontSize:13,cursor:"pointer",fontFamily:"inherit",width:"100%"}}>View all videos →</button>
          </div>}
        </>}

        {/* ══ VENTURES ══ */}
        {pg==="ventures" && <div style={{padding:"60px 0"}}>
          <SH l="// Ventures & Companies" t={<>8 years. 7 companies.<br/><em>2 exits. 1 acquisition.</em></>} s="From no-code AutoML as a college junior to getting acquired by a US company." />
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {VENTURES.map((v,i)=>(
              <div key={i} className="vg bc" style={{display:"grid",gridTemplateColumns:v.img?"200px 1fr":"1fr",cursor:v.url?"pointer":"default"}} onClick={()=>v.url&&window.open(v.url,"_blank")}>
                {v.img&&<img src={v.img} alt={v.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block",minHeight:130}} />}
                <div style={{padding:22}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{fontSize:9,fontFamily:"var(--m)",fontWeight:600,padding:"3px 7px",background:`${sColor(v.status)}18`,color:sColor(v.status),letterSpacing:".05em"}}>{v.badge}</span>
                    <span style={{fontFamily:"var(--m)",fontSize:10,color:"#444"}}>{v.period}</span>
                  </div>
                  <h3 style={{fontFamily:"var(--s)",fontSize:20,fontWeight:400,marginBottom:3}}>{v.name}</h3>
                  <div style={{fontSize:12,color:"var(--g)",marginBottom:6,fontWeight:500}}>{v.role}</div>
                  <p style={{fontSize:13,color:"#777",lineHeight:1.6}}>{v.desc}</p>
                  {v.url&&<span style={{fontFamily:"var(--m)",fontSize:10,color:"var(--g)",display:"inline-block",marginTop:8}}>{v.url.replace("https://","")} →</span>}
                </div>
              </div>
            ))}
          </div>
          {/* Timeline */}
          <div style={{marginTop:56,paddingTop:40,borderTop:"1px solid var(--bd)"}}>
            <SH l="// The Journey" t="Timeline" />
            <div style={{position:"relative",paddingLeft:26}}>
              <div style={{position:"absolute",left:7,top:0,bottom:0,width:1,background:"var(--bd)"}} />
              {TIMELINE.map((t,i)=>(
                <div key={i} style={{position:"relative",paddingBottom:24}}>
                  <div style={{position:"absolute",left:-22,top:2,width:14,height:14,borderRadius:"50%",background:t.hl?"var(--g)":"#222",border:t.hl?"none":"2px solid #333"}} />
                  <div style={{fontFamily:"var(--m)",fontSize:10,color:t.hl?"var(--g)":"#555",letterSpacing:".08em",marginBottom:2}}>{t.year}</div>
                  <div style={{fontSize:14,fontWeight:600,color:"#ddd",marginBottom:2}}>{t.t}</div>
                  <div style={{fontSize:13,color:"#666",lineHeight:1.5}}>{t.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>}

        {/* ══ BLOG ══ */}
        {pg==="blog" && <div style={{padding:"60px 0"}}>
          <SH l="// On My Mind" t="Writing & reflections" s={<>Published on <a href={c.ghostUrl} target="_blank" rel="noopener noreferrer" style={{color:"var(--g)"}}>Ghost</a>. Musings on entrepreneurship, decision-making, and life.</>} />
          {!c.ghostKey&&<div style={{background:"#141414",border:"1px solid var(--bd)",padding:14,marginBottom:24,display:"flex",alignItems:"center",gap:10}}><span>💡</span><span style={{fontSize:12,color:"#777"}}>Add your Ghost Content API Key in Admin Panel (⚙) to load posts live.</span></div>}
          <div className="bg" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:18}}>
            {posts.map((p,i)=>(
              <a key={i} href={`${c.ghostUrl}/${p.slug}/`} target="_blank" rel="noopener noreferrer" className="bc">
                {p.feature_image&&<img src={p.feature_image} alt="" style={{width:"100%",height:190,objectFit:"cover",display:"block"}} />}
                <div style={{padding:18}}>
                  <div style={{fontFamily:"var(--s)",fontSize:17,lineHeight:1.3,marginBottom:5}}>{p.title}</div>
                  <p style={{fontSize:12,color:"#666",lineHeight:1.5,marginBottom:6}}>{p.excerpt}</p>
                  <div style={{fontFamily:"var(--m)",fontSize:10,color:"#444"}}>{new Date(p.published_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})} · {p.reading_time||2} min</div>
                </div>
              </a>
            ))}
          </div>
        </div>}

        {/* ══ VIDEOS ══ */}
        {pg==="videos" && <div style={{padding:"60px 0"}}>
          <SH l="// YouTube" t="Videos" s="Talks, demos, and lessons from building AI products." />
          <a href="https://youtube.com/@raheel1" target="_blank" rel="noopener noreferrer" className="sp" style={{marginBottom:8,display:"inline-block"}}>Subscribe on YouTube →</a>

          {/* Latest from YouTube — auto-pulled from the channel RSS feed */}
          {ytVideos.length>0 && <div style={{marginTop:32}}>
            <div style={{fontFamily:"var(--m)",fontSize:11,color:"var(--g)",textTransform:"uppercase",letterSpacing:".12em",marginBottom:16}}>Latest from YouTube</div>
            <div className="bg" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:18}}>
              {ytVideos.map((v,i)=>(
                <a key={i} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" className="bc">
                  <div style={{position:"relative"}}>
                    <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" style={{width:"100%",height:180,objectFit:"cover",display:"block"}} loading="lazy" />
                    <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><span style={{background:"rgba(255,0,0,.9)",color:"#fff",borderRadius:"50%",width:46,height:46,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>▶</span></span>
                  </div>
                  <div style={{padding:14}}>
                    <div style={{fontFamily:"var(--s)",fontSize:16,lineHeight:1.3,marginBottom:4}}>{v.title}</div>
                    {v.published&&<div style={{fontFamily:"var(--m)",fontSize:10,color:"#444"}}>{new Date(v.published).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>}
                  </div>
                </a>
              ))}
            </div>
          </div>}

          {/* Invitations & Speeches — curated talks / guest appearances */}
          {INVITED.length>0 && <div style={{marginTop:48}}>
            <div style={{fontFamily:"var(--m)",fontSize:11,color:"var(--g)",textTransform:"uppercase",letterSpacing:".12em",marginBottom:16}}>Invitations & Speeches</div>
            <div style={{display:"flex",flexDirection:"column",gap:28}}>
              {INVITED.map((v,i)=>(
                <div key={i}>
                  <div style={{position:"relative",paddingBottom:"56.25%",height:0,overflow:"hidden",border:"1px solid var(--bd)"}}>
                    <iframe src={`https://www.youtube.com/embed/${v.id}`} title={v.title} frameBorder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowFullScreen style={{position:"absolute",top:0,left:0,width:"100%",height:"100%"}} />
                  </div>
                  <div style={{padding:"12px 0"}}><div style={{fontFamily:"var(--s)",fontSize:18}}>{v.title}</div><div style={{fontSize:13,color:"#666",marginTop:3}}>{v.desc}</div></div>
                </div>
              ))}
            </div>
          </div>}

          <div style={{marginTop:44,padding:28,background:"#111",border:"1px solid var(--bd)",textAlign:"center"}}>
            <div style={{fontFamily:"var(--s)",fontSize:22,marginBottom:6}}>Want more?</div>
            <p style={{color:"#777",marginBottom:16,fontSize:14}}>Lessons from building AI products, investing, and entrepreneurship.</p>
            <a href="https://youtube.com/@raheel1" target="_blank" rel="noopener noreferrer" style={{display:"inline-block",background:"#FF0000",color:"#fff",padding:"11px 26px",fontWeight:700,fontSize:14,textDecoration:"none"}}>▶ Subscribe</a>
          </div>
        </div>}

        {/* ══ PRESS ══ */}
        {pg==="press" && <div style={{padding:"60px 0"}}>
          <SH l="// Press & Recognition" t="In the press." s="Coverage of our acquisition, plus years of articles, talks, and interviews on AI." />

          {PRESS_GROUPS.map((g,gi)=>(
            <div key={gi} style={{marginTop:gi===0?8:52}}>
              <div style={{fontFamily:"var(--m)",fontSize:11,color:"var(--g)",textTransform:"uppercase",letterSpacing:".12em",marginBottom:4}}>{g.label}</div>
              <h3 style={{fontFamily:"var(--s)",fontSize:24,fontWeight:400,marginBottom:6}}>{g.title}</h3>
              {g.desc&&<p style={{fontSize:13,color:"#777",maxWidth:580,lineHeight:1.6,marginBottom:22}}>{g.desc}</p>}
              <div className="bg" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                {g.items.map((p,i)=>(
                  <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" className="bc">
                    <div style={{position:"relative"}}>
                      {p.img && <img src={p.img} alt="" loading="lazy" data-ph="1" onError={e=>{e.currentTarget.style.display="none"; const ph=e.currentTarget.nextElementSibling; if(ph) ph.style.display="flex"}} style={{width:"100%",height:160,objectFit:"cover",display:"block",borderBottom:"1px solid var(--bd)"}} />}
                      <div style={{display:p.img?"none":"flex",height:160,alignItems:"center",justifyContent:"center",padding:"0 18px",textAlign:"center",borderBottom:"1px solid var(--bd)",background:"linear-gradient(135deg,#161616,rgba(212,168,83,.07))"}}><span style={{fontFamily:"var(--s)",fontSize:22,color:"#8B7332"}}>{p.source}</span></div>
                    </div>
                    <div style={{padding:14}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                        <span style={{fontFamily:"var(--m)",fontSize:10,color:"var(--g)"}}>{p.source}</span>
                        {p.date&&<span style={{fontFamily:"var(--m)",fontSize:10,color:"#444"}}>{p.date}</span>}
                        {p.feat&&<span style={{fontSize:8,background:"rgba(212,168,83,.15)",color:"var(--g)",padding:"2px 6px",fontFamily:"var(--m)",fontWeight:600}}>NEW</span>}
                      </div>
                      <div style={{fontFamily:"var(--s)",fontSize:16,lineHeight:1.3,color:"#eee"}}>{p.title}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}

          {/* Awards & Recognition */}
          <div style={{marginTop:56,paddingTop:40,borderTop:"1px solid var(--bd)"}}>
            <div style={{fontFamily:"var(--m)",fontSize:11,color:"var(--g)",textTransform:"uppercase",letterSpacing:".12em",marginBottom:4}}>{"// Awards & Recognition"}</div>
            <h3 style={{fontFamily:"var(--s)",fontSize:24,fontWeight:400,marginBottom:20}}>Honors & competitions.</h3>
            <div className="bg" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
              {AWARDS.map((a,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,border:"1px solid var(--bd)",padding:"12px 16px"}}>
                  <span style={{color:"var(--g)",flexShrink:0,fontSize:13}}>★</span>
                  <span style={{fontSize:13,color:"#bbb",lineHeight:1.4}}>{a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>}

        {/* ══ COURSE ══ */}
        {pg==="course" && <div style={{padding:"60px 0"}}>
          <div className="hg" style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:44,alignItems:"start"}}>
            <div>
              <div style={{fontFamily:"var(--m)",fontSize:11,color:"var(--g)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:10}}>{"// Learn From Us"}</div>
              <h2 style={{fontFamily:"var(--s)",fontSize:36,fontWeight:400,lineHeight:1.15,marginBottom:12}}>{c.courseName}</h2>
              <p style={{fontSize:15,color:"#999",lineHeight:1.7,marginBottom:24}}>{c.courseTag}</p>
              <h3 style={{fontFamily:"var(--s)",fontSize:20,marginBottom:14}}>In 30 days, you&apos;ll walk out with:</h3>
              {["A validated AI idea scored for acquisition potential","A working product built with Claude, Cursor & modern AI tools","A US Delaware C-Corp — registered, bank account open","Your first 10-20 paying customers","Your startup listed on Acquire.com","A full exit playbook from our real seven-figure deal"].map((x,i)=>(
                <div key={i} style={{display:"flex",gap:9,marginBottom:10}}><span style={{color:"var(--g)",fontWeight:700}}>✓</span><span style={{color:"#ccc",fontSize:14}}>{x}</span></div>
              ))}
              <div style={{marginTop:28,padding:20,background:"rgba(212,168,83,.05)",border:"1px solid rgba(212,168,83,.15)"}}>
                <div style={{fontFamily:"var(--s)",fontSize:17,marginBottom:6}}>Who teaches it</div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <img src={c.profileImg} alt="" style={{width:36,height:36,borderRadius:"50%",border:"2px solid var(--g)",objectFit:"cover"}} />
                  <img src="https://cdn.prod.website-files.com/62d08ba41587731f3556644b/62d08c8df372261178c2e968_dp.jpeg" alt="" style={{width:36,height:36,borderRadius:"50%",border:"2px solid var(--g)",objectFit:"cover"}} />
                  <div><div style={{fontSize:13,fontWeight:600}}>Raheel Ahmad & Muddassar Sharif</div><div style={{fontSize:11,color:"#666"}}>Virtuans AI (acquired) · NYU · NVIDIA · Techstars</div></div>
                </div>
              </div>
            </div>
            <div style={{background:"#111",border:"2px solid var(--g)",padding:24,position:"sticky",top:68}}>
              <div style={{fontFamily:"var(--m)",fontSize:10,color:"var(--g)",textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Cohort 01</div>
              <div style={{fontFamily:"var(--s)",fontSize:42,marginBottom:3}}>{c.coursePrice}</div>
              <div style={{fontSize:12,color:"#666",marginBottom:18}}>One-time · 6 live classes · 30 days</div>
              {["6 live classes (90 min each)","AI product building with Claude & Cursor","US company formation guidance","Customer acquisition playbook","Acquisition marketplace listing","1-on-1 advisory calls","Private cohort community"].map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}><span style={{color:"var(--g)",fontSize:10}}>●</span><span style={{fontSize:12,color:"#aaa"}}>{f}</span></div>
              ))}
              <a href={c.courseUrl||"#"} style={{display:"block",background:"var(--g)",color:"#000",padding:13,textAlign:"center",fontWeight:700,fontSize:14,textDecoration:"none",marginTop:18}}>Enroll Now</a>
              <div style={{fontFamily:"var(--m)",fontSize:10,color:"#444",textAlign:"center",marginTop:7}}>🛡️ 14-day money-back guarantee</div>
            </div>
          </div>
        </div>}

      </div>

      <footer style={{borderTop:"1px solid var(--bd)",padding:"24px",textAlign:"center"}}>
        <div style={{fontFamily:"var(--m)",fontSize:11,color:"#333"}}>© 2026 Raheel Ahmad{SOCIALS.map(s=><span key={s.l}><span style={{margin:"0 8px"}}>·</span><a href={s.u} target="_blank" rel="noopener noreferrer" style={{color:"#444",textDecoration:"none"}}>{s.l}</a></span>)}</div>
      </footer>
    </div>
  )
}

// Fetch the latest uploads from the YouTube channel's public RSS feed at build
// time (and re-fetch hourly via ISR). Done server-side because YouTube's feed
// has no CORS headers, so a browser fetch would be blocked.
export async function getStaticProps() {
  let ytVideos = []
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`)
    const xml = await res.text()
    ytVideos = xml
      .split("<entry>")
      .slice(1) // drop the channel-level metadata before the first <entry>
      .slice(0, 6)
      .map((entry) => ({
        id: (entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1] || "",
        title: decodeEntities((entry.match(/<title>([^<]*)<\/title>/) || [])[1] || ""),
        published: (entry.match(/<published>([^<]+)<\/published>/) || [])[1] || "",
      }))
      .filter((v) => v.id)
  } catch (e) {
    ytVideos = []
  }

  return { props: { ytVideos }, revalidate: 3600 }
}
