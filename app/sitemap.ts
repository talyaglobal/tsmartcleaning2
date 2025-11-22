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
    // Core pages
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/find-cleaners', changeFrequency: 'daily', priority: 0.9 },
    { path: '/customer/book', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/provider-signup', changeFrequency: 'weekly', priority: 0.8 },
    
    // Information pages
    { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/marketing', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/for-providers', changeFrequency: 'monthly', priority: 0.7 },
    
    // Services and features
    { path: '/insurance', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/insurance/file-claim', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/tsmartcard', changeFrequency: 'monthly', priority: 0.6 },
    
    // Content and resources
    { path: '/blog', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/careers', changeFrequency: 'weekly', priority: 0.5 },
    { path: '/careers/apply', changeFrequency: 'monthly', priority: 0.4 },
    
    // Special programs
    { path: '/support-immigrant-women', changeFrequency: 'monthly', priority: 0.4 },
    { path: '/ngo/register', changeFrequency: 'monthly', priority: 0.3 },
    
    // Authentication
    { path: '/signup', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/login', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/reset-password', changeFrequency: 'yearly', priority: 0.2 },
    
    // Legal
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  ]

  return publicPaths.map((item) => ({
    url: `${baseUrl}${item.path}`,
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }))
}


