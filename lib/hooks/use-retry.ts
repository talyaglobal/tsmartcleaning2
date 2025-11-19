'use client'

import { useState, useCallback } from 'react'

interface UseRetryOptions {
  maxRetries?: number
  retryDelay?: number
  onRetry?: (attempt: number) => void
  onMaxRetriesReached?: () => void
}

interface RetryState {
  attempt: number
  isRetrying: boolean
  hasReachedMax: boolean
}

export function useRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: UseRetryOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    onMaxRetriesReached,
  } = options

  const [state, setState] = useState<RetryState>({
    attempt: 0,
    isRetrying: false,
    hasReachedMax: false,
  })

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      let lastError: Error | null = null
      let attempt = 0

      while (attempt <= maxRetries) {
        try {
          setState({ attempt, isRetrying: attempt > 0, hasReachedMax: false })
          
          if (attempt > 0) {
            onRetry?.(attempt)
            await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt))
          }

          const result = await fn(...args)
          setState({ attempt: 0, isRetrying: false, hasReachedMax: false })
          return result
        } catch (error) {
          lastError = error as Error
          attempt++

          if (attempt > maxRetries) {
            setState({
              attempt: maxRetries,
              isRetrying: false,
              hasReachedMax: true,
            })
            onMaxRetriesReached?.()
            throw lastError
          }
        }
      }

      throw lastError || new Error('Retry failed')
    },
    [fn, maxRetries, retryDelay, onRetry, onMaxRetriesReached]
  )

  const reset = useCallback(() => {
    setState({ attempt: 0, isRetrying: false, hasReachedMax: false })
  }, [])

  return {
    execute,
    reset,
    attempt: state.attempt,
    isRetrying: state.isRetrying,
    hasReachedMax: state.hasReachedMax,
  }
}

