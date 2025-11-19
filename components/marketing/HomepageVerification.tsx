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
    dropdowns: boolean
    tabs: boolean
    animations: boolean
    mobileMenu: boolean
  } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const verify = async () => {
      const results = {
        webflowScripts: false,
        anchorLinks: false,
        navigationLinks: false,
        images: false,
        css: false,
        dropdowns: false,
        tabs: false,
        animations: false,
        mobileMenu: false,
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

      // Verify images load correctly
      const images = document.querySelectorAll('img')
      let loadedImages = 0
      let failedImages = 0
      const imagePromises: Promise<void>[] = []
      
      images.forEach(img => {
        const imgElement = img as HTMLImageElement
        if (imgElement.complete) {
          if (imgElement.naturalHeight !== 0 && imgElement.naturalWidth !== 0) {
            loadedImages++
          } else {
            failedImages++
          }
        } else {
          // Wait for image to load
          const promise = new Promise<void>((resolve) => {
            imgElement.onload = () => {
              if (imgElement.naturalHeight !== 0 && imgElement.naturalWidth !== 0) {
                loadedImages++
              } else {
                failedImages++
              }
              resolve()
            }
            imgElement.onerror = () => {
              failedImages++
              resolve()
            }
            // Timeout after 5 seconds
            setTimeout(() => {
              if (!imgElement.complete) {
                failedImages++
                resolve()
              }
            }, 5000)
          })
          imagePromises.push(promise)
        }
      })
      
      // Wait for all images to load or timeout
      await Promise.all(imagePromises)
      results.images = images.length > 0 && loadedImages > 0 && failedImages === 0

      // Verify CSS files load correctly (check for 404s)
      const cssLinks = document.querySelectorAll('link[rel="stylesheet"]')
      const requiredCss = ['normalize.css', 'webflow.css', 'tsmartcleaning-ff34e6.webflow.css']
      const cssPromises: Promise<boolean>[] = []
      
      requiredCss.forEach(cssName => {
        const cssLink = Array.from(cssLinks).find(link => 
          (link as HTMLLinkElement).href.includes(cssName)
        ) as HTMLLinkElement | undefined
        
        if (cssLink) {
          const promise = fetch(cssLink.href, { method: 'HEAD' })
            .then(response => response.ok)
            .catch(() => false)
          cssPromises.push(promise)
        } else {
          cssPromises.push(Promise.resolve(false))
        }
      })
      
      const cssResults = await Promise.all(cssPromises)
      results.css = cssResults.every(loaded => loaded) && cssResults.length === requiredCss.length

      // Verify dropdowns
      const dropdowns = document.querySelectorAll('.w-dropdown')
      results.dropdowns = dropdowns.length > 0 && 
        Array.from(dropdowns).every(d => 
          d.querySelector('.w-dropdown-toggle') && d.querySelector('.w-dropdown-list')
        )

      // Verify tabs
      const tabs = document.querySelectorAll('.w-tabs')
      results.tabs = tabs.length > 0 &&
        Array.from(tabs).every(tab =>
          tab.querySelectorAll('.w-tab-link').length > 0 &&
          tab.querySelectorAll('.w-tab-pane').length > 0
        )

      // Verify animations
      const animatedElements = document.querySelectorAll('[data-animation], [data-ix], [data-ix2]')
      results.animations = animatedElements.length > 0

      // Verify mobile menu
      const navContainer = document.querySelector('.w-nav[data-collapse]')
      const navButton = document.querySelector('.w-nav-button')
      const navMenu = document.querySelector('.w-nav-menu')
      results.mobileMenu = !!(navContainer && navButton && navMenu)

      setVerificationResults(results)

      // Log results
      console.group('🏠 Homepage Verification Results')
      console.log('✅ Webflow Scripts:', results.webflowScripts ? 'Loaded' : 'Missing')
      console.log('✅ Anchor Links:', results.anchorLinks ? 'Found' : 'Missing')
      console.log('✅ Navigation Links:', results.navigationLinks ? 'Working' : 'Issues')
      console.log('✅ Images:', results.images ? `Loaded (${loadedImages}/${images.length})` : `Issues (${failedImages} failed)`)
      console.log('✅ CSS Files:', results.css ? 'Loaded' : 'Missing or Failed')
      console.log('✅ Dropdowns:', results.dropdowns ? 'Found' : 'Missing')
      console.log('✅ Tabs:', results.tabs ? 'Found' : 'Missing')
      console.log('✅ Animations:', results.animations ? 'Found' : 'Missing')
      console.log('✅ Mobile Menu:', results.mobileMenu ? 'Configured' : 'Missing')
      console.groupEnd()
    }

    // Run verification after a delay to ensure everything is loaded
    const timeout = setTimeout(() => {
      verify().catch(err => {
        console.error('Verification error:', err)
      })
    }, 1000)

    return () => clearTimeout(timeout)
  }, [])

  // Don't render anything, just verify
  return null
}

