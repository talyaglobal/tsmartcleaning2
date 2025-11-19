import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Verify Email',
  description: 'Verify your email address for your tSmartCleaning account. Enter your email to receive a verification link.',
  path: '/verify-email',
  noindex: true, // Email verification pages should not be indexed
})

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

