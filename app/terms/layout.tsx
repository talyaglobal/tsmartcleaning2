import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Terms of Service',
  description: 'Read tSmartCleaning\'s Terms of Service. Understand our user agreements, booking terms, payment policies, and provider obligations. Last updated January 2025.',
  path: '/terms',
  keywords: ['terms of service', 'user agreement', 'terms and conditions', 'legal', 'tSmartCleaning terms'],
})

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

