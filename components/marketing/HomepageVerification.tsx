'use client'

import { useEffect, useState } from 'react'

/**
 * Component to verify homepage functionality
 * Logs verification results to console for debugging
 */
export function HomepageVerification() {
  const [verificationResults, setVerificationResults] = useState<{
    webflowScripts: boolean
    anchorLinks: boolean
    navigationLinks: boolean
    images: boolean
    css: boolean
  } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const verify = () => {
      const results = {
        webflowScripts: false,
        anchorLinks: false,
        navigationLinks: false,
        images: false,
        css: false,
      }

      // Verify Webflow scripts
      const hasJQuery = typeof (window as any).jQuery !== 'undefined'
      const hasWebflow = typeof (window as any).Webflow !== 'undefined'
      results.webflowScripts = hasJQuery && hasWebflow

      // Verify anchor links exist
      const anchorIds = ['services', 'pricing', 'faq', 'contact', 'enterprise']
      const foundAnchors = anchorIds.filter(id => document.getElementById(id) !== null)
      results.anchorLinks = foundAnchors.length > 0

      // Verify navigation links
      const navLinks = [
        { text: 'Find Cleaners', href: '/find-cleaners' },
        { text: 'Book now', href: '/customer/book' },
        { text: 'tSmartCard', href: '/tsmartcard' },
        { text: 'Insurance', href: '/insurance' },
      ]
      const foundNavLinks = navLinks.filter(({ href }) => {
        const link = document.querySelector(`a[href="${href}"]`)
        return link !== null
      })
      results.navigationLinks = foundNavLinks.length >= 2

      // Verify images load
      const images = document.querySelectorAll('img')
      let loadedImages = 0
      images.forEach(img => {
        if (img.complete && img.naturalHeight !== 0) {
          loadedImages++
        }
      })
      results.images = images.length > 0 && loadedImages > 0

      // Verify CSS files
      const cssLinks = document.querySelectorAll('link[rel="stylesheet"]')
      const requiredCss = ['normalize.css', 'webflow.css', 'tsmartcleaning-ff34e6.webflow.css']
      const foundCss = requiredCss.filter(css => {
        return Array.from(cssLinks).some(link => 
          (link as HTMLLinkElement).href.includes(css)
        )
      })
      results.css = foundCss.length === requiredCss.length

      setVerificationResults(results)

      // Log results
      console.group('🏠 Homepage Verification Results')
      console.log('✅ Webflow Scripts:', results.webflowScripts ? 'Loaded' : 'Missing')
      console.log('✅ Anchor Links:', results.anchorLinks ? 'Found' : 'Missing')
      console.log('✅ Navigation Links:', results.navigationLinks ? 'Working' : 'Issues')
      console.log('✅ Images:', results.images ? 'Loading' : 'Issues')
      console.log('✅ CSS Files:', results.css ? 'Loaded' : 'Missing')
      console.groupEnd()
    }

    // Run verification after a delay to ensure everything is loaded
    const timeout = setTimeout(verify, 1000)

    return () => clearTimeout(timeout)
  }, [])

  // Don't render anything, just verify
  return null
}

