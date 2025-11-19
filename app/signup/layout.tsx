import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Sign Up - Create Your Account',
  description: 'Create your tSmartCleaning account to book professional cleaning services, manage bookings, and access exclusive member benefits.',
  path: '/signup',
  keywords: ['sign up', 'create account', 'register', 'join tSmartCleaning', 'cleaning service signup'],
  noindex: false, // Allow indexing of signup page
})

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

