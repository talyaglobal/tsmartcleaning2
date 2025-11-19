import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'My Insurance Claims',
  description: 'View and track your insurance claims with tSmartCleaning. Manage filed claims, check status updates, and access claim documents.',
  path: '/insurance/claims',
  noindex: true, // User-specific claims page should not be indexed
  nofollow: true,
})

export default function InsuranceClaimsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

