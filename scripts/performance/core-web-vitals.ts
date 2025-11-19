#!/usr/bin/env tsx
/**
 * Core Web Vitals Testing Script
 * 
 * Uses Playwright to measure Core Web Vitals:
 * - LCP (Largest Contentful Paint) < 2.5s
 * - FID (First Input Delay) < 100ms
 * - CLS (Cumulative Layout Shift) < 0.1
 * 
 * Usage:
 *   npm run perf:web-vitals
 *   npm run perf:web-vitals -- --url http://localhost:3000 --pages home,about
 */

import { chromium, Browser, Page } from 'playwright'

interface WebVitalsResult {
  lcp: number | null
  fid: number | null
  cls: number | null
  fcp: number | null // First Contentful Paint
  ttfb: number | null // Time to First Byte
  url: string
}

interface TestConfig {
  url: string
  pages: string[]
  thresholds: {
    lcp: number
    fid: number
    cls: number
  }
}

const DEFAULT_CONFIG: TestConfig = {
  url: process.env.PERF_TEST_URL || 'http://localhost:3000',
  pages: ['', 'about', 'contact', 'find-cleaners'],
  thresholds: {
    lcp: 2500, // 2.5 seconds
    fid: 100, // 100ms
    cls: 0.1,
  },
}

function parseArgs(): Partial<TestConfig> {
  const args = process.argv.slice(2)
  const config: Partial<TestConfig> = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--url' && args[i + 1]) {
      config.url = args[i + 1]
      i++
    } else if (arg === '--pages' && args[i + 1]) {
      config.pages = args[i + 1].split(',').map(p => p.trim())
      i++
    }
  }

  return config
}

async function measureWebVitals(page: Page, url: string): Promise<WebVitalsResult> {
  const result: WebVitalsResult = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    url,
  }

  // Inject Web Vitals measurement script
  await page.addInitScript(() => {
    // Measure LCP
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry && lastEntry.renderTime) {
            ;(window as any).__lcp = lastEntry.renderTime
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        console.error('LCP observer error:', e)
      }

      // Measure CLS
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          ;(window as any).__cls = clsValue
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        console.error('CLS observer error:', e)
      }

      // Measure FCP
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const fcpEntry = entries.find((e: any) => e.name === 'first-contentful-paint')
          if (fcpEntry) {
            ;(window as any).__fcp = fcpEntry.startTime
          }
        })
        fcpObserver.observe({ entryTypes: ['paint'] })
      } catch (e) {
        console.error('FCP observer error:', e)
      }
    }
  })

  // Measure TTFB
  const navigationStart = Date.now()
  const response = await page.goto(url, { waitUntil: 'networkidle' })
  const ttfb = response ? response.timing().responseStart - response.timing().requestStart : null
  result.ttfb = ttfb

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000) // Wait 2s for LCP to stabilize

  // Get metrics from page
  const metrics = await page.evaluate(() => {
    return {
      lcp: (window as any).__lcp || null,
      cls: (window as any).__cls || null,
      fcp: (window as any).__fcp || null,
    }
  })

  result.lcp = metrics.lcp
  result.cls = metrics.cls
  result.fcp = metrics.fcp

  // Measure FID by simulating a click
  const fidStart = Date.now()
  try {
    // Find a clickable element (button, link, etc.)
    const clickable = await page.$('button, a, [role="button"]')
    if (clickable) {
      await clickable.click()
      const fidEnd = Date.now()
      result.fid = fidEnd - fidStart
    }
  } catch (e) {
    // FID measurement failed, but that's okay
    console.warn('Could not measure FID:', e)
  }

  return result
}

function formatMetric(name: string, value: number | null, threshold: number, unit: string = 'ms'): string {
  if (value === null) return `${name}: N/A`
  const status = value <= threshold ? '✅' : '❌'
  return `${status} ${name}: ${value.toFixed(2)}${unit} (threshold: ${threshold}${unit})`
}

function printResults(result: WebVitalsResult, config: TestConfig): void {
  console.log(`\n📊 Core Web Vitals for ${result.url}`)
  console.log('=' .repeat(60))
  console.log(formatMetric('LCP', result.lcp, config.thresholds.lcp))
  console.log(formatMetric('FID', result.fid, config.thresholds.fid))
  console.log(formatMetric('CLS', result.cls, config.thresholds.cls, ''))
  if (result.fcp) {
    console.log(formatMetric('FCP', result.fcp, 1800))
  }
  if (result.ttfb) {
    console.log(formatMetric('TTFB', result.ttfb, 800))
  }
  console.log('=' .repeat(60))
}

function validateResults(result: WebVitalsResult, config: TestConfig): boolean {
  const failures: string[] = []

  if (result.lcp !== null && result.lcp > config.thresholds.lcp) {
    failures.push(`LCP ${result.lcp}ms > ${config.thresholds.lcp}ms`)
  }

  if (result.fid !== null && result.fid > config.thresholds.fid) {
    failures.push(`FID ${result.fid}ms > ${config.thresholds.fid}ms`)
  }

  if (result.cls !== null && result.cls > config.thresholds.cls) {
    failures.push(`CLS ${result.cls} > ${config.thresholds.cls}`)
  }

  if (failures.length > 0) {
    console.error('\n❌ Core Web Vitals thresholds not met:')
    failures.forEach(f => console.error(`   - ${f}`))
    return false
  }

  return true
}

async function main() {
  const args = parseArgs()
  const config: TestConfig = { ...DEFAULT_CONFIG, ...args }

  console.log('🚀 Core Web Vitals Testing')
  console.log('=' .repeat(60))
  console.log(`Base URL: ${config.url}`)
  console.log(`Pages to test: ${config.pages.join(', ')}`)
  console.log('=' .repeat(60))

  const browser = await chromium.launch({ headless: true })
  const results: Array<{ result: WebVitalsResult; passed: boolean }> = []

  try {
    for (const page of config.pages) {
      const url = page ? `${config.url}/${page}` : config.url
      const pageInstance = await browser.newPage()
      
      try {
        const result = await measureWebVitals(pageInstance, url)
        const passed = validateResults(result, config)
        printResults(result, config)
        results.push({ result, passed })
      } catch (error: any) {
        console.error(`❌ Failed to test ${url}:`, error.message)
        results.push({
          result: { lcp: null, fid: null, cls: null, fcp: null, ttfb: null, url },
          passed: false,
        })
      } finally {
        await pageInstance.close()
      }
    }
  } finally {
    await browser.close()
  }

  // Summary
  console.log('\n📋 Summary')
  console.log('=' .repeat(60))
  const passed = results.filter(r => r.passed).length
  const total = results.length
  console.log(`Tests passed: ${passed}/${total}`)

  if (passed < total) {
    console.error('\n❌ Some pages did not meet Core Web Vitals thresholds')
    process.exit(1)
  } else {
    console.log('\n✅ All pages meet Core Web Vitals thresholds!')
    process.exit(0)
  }
}

main().catch(error => {
  console.error('❌ Error running Core Web Vitals tests:', error)
  process.exit(1)
})

