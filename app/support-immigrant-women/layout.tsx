import type { Metadata } from 'next'
import { generateSEOMetadata } from '@/lib/seo'

export const metadata: Metadata = generateSEOMetadata({
  title: 'Support Immigrant Women - Empowering Through Work',
  description: 'Join tSmartCleaning\'s program supporting immigrant women through dignified employment opportunities. Access job placement, training, and community support for cleaning professionals.',
  path: '/support-immigrant-women',
  keywords: ['immigrant women support', 'cleaning jobs for immigrants', 'employment opportunities', 'immigrant support program', 'cleaning career training'],
})

export default function SupportImmigrantWomenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

