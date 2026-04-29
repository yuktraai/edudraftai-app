export default function sitemap() {
  const base = 'https://edudraftai.com'
  const now  = new Date()

  return [
    // ── Public marketing pages ────────────────────────────────────────────────
    { url: base,                        lastModified: now, changeFrequency: 'weekly',   priority: 1.0 },
    { url: `${base}/contact`,           lastModified: now, changeFrequency: 'monthly',  priority: 0.7 },
    { url: `${base}/webinar`,           lastModified: now, changeFrequency: 'weekly',   priority: 0.6 },

    // ── Auth ──────────────────────────────────────────────────────────────────
    { url: `${base}/login`,             lastModified: now, changeFrequency: 'yearly',   priority: 0.5 },

    // ── Legal ─────────────────────────────────────────────────────────────────
    { url: `${base}/privacy-policy`,    lastModified: now, changeFrequency: 'yearly',   priority: 0.3 },
    { url: `${base}/terms`,             lastModified: now, changeFrequency: 'yearly',   priority: 0.3 },
    { url: `${base}/refund-policy`,     lastModified: now, changeFrequency: 'yearly',   priority: 0.2 },
  ]
}
