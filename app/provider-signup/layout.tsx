import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Become a Provider',
  description: 'Join our network of professional cleaning service providers. Grow your cleaning business with flexible scheduling, guaranteed payments, and support from tSmartCleaning.',
  path: '/provider-signup',
  keywords: ['become a cleaner', 'provider signup', 'cleaning job application', 'join cleaning platform', 'cleaning professional signup'],
})

export default function ProviderSignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

