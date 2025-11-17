import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://tsmartcleaning.com'
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api',
          // Admin/root
          '/admin',
          '/root-admin',
          // Authenticated dashboards
          '/provider',
          '/company',
          '/agency',
          '/partner',
          '/team',
          '/dayibasi',
          '/cleaner',
          '/customer/profile',
          // Misc dynamic/internal
          '/_next',
          '/internal',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}


