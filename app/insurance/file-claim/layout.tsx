import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'File a Claim - CleanGuard Protection',
  description: 'File a claim for your CleanGuard Protection insurance. Report property damage, theft, or other covered incidents quickly and easily.',
  path: '/insurance/file-claim',
  keywords: ['file claim', 'insurance claim', 'property damage claim', 'CleanGuard claim', 'cleaning insurance claim'],
})

export default function FileClaimLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

