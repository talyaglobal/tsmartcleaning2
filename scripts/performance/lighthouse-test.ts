#!/usr/bin/env tsx
/**
 * Lighthouse Performance Testing Script
 * 
 * This script runs Lighthouse audits on key pages and verifies:
 * - Performance score > 90
 * - Core Web Vitals thresholds
 * - Page load times
 * 
 * Usage:
 *   npm run perf:lighthouse
 *   npm run perf:lighthouse -- --url http://localhost:3000
 *   npm run perf:lighthouse -- --url https://production-url.com --pages home,about,contact
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

interface LighthouseResult {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
  metrics: {
    firstContentfulPaint?: number
    largestContentfulPaint?: number
    totalBlockingTime?: number
    cumulativeLayoutShift?: number
    speedIndex?: number
    timeToInteractive?: number
  }
}

interface TestConfig {
  url: string
  pages: string[]
  outputDir: string
  thresholds: {
    performance: number
    lcp: number // Largest Contentful Paint (ms)
    fid: number // First Input Delay (ms) - not directly measurable, using TBT as proxy
    cls: number // Cumulative Layout Shift
  }
}

const DEFAULT_CONFIG: TestConfig = {
  url: process.env.PERF_TEST_URL || 'http://localhost:3000',
  pages: ['', 'about', 'contact', 'find-cleaners', 'insurance'],
  outputDir: join(process.cwd(), '.lighthouse'),
  thresholds: {
    performance: 90,
    lcp: 2500, // 2.5 seconds
    fid: 100, // 100ms (using TBT as proxy)
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
    } else if (arg === '--output' && args[i + 1]) {
      config.outputDir = args[i + 1]
      i++
    }
  }

  return config
}

function checkLighthouseInstalled(): boolean {
  try {
    execSync('lighthouse --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function installLighthouse(): void {
  console.log('📦 Installing Lighthouse CLI...')
  try {
    execSync('npm install -g lighthouse', { stdio: 'inherit' })
    console.log('✅ Lighthouse installed successfully')
  } catch (error) {
    console.error('❌ Failed to install Lighthouse. Please install manually:')
    console.error('   npm install -g lighthouse')
    process.exit(1)
  }
}

function runLighthouse(url: string, outputDir: string): LighthouseResult {
  const outputPath = join(outputDir, `lighthouse-${Date.now()}.json`)
  const htmlPath = join(outputDir, `lighthouse-${Date.now()}.html`)

  console.log(`\n🔍 Running Lighthouse audit for: ${url}`)

  try {
    // Run Lighthouse with JSON and HTML output
    const command = `lighthouse "${url}" ` +
      `--output=json,html ` +
      `--output-path=${outputPath.replace('.json', '')} ` +
      `--chrome-flags="--headless --no-sandbox" ` +
      `--only-categories=performance,accessibility,best-practices,seo ` +
      `--quiet`

    execSync(command, { stdio: 'inherit' })

    // Read and parse results
    const fs = require('fs')
    const result = JSON.parse(fs.readFileSync(outputPath, 'utf-8'))

    const metrics = result.audits
    const performance = Math.round(result.categories.performance.score * 100)
    const accessibility = Math.round(result.categories.accessibility.score * 100)
    const bestPractices = Math.round(result.categories['best-practices'].score * 100)
    const seo = Math.round(result.categories.seo.score * 100)

    return {
      performance,
      accessibility,
      bestPractices,
      seo,
      metrics: {
        firstContentfulPaint: metrics['first-contentful-paint']?.numericValue,
        largestContentfulPaint: metrics['largest-contentful-paint']?.numericValue,
        totalBlockingTime: metrics['total-blocking-time']?.numericValue,
        cumulativeLayoutShift: metrics['cumulative-layout-shift']?.numericValue,
        speedIndex: metrics['speed-index']?.numericValue,
        timeToInteractive: metrics['interactive']?.numericValue,
      },
    }
  } catch (error: any) {
    console.error(`❌ Lighthouse audit failed for ${url}:`, error.message)
    throw error
  }
}

function formatMetric(name: string, value: number | undefined, threshold: number, unit: string = 'ms'): string {
  if (value === undefined) return `${name}: N/A`
  const status = value <= threshold ? '✅' : '❌'
  return `${status} ${name}: ${value.toFixed(2)}${unit} (threshold: ${threshold}${unit})`
}

function printResults(result: LighthouseResult, config: TestConfig, url: string): void {
  console.log(`\n📊 Lighthouse Results for ${url}`)
  console.log('=' .repeat(60))
  console.log(`Performance Score: ${result.performance}/100 ${result.performance >= config.thresholds.performance ? '✅' : '❌'}`)
  console.log(`Accessibility: ${result.accessibility}/100`)
  console.log(`Best Practices: ${result.bestPractices}/100`)
  console.log(`SEO: ${result.seo}/100`)
  console.log('\n📈 Core Web Vitals:')
  console.log(formatMetric('LCP', result.metrics.largestContentfulPaint, config.thresholds.lcp))
  console.log(formatMetric('TBT (FID proxy)', result.metrics.totalBlockingTime, config.thresholds.fid))
  console.log(formatMetric('CLS', result.metrics.cumulativeLayoutShift, config.thresholds.cls, ''))
  console.log(formatMetric('FCP', result.metrics.firstContentfulPaint, 1800))
  console.log(formatMetric('Speed Index', result.metrics.speedIndex, 3400))
  console.log(formatMetric('TTI', result.metrics.timeToInteractive, 3800))
  console.log('=' .repeat(60))
}

function validateResults(result: LighthouseResult, config: TestConfig): boolean {
  const failures: string[] = []

  if (result.performance < config.thresholds.performance) {
    failures.push(`Performance score ${result.performance} < ${config.thresholds.performance}`)
  }

  if (result.metrics.largestContentfulPaint && result.metrics.largestContentfulPaint > config.thresholds.lcp) {
    failures.push(`LCP ${result.metrics.largestContentfulPaint}ms > ${config.thresholds.lcp}ms`)
  }

  if (result.metrics.totalBlockingTime && result.metrics.totalBlockingTime > config.thresholds.fid) {
    failures.push(`TBT ${result.metrics.totalBlockingTime}ms > ${config.thresholds.fid}ms (FID proxy)`)
  }

  if (result.metrics.cumulativeLayoutShift && result.metrics.cumulativeLayoutShift > config.thresholds.cls) {
    failures.push(`CLS ${result.metrics.cumulativeLayoutShift} > ${config.thresholds.cls}`)
  }

  if (failures.length > 0) {
    console.error('\n❌ Performance thresholds not met:')
    failures.forEach(f => console.error(`   - ${f}`))
    return false
  }

  return true
}

async function main() {
  const args = parseArgs()
  const config: TestConfig = { ...DEFAULT_CONFIG, ...args }

  console.log('🚀 Lighthouse Performance Testing')
  console.log('=' .repeat(60))
  console.log(`Base URL: ${config.url}`)
  console.log(`Pages to test: ${config.pages.join(', ')}`)
  console.log(`Output directory: ${config.outputDir}`)
  console.log('=' .repeat(60))

  // Check if Lighthouse is installed
  if (!checkLighthouseInstalled()) {
    console.log('⚠️  Lighthouse CLI not found')
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const answer = await new Promise<string>(resolve => {
      readline.question('Install Lighthouse globally? (y/n): ', resolve)
    })
    readline.close()

    if (answer.toLowerCase() === 'y') {
      installLighthouse()
    } else {
      console.error('❌ Lighthouse is required. Install with: npm install -g lighthouse')
      process.exit(1)
    }
  }

  // Create output directory
  const fs = require('fs')
  if (!existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true })
  }

  // Test each page
  const results: Array<{ url: string; result: LighthouseResult; passed: boolean }> = []

  for (const page of config.pages) {
    const url = page ? `${config.url}/${page}` : config.url
    try {
      const result = runLighthouse(url, config.outputDir)
      const passed = validateResults(result, config)
      printResults(result, config, url)
      results.push({ url, result, passed })
    } catch (error) {
      console.error(`❌ Failed to test ${url}`)
      results.push({ url, result: null as any, passed: false })
    }
  }

  // Summary
  console.log('\n📋 Summary')
  console.log('=' .repeat(60))
  const passed = results.filter(r => r.passed).length
  const total = results.length
  console.log(`Tests passed: ${passed}/${total}`)

  if (passed < total) {
    console.error('\n❌ Some pages did not meet performance thresholds')
    process.exit(1)
  } else {
    console.log('\n✅ All pages meet performance thresholds!')
    process.exit(0)
  }
}

main().catch(error => {
  console.error('❌ Error running Lighthouse tests:', error)
  process.exit(1)
})

