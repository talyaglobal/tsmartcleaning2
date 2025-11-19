import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'CleanGuard Protection - Comprehensive Insurance for Cleaning Services',
  description: 'Protect your home and belongings with CleanGuard Protection. Comprehensive insurance coverage for annual members with up to $100K property damage protection, theft coverage, and more.',
  path: '/insurance',
  keywords: ['cleaning insurance', 'home insurance', 'property protection', 'CleanGuard', 'cleaning service insurance', 'damage protection'],
})

export default function InsuranceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

