'use client'

import { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface WebflowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  href?: string
  as?: 'button' | 'a'
}

/**
 * WebflowButton - Button component using Webflow design system
 * 
 * Usage:
 * <WebflowButton variant="primary">Click me</WebflowButton>
 * <WebflowButton variant="secondary" href="/page">Link Button</WebflowButton>
 */
export function WebflowButton({
  children,
  variant = 'primary',
  className,
  href,
  as,
  ...props
}: WebflowButtonProps) {
  const baseClasses = 'button'
  const variantClasses = variant === 'secondary' ? 'is-secondary' : ''
  
  const classes = cn(baseClasses, variantClasses, className)

  if (href || as === 'a') {
    return (
      <Link href={href || '#'} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

