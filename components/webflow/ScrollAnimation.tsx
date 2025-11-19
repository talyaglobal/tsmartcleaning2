'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ScrollAnimationProps {
  children: ReactNode
  className?: string
  delay?: number
  threshold?: number
  rootMargin?: string
}

/**
 * ScrollAnimation - Component that triggers animations when element enters viewport
 * 
 * Usage:
 * <ScrollAnimation>
 *   <div>Content that animates on scroll</div>
 * </ScrollAnimation>
 * 
 * <ScrollAnimation delay={200} threshold={0.1}>
 *   <div>Content with custom delay and threshold</div>
 * </ScrollAnimation>
 */
export function ScrollAnimation({
  children,
  className,
  delay = 0,
  threshold = 0.1,
  rootMargin = '0px',
}: ScrollAnimationProps) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      // Immediately show content without animation
      element.classList.add('is-visible')
      return
    }

    // Create Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add delay if specified
            setTimeout(() => {
              entry.target.classList.add('is-visible')
            }, delay)
            // Unobserve after animation triggers
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [delay, threshold, rootMargin])

  return (
    <div
      ref={elementRef}
      className={cn('animate-on-scroll', className)}
    >
      {children}
    </div>
  )
}

