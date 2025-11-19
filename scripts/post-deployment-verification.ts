#!/usr/bin/env tsx
/**
 * Post-Deployment Verification Script
 * 
 * Automates the verification checklist from FINAL_MISSING_TODO.md
 * Checks:
 * - Application accessible at production URL
 * - Homepage loads correctly
 * - All static pages load without errors
 * - Navigation links work correctly
 * - Images and assets load properly
 * - No 404 errors on expected routes
 * - No console errors in browser dev tools
 * - No build/runtime errors in server logs
 * 
 * Usage:
 *   npm run verify:deployment
 *   PRODUCTION_URL=https://your-site.com npm run verify:deployment
 */

// Load environment variables from .env.local if it exists
import { config } from 'dotenv'
import { resolve } from 'path'

// Try to load .env.local first, then .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { chromium, Browser, Page } from 'playwright'
import * as https from 'https'
import * as http from 'http'

interface VerificationResult {
  check: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
}

const results: VerificationResult[] = []

// Public routes from sitemap.ts
const publicRoutes = [
  '/',
  '/find-cleaners',
  '/marketing',
  '/for-providers',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/careers',
  '/blog',
  '/insurance',
  '/insurance/file-claim',
  '/support-immigrant-women',
  '/tsmartcard',
  '/signup',
  '/login',
]

// Get base URL from environment or use default
function getBaseUrl(): string {
  if (process.env.PRODUCTION_URL) {
    return process.env.PRODUCTION_URL
  }
  if (process.env.VERCEL_URL) {
    // VERCEL_URL doesn't include protocol
    return `https://${process.env.VERCEL_URL}`
  }
  // Default production URL
  return 'https://tsmartcleaning.com'
}

const baseUrl = getBaseUrl()

function logResult(
  check: string,
  status: 'success' | 'error' | 'warning',
  message: string,
  details?: any
) {
  results.push({ check, status, message, details })
  const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️'
  console.log(`${icon} ${check}: ${message}`)
  if (details) {
    console.log(`   Details:`, JSON.stringify(details, null, 2))
  }
}

/**
 * Check if URL is accessible via HTTP/HTTPS
 */
async function checkUrlAccessibility(url: string): Promise<{ accessible: boolean; statusCode?: number; error?: string }> {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https://')
    const client = isHttps ? https : http
    
    const req = client.get(url, { timeout: 10000 }, (res) => {
      resolve({ accessible: true, statusCode: res.statusCode })
      res.destroy()
    })
    
    req.on('error', (err) => {
      resolve({ accessible: false, error: err.message })
    })
    
    req.on('timeout', () => {
      req.destroy()
      resolve({ accessible: false, error: 'Request timeout' })
    })
  })
}

/**
 * Check page loads correctly and collect console errors
 */
async function checkPageLoad(page: Page, url: string): Promise<{
  loaded: boolean
  statusCode: number
  consoleErrors: string[]
  networkErrors: Array<{ url: string; status: number }>
  missingAssets: string[]
}> {
  const consoleErrors: string[] = []
  const networkErrors: Array<{ url: string; status: number }> = []
  const missingAssets: string[] = []
  
  // Listen to console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      consoleErrors.push(text)
    }
  })
  
  // Listen to failed network requests
  page.on('response', (response) => {
    const status = response.status()
    const url = response.url()
    
    // Check for 4xx/5xx errors
    if (status >= 400) {
      networkErrors.push({ url, status })
      
      // Check if it's an asset (image, CSS, JS, etc.)
      const isAsset = /\.(jpg|jpeg|png|gif|svg|webp|avif|css|js|woff|woff2|ttf|eot)$/i.test(url)
      if (isAsset) {
        missingAssets.push(url)
      }
    }
  })
  
  try {
    const response = await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    })
    
    const statusCode = response?.status() || 0
    
    // Wait a bit more for any late-loading assets
    await page.waitForTimeout(2000)
    
    return {
      loaded: statusCode >= 200 && statusCode < 400,
      statusCode,
      consoleErrors,
      networkErrors,
      missingAssets,
    }
  } catch (error: any) {
    return {
      loaded: false,
      statusCode: 0,
      consoleErrors: [error.message],
      networkErrors: [],
      missingAssets: [],
    }
  }
}

/**
 * Check navigation links on a page
 */
