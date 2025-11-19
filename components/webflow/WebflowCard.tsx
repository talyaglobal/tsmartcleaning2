'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface WebflowCardProps {
  children: ReactNode
  variant?: 'default' | 'inverse' | 'secondary'
  className?: string
  bodyClassName?: string
  bodySize?: 'default' | 'small'
}

/**
 * WebflowCard - Card component using Webflow design system
 * 
 * Usage:
 * <WebflowCard>
 *   <h3 className="heading_h3">Card Title</h3>
 *   <p>Card content</p>
 * </WebflowCard>
 */
export function WebflowCard({
  children,
  variant = 'default',
  className,
  bodyClassName,
  bodySize = 'default',
}: WebflowCardProps) {
  return (
    <div
      className={cn(
        'card',
        variant === 'inverse' && 'is-inverse',
        variant === 'secondary' && 'on-secondary',
        'animate-hover-lift',
        className
      )}
    >
      <div
        className={cn(
          bodySize === 'small' ? 'card_body_small' : 'card_body',
          bodyClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}

