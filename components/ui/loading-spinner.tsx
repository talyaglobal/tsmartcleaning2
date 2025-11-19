'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type LoadingSpinnerProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  label?: string
  inline?: boolean
  variant?: 'default' | 'primary' | 'muted'
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
} as const

const variantMap = {
  default: 'text-foreground',
  primary: 'text-primary',
  muted: 'text-muted-foreground',
} as const

export function LoadingSpinner({ 
  className, 
  size = 'md', 
  label, 
  inline = false,
  variant = 'default'
}: LoadingSpinnerProps) {
  return (
    <div className={cn(
      inline ? 'inline-flex items-center gap-2' : 'flex items-center justify-center p-6',
      className
    )}>
      <Loader2 className={cn('animate-spin', sizeMap[size], variantMap[variant])} aria-label={label ?? 'Loading'} />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  )
}

export default LoadingSpinner