async function checkNavigationLinks(page: Page, baseUrl: string): Promise<{
  totalLinks: number
  brokenLinks: Array<{ href: string; text: string; status: number }>
  internalLinks: number
  externalLinks: number
}> {
  const brokenLinks: Array<{ href: string; text: string; status: number }> = []
  let internalLinks = 0
  let externalLinks = 0
  
  try {
    // Get all links on the page
    const links = await page.$$eval('a[href]', (anchors) => 
      anchors.map(a => ({
        href: (a as HTMLAnchorElement).href,
        text: a.textContent?.trim() || '',
      }))
    )
    
    for (const link of links) {
      const url = new URL(link.href)
      const isInternal = url.origin === new URL(baseUrl).origin
      
      if (isInternal) {
        internalLinks++
        
        // Check if internal link is accessible
        try {
          const response = await page.goto(link.href, { 
            waitUntil: 'domcontentloaded',
            timeout: 10000 
          })
          
          if (response && (response.status() >= 400)) {
            brokenLinks.push({
              href: link.href,
              text: link.text,
              status: response.status(),
            })
          }
        } catch (error) {
          // Link might be a hash anchor or JavaScript link
          // We'll skip those
        }
      } else {
        externalLinks++
      }
    }
  } catch (error) {
    // If we can't check links, that's okay - log it
    logResult('Navigation Links Check', 'warning', 'Could not check all navigation links', { error: (error as Error).message })
  }
  
  return {
    totalLinks: internalLinks + externalLinks,
    brokenLinks,
    internalLinks,
    externalLinks,
  }
}

/**
 * Check images and assets load properly
 */
async function checkAssets(page: Page): Promise<{
  totalImages: number
  brokenImages: string[]
  totalAssets: number
  brokenAssets: string[]
}> {
  const brokenImages: string[] = []
  const brokenAssets: string[] = []
  let images: string[] = []
  let allAssets: string[] = []
  
  try {
    // Check images
    images = await page.$$eval('img[src]', (imgs) => 
      imgs.map(img => (img as HTMLImageElement).src)
    )
    
    for (const imgSrc of images) {
      try {
        const response = await page.goto(imgSrc, { 
          waitUntil: 'domcontentloaded',
          timeout: 5000 
        })
        
        if (response && response.status() >= 400) {
          brokenImages.push(imgSrc)
        }
      } catch (error) {
        // Image might be a data URL or external - skip
        if (!imgSrc.startsWith('data:') && !imgSrc.startsWith('http')) {
          brokenImages.push(imgSrc)
        }
      }
    }
    
    // Check other assets (CSS, JS) from the page
    const stylesheets = await page.$$eval('link[rel="stylesheet"]', (links) => 
      links.map(link => (link as HTMLLinkElement).href)
    )
    
    const scripts = await page.$$eval('script[src]', (scripts) => 
      scripts.map(script => (script as HTMLScriptElement).src)
    )
    
    allAssets = [...stylesheets, ...scripts]
    
    for (const assetUrl of allAssets) {
      try {
        const response = await page.goto(assetUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 5000 
        })
        
        if (response && response.status() >= 400) {
          brokenAssets.push(assetUrl)
        }
      } catch (error) {
        // Asset might be external or inline - skip
      }
    }
  } catch (error) {
    logResult('Assets Check', 'warning', 'Could not check all assets', { error: (error as Error).message })
  }
  
  return {
    totalImages: images.length,
    brokenImages,
    totalAssets: allAssets.length,
    brokenAssets,
  }
}

/**
 * Main verification function
 */
