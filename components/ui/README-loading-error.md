# Loading States & Error Handling Components

This directory contains reusable components and utilities for handling loading states and errors throughout the application.

## Components

### ErrorBoundary (`error-boundary.tsx`)

React Error Boundary component that catches JavaScript errors anywhere in the child component tree.

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/ui/error-boundary'

<ErrorBoundary
  onError={(error, errorInfo) => {
    // Log to error reporting service
    console.error('Error:', error, errorInfo)
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### LoadingSpinner (`loading-spinner.tsx`)

A customizable loading spinner component.

**Usage:**
```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner'

<LoadingSpinner size="md" label="Loading..." />
<LoadingSpinner size="sm" inline />
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `label`: Optional label text
- `inline`: Display inline instead of centered block
- `variant`: 'default' | 'primary' | 'muted'

### ErrorMessage (`error-message.tsx`)

Displays error messages with optional retry and dismiss actions.

**Usage:**
```tsx
import { ErrorMessage } from '@/components/ui/error-message'

<ErrorMessage
  error={error}
  title="Failed to load data"
  onRetry={() => refetch()}
  onDismiss={() => setError(null)}
/>
```

**Props:**
- `error`: string | Error | null
- `title`: Optional title
- `onRetry`: Optional retry callback
- `onDismiss`: Optional dismiss callback
- `variant`: 'default' | 'destructive' | 'warning'

### Fallback Components (`fallback.tsx`)

Fallback UI components for empty states, errors, and loading.

**Usage:**
```tsx
import { Fallback, ErrorFallback, LoadingFallback } from '@/components/ui/fallback'

// Empty state
<Fallback
  title="Nothing here"
  description="No items to display"
  action={{ label: "Create New", onClick: handleCreate }}
/>

// Error state
<ErrorFallback
  error={error}
  onRetry={() => refetch()}
/>

// Loading state
<LoadingFallback message="Loading data..." />
```

### SkeletonLoader (`skeleton-loader.tsx`)

Skeleton loading placeholders for better perceived performance.

**Usage:**
```tsx
import { SkeletonLoader, PageSkeleton } from '@/components/ui/skeleton-loader'

// Basic skeleton
<SkeletonLoader count={5} variant="text" />

// Card skeleton
<SkeletonLoader count={3} variant="card" />

// Table skeleton
<SkeletonLoader count={5} variant="table" />

// List skeleton
<SkeletonLoader count={4} variant="list" />

// Full page skeleton
<PageSkeleton
  showHeader
  showStats
  showContent
  statsCount={4}
  contentRows={6}
/>
```

**Variants:**
- `text`: Simple text lines
- `card`: Card layout with title and content
- `table`: Table row layout
- `list`: List item with avatar and text

## Hooks

### useRetry (`lib/hooks/use-retry.ts`)

Hook for retrying failed async operations with exponential backoff.

**Usage:**
```tsx
import { useRetry } from '@/lib/hooks/use-retry'

const fetchData = async (id: string) => {
  const res = await fetch(`/api/data/${id}`)
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

const { execute, reset, attempt, isRetrying, hasReachedMax } = useRetry(fetchData, {
  maxRetries: 3,
  retryDelay: 1000,
  onRetry: (attempt) => console.log(`Retry attempt ${attempt}`),
  onMaxRetriesReached: () => console.log('Max retries reached')
})

// Use it
try {
  const data = await execute('123')
} catch (error) {
  // Handle error after all retries failed
}
```

### useOptimisticUpdate (`lib/hooks/use-optimistic-update.ts`)

Hook for optimistic UI updates with rollback on error.

**Usage:**
```tsx
import { useOptimisticUpdate } from '@/lib/hooks/use-optimistic-update'

const updateUser = async (params: { id: string, name: string }) => {
  const res = await fetch(`/api/users/${params.id}`, {
    method: 'PATCH',
    body: JSON.stringify(params)
  })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

const { update, reset, isUpdating, error } = useOptimisticUpdate(updateUser, {
  onSuccess: (data) => {
    // Update local state with server response
    setUser(data)
  },
  onError: (error, rollback) => {
    // Rollback optimistic update
    rollback()
  }
})

// Use it
const handleUpdate = async () => {
  // Optimistically update UI
  setUser({ ...user, name: newName })
  
  try {
    await update({ id: user.id, name: newName }, { ...user, name: newName })
  } catch (error) {
    // Error handling with rollback
  }
}
```

## Best Practices

1. **Use ErrorBoundary at the root level** to catch unexpected errors
2. **Show loading states** for async operations longer than 200ms
3. **Use skeleton loaders** instead of spinners for better UX
4. **Implement retry logic** for network requests
5. **Provide clear error messages** with actionable retry options
6. **Use optimistic updates** for better perceived performance
7. **Handle errors gracefully** with fallback UI

## Example: Complete Page with Loading & Error Handling

```tsx
'use client'

import { useState, useEffect } from 'react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { SkeletonLoader } from '@/components/ui/skeleton-loader'
import { useRetry } from '@/lib/hooks/use-retry'

function MyPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    const res = await fetch('/api/data')
    if (!res.ok) throw new Error('Failed to load')
    return res.json()
  }

  const { execute } = useRetry(fetchData, { maxRetries: 3 })

  useEffect(() => {
    execute()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <SkeletonLoader count={5} variant="card" />
  }

  if (error) {
    return (
      <ErrorMessage
        error={error}
        onRetry={() => {
          setError(null)
          setLoading(true)
          execute().then(setData).catch(setError).finally(() => setLoading(false))
        }}
      />
    )
  }

  return <div>{/* Your content */}</div>
}

export default function MyPageWithBoundary() {
  return (
    <ErrorBoundary>
      <MyPage />
    </ErrorBoundary>
  )
}
```

