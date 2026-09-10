import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://adorea-dj.com'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/#brows`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/#lips`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/#makeup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/#nails`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/#contact`,lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]
}
