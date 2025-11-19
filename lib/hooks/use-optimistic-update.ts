'use client'

import { useState, useCallback, useRef } from 'react'

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error, rollback: () => void) => void
  rollbackOnError?: boolean
}

export function useOptimisticUpdate<T, P = any>(
  updateFn: (params: P) => Promise<T>,
  options: OptimisticUpdateOptions<T> = {}
) {
  const { onSuccess, onError, rollbackOnError = true } = options
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const previousStateRef = useRef<T | null>(null)

  const update = useCallback(
    async (params: P, optimisticValue: T) => {
      setIsUpdating(true)
      setError(null)
      
      // Store previous state for rollback
      previousStateRef.current = optimisticValue

      try {
        const result = await updateFn(params)
        onSuccess?.(result)
        setIsUpdating(false)
        return result
      } catch (err) {
        const error = err as Error
        setError(error)
        setIsUpdating(false)

        if (rollbackOnError) {
          const rollback = () => {
            // Rollback logic would be handled by the component
            // This is just a placeholder for the rollback function
          }
          onError?.(error, rollback)
        } else {
          onError?.(error, () => {})
        }

        throw error
      }
    },
    [updateFn, onSuccess, onError, rollbackOnError]
  )

  const reset = useCallback(() => {
    setError(null)
    setIsUpdating(false)
    previousStateRef.current = null
  }, [])

  return {
    update,
    reset,
    isUpdating,
    error,
    previousState: previousStateRef.current,
  }
}

