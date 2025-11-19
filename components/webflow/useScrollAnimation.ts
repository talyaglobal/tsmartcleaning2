'use client'

import { useEffect, useRef, RefObject } from 'react'

interface UseScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  delay?: number
  once?: boolean
}

/**
 * useScrollAnimation - Hook that adds scroll-triggered animation to an element
 * 
 * Usage:
 * const ref = useScrollAnimation({ threshold: 0.2 })
 * <div ref={ref} className="animate-on-scroll">Content</div>
 */
export function useScrollAnimation({
  threshold = 0.1,
  rootMargin = '0px',
  delay = 0,
  once = true,
}: UseScrollAnimationOptions = {}): RefObject<HTMLElement> {
  const elementRef = useRef<HTMLElement>(null)

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
            const triggerAnimation = () => {
              entry.target.classList.add('is-visible')
              if (once) {
                observer.unobserve(entry.target)
              }
            }

            if (delay > 0) {
              setTimeout(triggerAnimation, delay)
            } else {
              triggerAnimation()
            }
          } else if (!once) {
            // Remove visible class if not intersecting and not once
            entry.target.classList.remove('is-visible')
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
  }, [threshold, rootMargin, delay, once])

  return elementRef
}

