export default function sitemap() {
  const base = 'https://edudraftai.com'

  return [
    { url: base,              lastModified: new Date(), changeFrequency: 'monthly',  priority: 1 },
    { url: `${base}/login`,   lastModified: new Date(), changeFrequency: 'yearly',   priority: 0.5 },
  ]
}
