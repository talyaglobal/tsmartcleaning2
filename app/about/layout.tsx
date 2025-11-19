import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'About Us - Making Professional Cleaning Accessible',
  description: 'Learn about tSmartCleaning\'s mission to revolutionize the cleaning services industry. Founded in 2020, we connect trusted professionals with customers across the USA.',
  path: '/about',
  keywords: ['about tSmartCleaning', 'cleaning company mission', 'professional cleaning services', 'cleaning industry'],
})

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

