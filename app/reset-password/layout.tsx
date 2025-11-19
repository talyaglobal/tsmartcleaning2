import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Reset Password',
  description: 'Reset your tSmartCleaning account password. Enter your email to receive a password reset link.',
  path: '/reset-password',
  noindex: true, // Password reset pages should not be indexed
})

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

