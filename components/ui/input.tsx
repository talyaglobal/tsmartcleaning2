import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-[var(--radius)] border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        // Mobile optimizations
        'min-h-[44px] touch-manipulation',
        // Prevent zoom on iOS for inputs (font-size 16px or larger)
        type === 'text' || type === 'email' || type === 'tel' || type === 'password' || type === 'search' || type === 'url' || !type
          ? 'text-base sm:text-sm' // 16px on mobile to prevent zoom, 14px on larger screens
          : '',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
