import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Operations Dashboard',
  description: 'Live operations dashboard for managing cleaning services, bookings, and team coordination.',
  path: '/operations',
  noindex: true, // Operations dashboard should not be indexed
  nofollow: true,
})

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

