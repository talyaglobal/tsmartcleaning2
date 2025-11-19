import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Log In - Access Your Account',
  description: 'Log in to your tSmartCleaning account to manage bookings, view your cleaning history, and access your account settings.',
  path: '/login',
  keywords: ['log in', 'login', 'sign in', 'account access', 'tSmartCleaning login'],
  noindex: false, // Allow indexing of login page
})

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

