'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FileQuestion, RefreshCw, Home, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface FallbackProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  homeLink?: boolean
  className?: string
  icon?: React.ReactNode
}

export function Fallback({
  title = 'Nothing here',
  description = 'There\'s nothing to display at the moment.',
  action,
  homeLink = false,
  className,
  icon,
}: FallbackProps) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <Card className="max-w-md w-full p-6 text-center">
        <div className="flex justify-center mb-4">
          {icon || <FileQuestion className="h-12 w-12 text-muted-foreground" />}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {action && (
            <Button onClick={action.onClick} variant="default">
              {action.label}
            </Button>
          )}
          {homeLink && (
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

interface ErrorFallbackProps {
  error?: string | Error
  onRetry?: () => void
  className?: string
}

export function ErrorFallback({ error, onRetry, className }: ErrorFallbackProps) {
  const errorMessage = error 
    ? (typeof error === 'string' ? error : error.message)
    : 'Something went wrong. Please try again.'

  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <Card className="max-w-md w-full p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Error</h3>
        <p className="text-sm text-muted-foreground mb-6">{errorMessage}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </Card>
    </div>
  )
}

interface LoadingFallbackProps {
  message?: string
  className?: string
}

export function LoadingFallback({ message = 'Loading...', className }: LoadingFallbackProps) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <Card className="max-w-md w-full p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </Card>
    </div>
  )
}

