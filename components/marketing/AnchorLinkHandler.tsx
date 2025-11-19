'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Client component to handle anchor link navigation and smooth scrolling
 * This ensures anchor links work properly with Next.js routing
 */
export function AnchorLinkHandler() {
  const pathname = usePathname()

  useEffect(() => {
    // Handle anchor links on the homepage
    if (pathname === '/') {
      // Handle hash from URL (e.g., /#pricing)
      const hash = window.location.hash
      if (hash) {
        // Small delay to ensure page is fully rendered
        setTimeout(() => {
          const element = document.querySelector(hash)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      }

      // Add click handlers to all anchor links
      const handleAnchorClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        const link = target.closest('a[href^="#"]') as HTMLAnchorElement
        
        if (link && link.hash) {
          e.preventDefault()
          const hash = link.hash
          const element = document.querySelector(hash)
          
          if (element) {
            // Calculate offset for fixed navbar
            const navbar = document.querySelector('.nav_container')
            const navbarHeight = navbar ? navbar.getBoundingClientRect().height : 0
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
            const offsetPosition = elementPosition - navbarHeight - 20 // 20px extra padding

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            })

            // Update URL without triggering scroll
            window.history.pushState(null, '', hash)
          }
        }
      }

      // Attach event listeners to all anchor links
      document.addEventListener('click', handleAnchorClick)

      return () => {
        document.removeEventListener('click', handleAnchorClick)
      }
    }
  }, [pathname])

  return null
}

