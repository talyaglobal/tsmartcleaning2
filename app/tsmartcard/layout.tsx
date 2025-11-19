import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'tSmartCard - Premium Membership with 10% Off Every Order',
  description: 'Join tSmartCard and save 10% on every cleaning service for an entire year. Just $99 unlocks premium benefits, priority booking, and exclusive perks.',
  path: '/tsmartcard',
  keywords: ['tSmartCard', 'premium membership', 'cleaning discounts', 'membership card', 'savings card', 'cleaning service membership'],
})

export default function TSmartCardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

