#!/usr/bin/env tsx
/**
 * Network Throttling Performance Test
 * 
 * Tests page load performance under slow network conditions (3G throttling)
 * 
 * Usage:
 *   npm run perf:throttle
 *   npm run perf:throttle -- --url http://localhost:3000 --pages home,about
 */

import { chromium, Browser, Page } from 'playwright'

interface ThrottleResult {
  url: string
  loadTime: number
  domContentLoaded: number
  fullyLoaded: number
  requests: number
  totalBytes: number
}

interface TestConfig {
  url: string
  pages: string[]
  throttleProfile: '3g' | 'slow-3g' | 'fast-3g' | '4g'
}

const THROTTLE_PROFILES = {
  '3g': {
    downloadThroughput: 750 * 1024 / 8, // 750 Kbps
    uploadThroughput: 250 * 1024 / 8, // 250 Kbps
    latency: 100, // 100ms
  },
  'slow-3g': {
    downloadThroughput: 400 * 1024 / 8, // 400 Kbps
    uploadThroughput: 400 * 1024 / 8, // 400 Kbps
    latency: 400, // 400ms
  },
  'fast-3g': {
    downloadThroughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps
    uploadThroughput: 750 * 1024 / 8, // 750 Kbps
    latency: 150, // 150ms
  },
  '4g': {
    downloadThroughput: 10 * 1024 * 1024 / 8, // 10 Mbps
    uploadThroughput: 5 * 1024 * 1024 / 8, // 5 Mbps
    latency: 20, // 20ms
  },
}

const DEFAULT_CONFIG: TestConfig = {
  url: process.env.PERF_TEST_URL || 'http://localhost:3000',
  pages: ['', 'about', 'contact', 'find-cleaners'],
  throttleProfile: '3g',
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
    } else if (arg === '--profile' && args[i + 1]) {
      const profile = args[i + 1] as TestConfig['throttleProfile']
      if (['3g', 'slow-3g', 'fast-3g', '4g'].includes(profile)) {
        config.throttleProfile = profile
      }
      i++
    }
  }

  return config
}

async function measureWithThrottle(
  page: Page,
  url: string,
  profile: TestConfig['throttleProfile']
): Promise<ThrottleResult> {
  const throttle = THROTTLE_PROFILES[profile]

  // Set up network throttling
  const context = page.context()
  await context.route('**/*', async (route) => {
    await route.continue()
  })

  // Enable CDP to set network conditions
  const client = await context.newCDPSession(page)
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: throttle.downloadThroughput,
    uploadThroughput: throttle.uploadThroughput,
    latency: throttle.latency,
  })

  const startTime = Date.now()
  let domContentLoaded = 0
  let fullyLoaded = 0
  let requests = 0
  let totalBytes = 0

  // Track network requests
  page.on('request', () => {
    requests++
  })

  page.on('response', async (response) => {
    try {
      const headers = response.headers()
      const contentLength = headers['content-length']
      if (contentLength) {
        totalBytes += parseInt(contentLength, 10)
      }
    } catch (e) {
      // Ignore errors
    }
  })

  // Measure navigation timing
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  domContentLoaded = Date.now() - startTime

  // Wait for network to be idle
  await page.waitForLoadState('networkidle')
  fullyLoaded = Date.now() - startTime

  const loadTime = fullyLoaded

  return {
    url,
    loadTime,
    domContentLoaded,
    fullyLoaded,
    requests,
    totalBytes,
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function printResults(result: ThrottleResult, profile: TestConfig['throttleProfile']): void {
  console.log(`\n📊 Network Performance (${profile.toUpperCase()}) for ${result.url}`)
  console.log('=' .repeat(60))
  console.log(`DOM Content Loaded: ${formatTime(result.domContentLoaded)}`)
  console.log(`Fully Loaded: ${formatTime(result.fullyLoaded)}`)
  console.log(`Total Load Time: ${formatTime(result.loadTime)}`)
  console.log(`Network Requests: ${result.requests}`)
  console.log(`Total Bytes Transferred: ${formatBytes(result.totalBytes)}`)
  
  // Performance assessment
  const status = result.loadTime < 5000 ? '✅' : result.loadTime < 10000 ? '⚠️' : '❌'
  console.log(`Performance: ${status} ${formatTime(result.loadTime)}`)
  console.log('=' .repeat(60))
}

function validateResults(result: ThrottleResult, profile: TestConfig['throttleProfile']): boolean {
  // Thresholds based on network profile
  const thresholds = {
    '3g': 10000, // 10 seconds for 3G
    'slow-3g': 15000, // 15 seconds for slow 3G
    'fast-3g': 5000, // 5 seconds for fast 3G
    '4g': 3000, // 3 seconds for 4G
  }

  const threshold = thresholds[profile]
  return result.loadTime <= threshold
}

async function main() {
  const args = parseArgs()
  const config: TestConfig = { ...DEFAULT_CONFIG, ...args }

  console.log('🚀 Network Throttling Performance Test')
  console.log('=' .repeat(60))
  console.log(`Base URL: ${config.url}`)
  console.log(`Pages to test: ${config.pages.join(', ')}`)
  console.log(`Throttle profile: ${config.throttleProfile}`)
  console.log(`Profile settings:`, THROTTLE_PROFILES[config.throttleProfile])
  console.log('=' .repeat(60))

  const browser = await chromium.launch({ headless: true })
  const results: Array<{ result: ThrottleResult; passed: boolean }> = []

  try {
    for (const page of config.pages) {
      const url = page ? `${config.url}/${page}` : config.url
      const pageInstance = await browser.newPage()
      
      try {
        const result = await measureWithThrottle(pageInstance, url, config.throttleProfile)
        const passed = validateResults(result, config.throttleProfile)
        printResults(result, config.throttleProfile)
        results.push({ result, passed })
      } catch (error: any) {
        console.error(`❌ Failed to test ${url}:`, error.message)
        results.push({
          result: {
            url,
            loadTime: 0,
            domContentLoaded: 0,
            fullyLoaded: 0,
            requests: 0,
            totalBytes: 0,
          },
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
  const avgLoadTime = results.reduce((sum, r) => sum + r.result.loadTime, 0) / results.length
  
  console.log(`Tests passed: ${passed}/${total}`)
  console.log(`Average load time: ${formatTime(avgLoadTime)}`)

  if (passed < total) {
    console.error('\n❌ Some pages did not meet performance thresholds under network throttling')
    process.exit(1)
  } else {
    console.log('\n✅ All pages meet performance thresholds under network throttling!')
    process.exit(0)
  }
}

main().catch(error => {
  console.error('❌ Error running network throttling tests:', error)
  process.exit(1)
})