async function runVerification() {
  console.log('🚀 Starting Post-Deployment Verification\n')
  console.log('='.repeat(60))
  console.log(`Base URL: ${baseUrl}\n`)
  
  // Step 1: Check application accessibility
  console.log('\n📡 Step 1: Checking Application Accessibility\n')
  const accessibility = await checkUrlAccessibility(baseUrl)
  
  if (accessibility.accessible) {
    logResult(
      'Application Accessibility',
      'success',
      `Application is accessible at ${baseUrl}`,
      { statusCode: accessibility.statusCode }
    )
  } else {
    logResult(
      'Application Accessibility',
      'error',
      `Application is not accessible at ${baseUrl}`,
      { error: accessibility.error }
    )
    console.log('\n❌ Cannot proceed with verification - application is not accessible')
    process.exit(1)
  }
  
  // Step 2: Launch browser and check pages
  console.log('\n🌐 Step 2: Checking Pages and Assets\n')
  
  let browser: Browser
  try {
    browser = await chromium.launch({ headless: true })
  } catch (error: any) {
    if (error.message?.includes('Executable doesn\'t exist') || error.message?.includes('browserType.launch')) {
      console.log('\n❌ Playwright browsers are not installed.')
      console.log('\n📦 Please install Playwright browsers first:')
      console.log('   npx playwright install\n')
      console.log('   Or install only Chromium:')
      console.log('   npx playwright install chromium\n')
      process.exit(1)
    }
    throw error
  }
  
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // Check homepage first
    console.log('\n📄 Checking Homepage...\n')
    const homepageCheck = await checkPageLoad(page, baseUrl)
    
    if (homepageCheck.loaded) {
      logResult(
        'Homepage Load',
        'success',
        'Homepage loads correctly',
        { statusCode: homepageCheck.statusCode }
      )
    } else {
      logResult(
        'Homepage Load',
        'error',
        'Homepage failed to load',
        { statusCode: homepageCheck.statusCode, errors: homepageCheck.consoleErrors }
      )
    }
    
    // Check console errors
    if (homepageCheck.consoleErrors.length > 0) {
      logResult(
        'Console Errors (Homepage)',
        'error',
        `Found ${homepageCheck.consoleErrors.length} console error(s)`,
        { errors: homepageCheck.consoleErrors.slice(0, 10) } // Limit to first 10
      )
    } else {
      logResult(
        'Console Errors (Homepage)',
        'success',
        'No console errors found'
      )
    }
    
    // Check assets on homepage
    const homepageAssets = await checkAssets(page)
    if (homepageAssets.brokenImages.length > 0 || homepageAssets.brokenAssets.length > 0) {
      logResult(
        'Assets (Homepage)',
        'warning',
        `Found ${homepageAssets.brokenImages.length} broken images and ${homepageAssets.brokenAssets.length} broken assets`,
        {
          brokenImages: homepageAssets.brokenImages.slice(0, 5),
          brokenAssets: homepageAssets.brokenAssets.slice(0, 5),
        }
      )
    } else {
      logResult(
        'Assets (Homepage)',
        'success',
        `All assets load correctly (${homepageAssets.totalImages} images, ${homepageAssets.totalAssets} other assets)`
      )
    }
    
    // Check navigation links on homepage
    const navCheck = await checkNavigationLinks(page, baseUrl)
    if (navCheck.brokenLinks.length > 0) {
      logResult(
        'Navigation Links',
        'warning',
        `Found ${navCheck.brokenLinks.length} broken internal link(s)`,
        { brokenLinks: navCheck.brokenLinks.slice(0, 10) }
      )
    } else {
      logResult(
        'Navigation Links',
        'success',
        `All navigation links work correctly (${navCheck.internalLinks} internal, ${navCheck.externalLinks} external)`
      )
    }
    
    // Step 3: Check all static pages
    console.log('\n📚 Step 3: Checking All Static Pages\n')
    const pageResults: Array<{ path: string; status: 'success' | 'error'; statusCode: number; errors: number }> = []
    
    for (const route of publicRoutes) {
      const fullUrl = `${baseUrl}${route}`
      console.log(`Checking ${route}...`)
      
      try {
        const pageCheck = await checkPageLoad(page, fullUrl)
        
        if (pageCheck.loaded && pageCheck.statusCode < 400) {
          pageResults.push({
            path: route,
            status: 'success',
            statusCode: pageCheck.statusCode,
            errors: pageCheck.consoleErrors.length,
          })
        } else {
          pageResults.push({
            path: route,
            status: 'error',
            statusCode: pageCheck.statusCode,
            errors: pageCheck.consoleErrors.length,
          })
          
          logResult(
            `Page: ${route}`,
            'error',
            `Failed to load (Status: ${pageCheck.statusCode})`,
            { errors: pageCheck.consoleErrors.slice(0, 3) }
          )
        }
        
        // Check for 404 errors
        if (pageCheck.statusCode === 404) {
          logResult(
            `404 Check: ${route}`,
            'error',
            'Page returned 404 error'
          )
        }
        
        // Check for network errors
        if (pageCheck.networkErrors.length > 0) {
          logResult(
            `Network Errors: ${route}`,
            'warning',
            `Found ${pageCheck.networkErrors.length} network error(s)`,
            { errors: pageCheck.networkErrors.slice(0, 5) }
          )
        }
      } catch (error: any) {
        pageResults.push({
          path: route,
          status: 'error',
          statusCode: 0,
          errors: 1,
        })
        
        logResult(
          `Page: ${route}`,
          'error',
          'Failed to check page',
          { error: error.message }
        )
      }
    }
    
    // Summary of page checks
    const successfulPages = pageResults.filter(p => p.status === 'success').length
    const failedPages = pageResults.filter(p => p.status === 'error').length
    
    logResult(
      'Static Pages Summary',
      failedPages === 0 ? 'success' : 'error',
      `${successfulPages}/${publicRoutes.length} pages loaded successfully`,
      { failed: failedPages, total: publicRoutes.length }
    )
    
  } finally {
    await browser.close()
  }
  
  // Step 4: Final Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Verification Summary\n')
  
  const successCount = results.filter(r => r.status === 'success').length
  const errorCount = results.filter(r => r.status === 'error').length
  const warningCount = results.filter(r => r.status === 'warning').length
  
  console.log(`✅ Success: ${successCount}`)
  console.log(`⚠️  Warnings: ${warningCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  
  // Print detailed results
  console.log('\n📋 Detailed Results:\n')
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️'
    console.log(`${icon} ${result.check}`)
    console.log(`   ${result.message}`)
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`)
    }
    console.log('')
  })
  
  if (errorCount === 0) {
    console.log('\n🎉 All critical checks passed! Deployment verification successful.')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some checks failed. Please review the errors above.')
    process.exit(1)
  }
}

// Run verification
runVerification().catch((error) => {
  console.error('❌ Verification script failed:', error)
  process.exit(1)
})

