import { readFileSync } from 'fs'
import { join } from 'path'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { WebflowScripts } from '@/components/WebflowScripts'
import { AnchorLinkHandler } from '@/components/marketing/AnchorLinkHandler'
import { HomepageAnimations } from '@/components/marketing/HomepageAnimations'
import { JsonLd } from '@/components/seo/JsonLd'
import { generateSEOMetadata, generateBreadcrumbSchema, generateServiceSchema } from '@/lib/seo'

// Dynamically import dev-only components to reduce initial bundle size
// Note: These are only loaded in development mode
const HomepageVerification = process.env.NODE_ENV === 'development' 
  ? dynamic(() => import('@/components/marketing/HomepageVerification').then(mod => ({ default: mod.HomepageVerification })))
  : () => null
const WebflowInteractionsTest = process.env.NODE_ENV === 'development'
  ? dynamic(() => import('@/components/marketing/WebflowInteractionsTest').then(mod => ({ default: mod.WebflowInteractionsTest })))
  : () => null
const ResponsiveDesignTest = process.env.NODE_ENV === 'development'
  ? dynamic(() => import('@/components/marketing/ResponsiveDesignTest').then(mod => ({ default: mod.ResponsiveDesignTest })))
  : () => null
const WebflowDesignVerification = process.env.NODE_ENV === 'development'
  ? dynamic(() => import('@/components/marketing/WebflowDesignVerification').then(mod => ({ default: mod.WebflowDesignVerification })))
  : () => null
const AssetPathFixer = process.env.NODE_ENV === 'development'
  ? dynamic(() => import('@/components/marketing/AssetPathFixer').then(mod => ({ default: mod.AssetPathFixer })))
  : () => null

export const metadata: Metadata = generateSEOMetadata({
  title: 'Professional Cleaning Services Made Simple',
  description: 'Connect with verified cleaning professionals in minutes. Book, manage, and pay for residential, commercial, and specialized cleaning services all in one place.',
  path: '/',
  keywords: ['cleaning services', 'house cleaning', 'commercial cleaning', 'professional cleaners', 'cleaning company', 'residential cleaning', 'office cleaning'],
})

export default function HomePage() {
  // Read the static HTML file
  const htmlPath = join(process.cwd(), 'index.html')
  let htmlContent = ''
  let bodyContent = ''
  
  try {
    htmlContent = readFileSync(htmlPath, 'utf-8')
    // Extract body content (between <body> and </body>)
    const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch) {
      bodyContent = bodyMatch[1]
      // Remove script tags from body content since we're loading them separately via Next.js Script
      // This prevents duplicate script loading
      bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      // Remove navbar from body content since it's already rendered in layout.tsx via WebflowNavbar
      // This prevents duplicate header/navbar
      // Match from <div class="nav"> to just before the next <header> tag
      // Use a more robust approach: match everything from nav div start to header start
      const navStartIndex = bodyContent.indexOf('<div class="nav">')
      const headerStartIndex = bodyContent.indexOf('<header')
      if (navStartIndex !== -1 && headerStartIndex !== -1 && navStartIndex < headerStartIndex) {
        bodyContent = bodyContent.substring(0, navStartIndex) + bodyContent.substring(headerStartIndex)
      }
      
      // Fix asset paths: convert relative paths to absolute paths for Next.js
      // images/ -> /images/
      bodyContent = bodyContent.replace(/(src|href)=["'](images\/[^"']+)["']/gi, (match, attr, path) => {
        if (!path.startsWith('/') && !path.startsWith('http')) {
          return `${attr}="/${path}"`
        }
        return match
      })
      // css/ -> /css/ (though CSS is already loaded in layout, this is for any inline references)
      bodyContent = bodyContent.replace(/(src|href)=["'](css\/[^"']+)["']/gi, (match, attr, path) => {
        if (!path.startsWith('/') && !path.startsWith('http')) {
          return `${attr}="/${path}"`
        }
        return match
      })
      // js/ -> /js/
      bodyContent = bodyContent.replace(/(src|href)=["'](js\/[^"']+)["']/gi, (match, attr, path) => {
        if (!path.startsWith('/') && !path.startsWith('http')) {
          return `${attr}="/${path}"`
        }
        return match
      })
    }
  } catch (error) {
    console.error('Error reading index.html:', error)
    // Fallback to marketing page if HTML file not found
    return <div>Loading...</div>
  }

  const services = [
    {
      name: 'Residential Cleaning',
      description: 'Professional home cleaning services for apartments, houses, and condos. Regular and one-time cleaning available.',
    },
    {
      name: 'Commercial Cleaning',
      description: 'Office and commercial space cleaning services. Keep your workplace clean and professional.',
    },
    {
      name: 'Specialized Cleaning',
      description: 'Deep cleaning, move-in/move-out cleaning, post-construction cleaning, and more specialized services.',
    },
  ]

  return (
    <>
      <JsonLd
        data={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
          ]),
          ...services.map(service => generateServiceSchema(service)),
        ]}
      />
      <AnchorLinkHandler />
      <HomepageAnimations />
      {/* Dev-only components loaded dynamically to reduce initial bundle */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <HomepageVerification />
          <WebflowInteractionsTest />
          <ResponsiveDesignTest />
          <WebflowDesignVerification />
          <AssetPathFixer />
        </>
      )}
      <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
      <WebflowScripts />
    </>
  )
}
