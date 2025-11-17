'use client'

import Link from 'next/link'
import Image from 'next/image'

type BrandLogoClientProps = {
	className?: string
	href?: string
	height?: number
	width?: number
	priority?: boolean
	src?: string
}

export function BrandLogoClient({
	className,
	href = '/',
	height = 28,
	width = 160,
	priority = false,
	src = '/tsmart_cleaning_orange.png',
}: BrandLogoClientProps) {
	return (
		<Link href={href} className={`flex items-center ${className ?? ''}`}>
			<Image
				src={src}
				alt="Logo"
				width={width}
				height={height}
				priority={priority}
			/>
		</Link>
	)
}


