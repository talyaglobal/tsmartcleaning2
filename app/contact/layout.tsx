import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Contact Us - Get in Touch',
  description: 'Have questions about our cleaning services? Contact tSmartCleaning for support, sales inquiries, or to request a quote. We\'re here to help you find the perfect cleaning solution.',
  path: '/contact',
  keywords: ['contact tSmartCleaning', 'cleaning service contact', 'customer support', 'request quote', 'cleaning inquiry'],
})

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

