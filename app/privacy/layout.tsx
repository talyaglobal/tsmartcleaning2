import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Privacy Policy',
  description: 'Read tSmartCleaning\'s Privacy Policy. Learn how we collect, use, and protect your personal information. Last updated January 2025.',
  path: '/privacy',
  keywords: ['privacy policy', 'data protection', 'privacy', 'data security', 'user privacy', 'tSmartCleaning privacy'],
})

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

