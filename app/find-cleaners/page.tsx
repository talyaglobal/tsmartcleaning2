import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import DirectoryClient from './DirectoryClient'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateSEOMetadata, generateBreadcrumbSchema, generateWebsiteSchema } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Find Cleaners Near You — Cleaning Company Directory',
  description:
    'Discover verified cleaning companies near you. Browse ratings, services, and request bookings through tSmartCleaning with privacy protection.',
  path: '/find-cleaners',
  keywords: ['find cleaners', 'cleaning companies', 'local cleaners', 'professional cleaning services', 'cleaning directory'],
})

export default function FindCleanersPage() {
  return (
    <>
      <JsonLd
        data={[
          generateWebsiteSchema('/find-cleaners?q={search_term_string}'),
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'Find Cleaners', url: '/find-cleaners' },
          ]),
        ]}
      />
      <Suspense fallback={null}>
        <DirectoryClient />
      </Suspense>
    </>
  )
}

