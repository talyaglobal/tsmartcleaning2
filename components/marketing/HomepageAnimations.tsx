'use client'

import { useEffect } from 'react'

/**
 * HomepageAnimations - Adds animations to static HTML homepage
 * Since the homepage uses dangerouslySetInnerHTML, we need to add
 * animations via client-side JavaScript after the HTML is rendered.
 */
export function HomepageAnimations() {
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      return
    }

    // Add hero fade-in animation to header section
    const header = document.querySelector('header.section')
    if (header) {
      const headerContent = header.querySelector('.header, .container')
      if (headerContent) {
        headerContent.classList.add('animate-hero-fade-in')
      }
    }

    // Add scroll animations to sections
    const sections = document.querySelectorAll('section.section:not(header)')
    sections.forEach((section, index) => {
      // Skip if already has animation class
      if (section.classList.contains('animate-on-scroll')) {
        return
      }

      // Add scroll animation class
      section.classList.add('animate-on-scroll')

      // Create Intersection Observer for scroll animations
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              observer.unobserve(entry.target)
            }
          })
        },
        {
          threshold: 0.1,
          rootMargin: '0px',
        }
      )

      observer.observe(section)
    })

    // Add hover animations to buttons
    const buttons = document.querySelectorAll('.button, .w-button, a.button')
    buttons.forEach((button) => {
      if (!button.classList.contains('animate-hover-lift')) {
        button.classList.add('animate-hover-lift')
      }
    })

    // Add hover animations to cards
    const cards = document.querySelectorAll('.card')
    cards.forEach((card) => {
      if (!card.classList.contains('animate-hover-lift')) {
        card.classList.add('animate-hover-lift')
      }
    })
  }, [])

  return null
}

