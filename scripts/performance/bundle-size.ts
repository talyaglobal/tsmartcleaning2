#!/usr/bin/env tsx
/**
 * Bundle Size Analysis Script
 * 
 * Analyzes production build bundle sizes and reports:
 * - Total bundle size
 * - Individual chunk sizes
 * - Largest dependencies
 * - Bundle size trends
 * 
 * Usage:
 *   npm run perf:bundle-size
 *   npm run perf:bundle-size -- --build-dir .next
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, dirname } from 'path'

interface BundleInfo {
  name: string
  size: number
  gzipped?: number
  path: string
}

interface BundleAnalysis {
  totalSize: number
  totalGzipped: number
  chunks: BundleInfo[]
  largestChunks: BundleInfo[]
  recommendations: string[]
}

const MAX_BUNDLE_SIZE = 500 * 1024 // 500KB per chunk
const MAX_TOTAL_SIZE = 2 * 1024 * 1024 // 2MB total
const MAX_GZIPPED_SIZE = 200 * 1024 // 200KB gzipped per chunk

function parseArgs() {
  const args = process.argv.slice(2)
  const config: { buildDir?: string; threshold?: number } = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--build-dir' && args[i + 1]) {
      config.buildDir = args[i + 1]
      i++
    } else if (arg === '--threshold' && args[i + 1]) {
      config.threshold = parseInt(args[i + 1], 10)
      i++
    }
  }

  return config
}

function getFileSize(filePath: string): number {
  try {
    return statSync(filePath).size
  } catch {
    return 0
  }
}

function estimateGzipSize(size: number): number {
  // Rough estimate: gzip typically reduces size by 60-80%
  return Math.round(size * 0.3)
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

function analyzeBuildDirectory(buildDir: string): BundleAnalysis {
  const chunks: BundleInfo[] = []
  let totalSize = 0
  let totalGzipped = 0

  // Analyze .next/static/chunks
  const chunksDir = join(buildDir, 'static', 'chunks')
  if (existsSync(chunksDir)) {
    const files = readdirSync(chunksDir)
    for (const file of files) {
      if (file.endsWith('.js')) {
        const filePath = join(chunksDir, file)
        const size = getFileSize(filePath)
        const gzipped = estimateGzipSize(size)
        chunks.push({
          name: file,
          size,
          gzipped,
          path: filePath,
        })
        totalSize += size
        totalGzipped += gzipped
      }
    }
  }

  // Analyze .next/static/css
  const cssDir = join(buildDir, 'static', 'css')
  if (existsSync(cssDir)) {
    const files = readdirSync(cssDir)
    for (const file of files) {
      if (file.endsWith('.css')) {
        const filePath = join(cssDir, file)
        const size = getFileSize(filePath)
        const gzipped = estimateGzipSize(size)
        chunks.push({
          name: `css/${file}`,
          size,
          gzipped,
          path: filePath,
        })
        totalSize += size
        totalGzipped += gzipped
      }
    }
  }

  // Sort by size
  chunks.sort((a, b) => b.size - a.size)
  const largestChunks = chunks.slice(0, 10)

  // Generate recommendations
  const recommendations: string[] = []
  
  if (totalSize > MAX_TOTAL_SIZE) {
    recommendations.push(`Total bundle size (${formatBytes(totalSize)}) exceeds recommended ${formatBytes(MAX_TOTAL_SIZE)}`)
  }

  const largeChunks = chunks.filter(c => c.size > MAX_BUNDLE_SIZE)
  if (largeChunks.length > 0) {
    recommendations.push(`${largeChunks.length} chunks exceed ${formatBytes(MAX_BUNDLE_SIZE)} limit`)
  }

  const largeGzipped = chunks.filter(c => c.gzipped && c.gzipped > MAX_GZIPPED_SIZE)
  if (largeGzipped.length > 0) {
    recommendations.push(`${largeGzipped.length} chunks exceed ${formatBytes(MAX_GZIPPED_SIZE)} gzipped limit`)
  }

  if (chunks.length > 50) {
    recommendations.push(`High number of chunks (${chunks.length}). Consider code splitting optimization.`)
  }

  return {
    totalSize,
    totalGzipped,
    chunks,
    largestChunks,
    recommendations,
  }
}

function analyzePackageJson(): { dependencies: number; devDependencies: number } {
  try {
    const packagePath = join(process.cwd(), 'package.json')
    const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'))
    return {
      dependencies: Object.keys(pkg.dependencies || {}).length,
      devDependencies: Object.keys(pkg.devDependencies || {}).length,
    }
  } catch {
    return { dependencies: 0, devDependencies: 0 }
  }
}

function printAnalysis(analysis: BundleAnalysis, deps: { dependencies: number; devDependencies: number }): void {
  console.log('\n📦 Bundle Size Analysis')
  console.log('=' .repeat(60))
  console.log(`Total Bundle Size: ${formatBytes(analysis.totalSize)}`)
  console.log(`Total Gzipped Size (estimated): ${formatBytes(analysis.totalGzipped)}`)
  console.log(`Number of Chunks: ${analysis.chunks.length}`)
  console.log(`Dependencies: ${deps.dependencies} production, ${deps.devDependencies} dev`)
  console.log('\n📊 Largest Chunks:')
  console.log('-'.repeat(60))
  
  analysis.largestChunks.forEach((chunk, index) => {
    const sizeStr = formatBytes(chunk.size)
    const gzipStr = chunk.gzipped ? ` (${formatBytes(chunk.gzipped)} gzipped)` : ''
    const status = chunk.size > MAX_BUNDLE_SIZE ? '⚠️' : '✅'
    console.log(`${index + 1}. ${status} ${chunk.name}: ${sizeStr}${gzipStr}`)
  })

  if (analysis.recommendations.length > 0) {
    console.log('\n⚠️  Recommendations:')
    analysis.recommendations.forEach(rec => {
      console.log(`   - ${rec}`)
    })
  } else {
    console.log('\n✅ Bundle sizes are within recommended limits!')
  }

  console.log('=' .repeat(60))
}

function checkBuildExists(buildDir: string): boolean {
  if (!existsSync(buildDir)) {
    console.error(`❌ Build directory not found: ${buildDir}`)
    console.error('   Please run "npm run build" first')
    return false
  }

  const staticDir = join(buildDir, 'static')
  if (!existsSync(staticDir)) {
    console.error(`❌ Static directory not found in: ${buildDir}`)
    console.error('   Build may be incomplete')
    return false
  }

  return true
}

async function main() {
  const args = parseArgs()
  const buildDir = args.buildDir || join(process.cwd(), '.next')

  console.log('🔍 Bundle Size Analysis')
  console.log('=' .repeat(60))
  console.log(`Build directory: ${buildDir}`)

  if (!checkBuildExists(buildDir)) {
    process.exit(1)
  }

  const analysis = analyzeBuildDirectory(buildDir)
  const deps = analyzePackageJson()
  
  printAnalysis(analysis, deps)

  // Exit with error if recommendations exist
  if (analysis.recommendations.length > 0) {
    console.error('\n❌ Bundle size issues detected')
    process.exit(1)
  } else {
    console.log('\n✅ Bundle size analysis passed!')
    process.exit(0)
  }
}

main().catch(error => {
  console.error('❌ Error analyzing bundle size:', error)
  process.exit(1)
})

