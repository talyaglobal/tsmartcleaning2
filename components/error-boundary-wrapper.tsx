'use client'

import { ErrorBoundary } from '@/components/ui/error-boundary'
import { ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'

interface ErrorBoundaryWrapperProps {
  children: ReactNode
}

export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to Sentry in production
        if (process.env.NODE_ENV === 'production') {
          Sentry.captureException(error, {
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
            },
          })
        } else {
          console.error('Error caught by boundary:', error, errorInfo)
        }
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

