'use client'

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SkeletonLoaderProps {
  count?: number
  className?: string
  variant?: 'text' | 'card' | 'table' | 'list'
}

export function SkeletonLoader({ count = 1, className, variant = 'text' }: SkeletonLoaderProps) {
  if (variant === 'card') {
    return (
      <div className={cn('grid gap-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </Card>
        ))}
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-32" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

interface PageSkeletonProps {
  showHeader?: boolean
  showStats?: boolean
  showContent?: boolean
  statsCount?: number
  contentRows?: number
}

export function PageSkeleton({
  showHeader = true,
  showStats = true,
  showContent = true,
  statsCount = 3,
  contentRows = 5,
}: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
      )}
      {showStats && (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: statsCount }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-8 w-24" />
            </Card>
          ))}
        </div>
      )}
      {showContent && (
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <SkeletonLoader count={contentRows} variant="text" />
        </Card>
      )}
    </div>
  )
}

