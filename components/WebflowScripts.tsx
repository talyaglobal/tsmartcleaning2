'use client'

import Script from 'next/script'

export function WebflowScripts() {
  return (
    <>
      {/* jQuery must load before webflow.js - Next.js Script maintains order with same strategy */}
      <Script
        id="jquery"
        src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=691a215cf3c529f153dd4686"
        integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0="
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('jQuery loaded successfully')
        }}
        onError={(e) => {
          console.error('Failed to load jQuery:', e)
        }}
      />
      <Script
        id="webflow"
        src="/js/webflow.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Webflow.js loaded successfully')
          // Verify jQuery is available
          if (typeof window !== 'undefined' && (window as any).jQuery) {
            console.log('jQuery is available for Webflow.js')
          } else {
            console.warn('jQuery may not be loaded before Webflow.js')
          }
        }}
        onError={(e) => {
          console.error('Failed to load webflow.js:', e)
        }}
      />
    </>
  )
}

