import type { Metadata } from 'next'

const BASE_URL = 'https://tsmartcleaning.com'
const SITE_NAME = 'tSmartCleaning'
const DEFAULT_DESCRIPTION = 'Connect with verified cleaning professionals in minutes. Book, manage, and pay for residential, commercial, and specialized cleaning services all in one place.'

export interface SEOConfig {
  title: string
  description?: string
  path?: string
  image?: string
  type?: 'website' | 'article' | 'profile'
  publishedTime?: string
  modifiedTime?: string
  keywords?: string[]
  noindex?: boolean
  nofollow?: boolean
}

/**
 * Generate comprehensive metadata for a page
 */
export function generateSEOMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    path = '',
    image,
    type = 'website',
    publishedTime,
    modifiedTime,
    keywords,
    noindex = false,
    nofollow = false,
  } = config

  const url = path ? `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}` : BASE_URL
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`
  const ogImage = image || `${BASE_URL}/images/tsmart_cleaning_512.png`

  return {
    title: fullTitle,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
  }
}

/**
 * Generate breadcrumb JSON-LD structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  }
}

/**
 * Generate organization JSON-LD structured data
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/images/tsmart_cleaning_512.png`,
    description: DEFAULT_DESCRIPTION,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-561-975-0455',
      contactType: 'customer service',
      areaServed: 'US',
      availableLanguage: ['English'],
    },
    sameAs: [
      // Add social media links when available
      // 'https://www.facebook.com/tsmartcleaning',
      // 'https://twitter.com/tsmartcleaning',
      // 'https://www.linkedin.com/company/tsmartcleaning',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
  }
}

/**
 * Generate service JSON-LD structured data
 */
export function generateServiceSchema(service: {
  name: string
  description: string
  provider?: {
    name: string
    url?: string
  }
  areaServed?: string
  serviceType?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: service.provider
      ? {
          '@type': 'Organization',
          name: service.provider.name,
          ...(service.provider.url && { url: service.provider.url }),
        }
      : {
          '@type': 'Organization',
          name: SITE_NAME,
          url: BASE_URL,
        },
    areaServed: service.areaServed || 'US',
    serviceType: service.serviceType || 'Cleaning Service',
    category: 'Home Services',
  }
}

/**
 * Generate review/rating JSON-LD structured data
 */
export function generateReviewSchema(review: {
  rating: number
  reviewCount: number
  bestRating?: number
  worstRating?: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    ratingValue: String(review.rating),
    reviewCount: String(review.reviewCount),
    bestRating: String(review.bestRating || 5),
    worstRating: String(review.worstRating || 1),
  }
}

/**
 * Generate article JSON-LD structured data
 */
export function generateArticleSchema(article: {
  title: string
  description: string
  image?: string
  publishedTime: string
  modifiedTime?: string
  author?: {
    name: string
    url?: string
  }
  publisher?: {
    name: string
    logo?: string
  }
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image || `${BASE_URL}/images/tsmart_cleaning_512.png`,
    datePublished: article.publishedTime,
    ...(article.modifiedTime && { dateModified: article.modifiedTime }),
    author: article.author
      ? {
          '@type': 'Person',
          name: article.author.name,
          ...(article.author.url && { url: article.author.url }),
        }
      : {
          '@type': 'Organization',
          name: SITE_NAME,
        },
    publisher: article.publisher
      ? {
          '@type': 'Organization',
          name: article.publisher.name,
          logo: {
            '@type': 'ImageObject',
            url: article.publisher.logo || `${BASE_URL}/images/tsmart_cleaning_512.png`,
          },
        }
      : {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: {
            '@type': 'ImageObject',
            url: `${BASE_URL}/images/tsmart_cleaning_512.png`,
          },
        },
  }
}

/**
 * Generate local business JSON-LD structured data
 */
export function generateLocalBusinessSchema(business: {
  name: string
  description?: string
  image?: string
  url: string
  address?: {
    streetAddress?: string
    addressLocality?: string
    addressRegion?: string
    postalCode?: string
    addressCountry?: string
  }
  telephone?: string
  priceRange?: string
  rating?: {
    ratingValue: number
    reviewCount: number
  }
  openingHours?: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    ...(business.description && { description: business.description }),
    image: business.image || `${BASE_URL}/images/tsmart_cleaning_512.png`,
    url: business.url,
    ...(business.address && {
      address: {
        '@type': 'PostalAddress',
        ...(business.address.streetAddress && { streetAddress: business.address.streetAddress }),
        ...(business.address.addressLocality && { addressLocality: business.address.addressLocality }),
        ...(business.address.addressRegion && { addressRegion: business.address.addressRegion }),
        ...(business.address.postalCode && { postalCode: business.address.postalCode }),
        addressCountry: business.address.addressCountry || 'US',
      },
    }),
    ...(business.telephone && { telephone: business.telephone }),
    ...(business.priceRange && { priceRange: business.priceRange }),
    ...(business.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: String(business.rating.ratingValue),
        reviewCount: String(business.rating.reviewCount),
      },
    }),
    ...(business.openingHours && { openingHours: business.openingHours }),
  }
}

/**
 * Generate website JSON-LD structured data with search action
 */
export function generateWebsiteSchema(searchUrl?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    ...(searchUrl && {
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: searchUrl.includes('{search_term_string}')
            ? searchUrl
            : `${searchUrl}?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    }),
  }
}

