import Link from 'next/link'
import Image from 'next/image'
import { getTenantIdFromHeaders } from '@/lib/tenant-server'
import { loadBranding } from '@/lib/tenant'

type BrandLogoProps = {
  className?: string
  href?: string
  height?: number
  width?: number
  priority?: boolean
}

export async function BrandLogo({
  className,
  href = '/',
  height = 28,
  width = 160,
  priority = false,
}: BrandLogoProps) {
  const tenantId = await getTenantIdFromHeaders()
  const branding = await loadBranding(tenantId)
  return (
    <Link href={href} className={`flex items-center ${className ?? ''}`}>
      <Image
        src={branding.logoUrl}
        alt="Logo"
        width={width}
        height={height}
        priority={priority}
      />
    </Link>
  )
}


