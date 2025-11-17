import type { Metadata } from 'next'

type PageProps = {
  params: { slug: string }
}

export function generateMetadata({ params }: PageProps): Metadata {
  const name = params.slug.replace(/-/g, ' ')
  const title = `${name} — Cleaning Company`
  const url = `https://tsmartcleaning.com/cleaners/${params.slug}`
  return {
    title,
    description:
      'View services, ratings, and request a booking. Contact details are protected until the booking is accepted.',
    alternates: { canonical: url },
    openGraph: {
      title,
      description:
        'View services, ratings, and request a booking. Contact details are protected until the booking is accepted.',
      url,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description:
        'View services, ratings, and request a booking. Contact details are protected until the booking is accepted.',
    },
  }
}

function jsonLdLocalBusiness(slug: string): Record<string, unknown> {
  const name = slug.replace(/-/g, ' ')
  const url = `https://tsmartcleaning.com/cleaners/${slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': url,
    name,
    url,
    image: 'https://tsmartcleaning.com/placeholder-logo.png',
    priceRange: '$$',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '120',
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'City',
      addressRegion: 'State',
      postalCode: '00000',
      addressCountry: 'US',
    },
    areaServed: {
      '@type': 'City',
      name: 'Local Area',
    },
    // Contact is intentionally omitted for privacy until booking is accepted
  }
}

export default function CleanerProfilePage({ params }: PageProps) {
  const ld = jsonLdLocalBusiness(params.slug)
  const displayName = params.slug.replace(/-/g, ' ')
  return (
    <main className="min-h-screen">
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      </head>
      <section className="py-16 md:py-24 bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            {displayName}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Company profile coming soon. Ratings, services, availability, and request booking will
            appear here.
          </p>
        </div>
      </section>
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="rounded-lg border p-6 text-sm text-muted-foreground">
            This is a placeholder profile generated from the URL slug: “{params.slug}”.
          </div>
        </div>
      </section>
    </main>
  )
}


