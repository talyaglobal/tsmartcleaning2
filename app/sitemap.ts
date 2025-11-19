import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tsmartcleaning.com'
  const now = new Date().toISOString()
  // Primary public routes only. Auth-only and dashboard routes are intentionally excluded.
  const publicPaths: Array<{
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    priority: number
  }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/find-cleaners', changeFrequency: 'daily', priority: 0.9 },
    { path: '/marketing', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/for-providers', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/about', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/careers', changeFrequency: 'monthly', priority: 0.3 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/insurance', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/insurance/file-claim', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/insurance/claims', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/support-immigrant-women', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/tsmartcard', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/signup', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/login', changeFrequency: 'monthly', priority: 0.4 },
  ]

  return publicPaths.map((item) => ({
    url: `${baseUrl}${item.path}`,
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }))
}


