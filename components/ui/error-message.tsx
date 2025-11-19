'use client'

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AlertCircle, X, RefreshCw } from 'lucide-react'

interface ErrorMessageProps {
  error: string | Error | null
  title?: string
  onDismiss?: () => void
  onRetry?: () => void
  className?: string
  variant?: 'default' | 'destructive' | 'warning'
}

export function ErrorMessage({
  error,
  title,
  onDismiss,
  onRetry,
  className,
  variant = 'destructive',
}: ErrorMessageProps) {
  if (!error) return null

  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <Alert variant={variant} className={cn('relative', className)}>
      <AlertCircle className="h-4 w-4" />
      <div className="flex-1">
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{errorMessage}</AlertDescription>
      </div>
      <div className="flex items-center gap-2">
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-8 w-8 p-0"
            aria-label="Retry"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}

