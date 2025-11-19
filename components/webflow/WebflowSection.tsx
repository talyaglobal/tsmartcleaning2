'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface WebflowSectionProps {
  children: ReactNode
  variant?: 'default' | 'secondary' | 'inverse'
  className?: string
  containerClassName?: string
  containerSize?: 'default' | 'small'
  id?: string
}

/**
 * WebflowSection - Wrapper component that applies Webflow design system section styling
 * 
 * Usage:
 * <WebflowSection variant="secondary">
 *   <h2 className="heading_h2">Title</h2>
 *   <p>Content</p>
 * </WebflowSection>
 */
export function WebflowSection({
  children,
  variant = 'default',
  className,
  containerClassName,
  containerSize = 'default',
  id,
}: WebflowSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'section',
        variant === 'secondary' && 'is-secondary',
        variant === 'inverse' && 'is-inverse',
        className
      )}
    >
      <div
        className={cn(
          'container',
          containerSize === 'small' && 'is-small',
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  )
}

