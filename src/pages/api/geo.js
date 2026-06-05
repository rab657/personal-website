/**
 * Lightweight geo lookup for client-side personalization.
 * Returns the visitor's 2-letter country (from Vercel's edge geo header)
 * + whether they're in the Pakistan discount region.
 * Used by academy.html to surface the Pakistan special price.
 */
export default function handler(req, res) {
  const country = String(req.headers['x-vercel-ip-country'] || '').toUpperCase()
  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ country, isPK: country === 'PK' })
}
