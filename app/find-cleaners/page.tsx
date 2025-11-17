import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import DirectoryClient from './DirectoryClient'

export const metadata: Metadata = {
  title: 'Find Cleaners Near You — Cleaning Company Directory',
  description:
    'Discover verified cleaning companies near you. Browse ratings, services, and request bookings through tSmartCleaning with privacy protection.',
  alternates: { canonical: '/find-cleaners' },
  openGraph: {
    title: 'Find Cleaners Near You — Cleaning Company Directory',
    description:
      'Discover verified cleaning companies near you. Browse ratings, services, and request bookings through tSmartCleaning.',
    url: 'https://tsmartcleaning.com/find-cleaners',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Cleaners Near You — Cleaning Company Directory',
    description:
      'Discover verified cleaning companies near you. Browse ratings, services, and request bookings through tSmartCleaning.',
  },
}

function jsonLd(): Record<string, unknown>[] {
  const baseUrl = 'https://tsmartcleaning.com'
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'tSmartCleaning',
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${baseUrl}/find-cleaners?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Find Cleaners',
          item: `${baseUrl}/find-cleaners`,
        },
      ],
    },
  ]
}

export default function FindCleanersPage() {
  const ld = jsonLd()
  return (
    <>
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      </head>
      <Suspense fallback={null}>
        <DirectoryClient />
      </Suspense>
    </>
  )
}

