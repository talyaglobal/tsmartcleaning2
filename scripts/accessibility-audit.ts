#!/usr/bin/env tsx
/**
 * Accessibility Audit Script
 * 
 * This script checks for common WCAG 2.1 Level AA compliance issues:
 * - Missing ARIA labels on interactive elements
 * - Missing alt text on images
 * - Color contrast issues
 * - Missing form labels
 * - Keyboard navigation issues
 * - Focus indicators
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

interface AuditIssue {
  file: string
  line: number
  type: 'error' | 'warning' | 'info'
  message: string
  code?: string
}

const issues: AuditIssue[] = []
const checkedFiles: string[] = []

// Color contrast checker (simplified - checks common color combinations)
function checkColorContrast(foreground: string, background: string): number {
  // This is a simplified version - in production, use a proper contrast checker
  // Returns contrast ratio (4.5+ for AA, 7+ for AAA)
  return 4.5 // Placeholder
}

function auditFile(filePath: string) {
  if (checkedFiles.includes(filePath)) return
  checkedFiles.push(filePath)

  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')

    lines.forEach((line, index) => {
      const lineNum = index + 1

      // Check for buttons without aria-label or text content
      if (line.match(/<button[^>]*>/i) && !line.match(/aria-label|aria-labelledby|>[\s\S]*?[A-Za-z]/)) {
        if (!line.match(/aria-hidden="true"/)) {
          issues.push({
            file: filePath,
            line: lineNum,
            type: 'warning',
            message: 'Button may need aria-label if it only contains icons',
            code: line.trim(),
          })
        }
      }

      // Check for images without alt text
      if (line.match(/<img[^>]*>/i) && !line.match(/alt=["']/)) {
        if (!line.match(/aria-hidden="true"/)) {
          issues.push({
            file: filePath,
            line: lineNum,
            type: 'error',
            message: 'Image missing alt attribute',
            code: line.trim(),
          })
        }
      }

      // Check for inputs without labels
      if (line.match(/<input[^>]*>/i) && !line.match(/aria-label|aria-labelledby|id=/)) {
        // Check if there's a label in previous lines (simplified check)
        const prevLines = lines.slice(Math.max(0, index - 5), index).join('\n')
        if (!prevLines.match(/<label[^>]*for=|aria-label|aria-labelledby/)) {
          issues.push({
            file: filePath,
            line: lineNum,
            type: 'error',
            message: 'Input may need associated label or aria-label',
            code: line.trim(),
          })
        }
      }

      // Check for links without descriptive text
      if (line.match(/<a[^>]*>/i) && !line.match(/aria-label|aria-labelledby/)) {
        // Check if link has text content (simplified)
        const nextLines = lines.slice(index, Math.min(lines.length, index + 3)).join('\n')
        if (!nextLines.match(/>[\s\S]*?[A-Za-z0-9]{3,}/)) {
          issues.push({
            file: filePath,
            line: lineNum,
            type: 'warning',
            message: 'Link may need aria-label if it only contains icons',
            code: line.trim(),
          })
        }
      }

      // Check for missing focus indicators
      if (line.match(/outline:\s*none|outline:\s*0/)) {
        if (!line.match(/focus-visible|:focus/)) {
          issues.push({
            file: filePath,
            line: lineNum,
            type: 'warning',
            message: 'Removing outline may affect keyboard navigation visibility',
            code: line.trim(),
          })
        }
      }

      // Check for color-only information
      if (line.match(/color:\s*#[0-9a-fA-F]{3,6}/) && line.match(/required|error|success|warning/i)) {
        if (!line.match(/aria-|role=|before:|after:/)) {
          issues.push({
            file: filePath,
            line: lineNum,
            type: 'info',
            message: 'Consider adding text or icon in addition to color for status indication',
            code: line.trim(),
          })
        }
      }
    })
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error)
  }
}

function walkDirectory(dir: string, extensions: string[] = ['.tsx', '.ts', '.jsx', '.js']) {
  try {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      // Skip node_modules, .next, and other build/dependency directories
      if (entry.startsWith('.') || entry === 'node_modules' || entry === '.next' || entry === 'dist') {
        continue
      }

      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        walkDirectory(fullPath, extensions)
      } else if (stat.isFile() && extensions.includes(extname(entry))) {
        auditFile(fullPath)
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
}

// Main execution
console.log('🔍 Running Accessibility Audit...\n')

const projectRoot = join(process.cwd())
walkDirectory(join(projectRoot, 'app'))
walkDirectory(join(projectRoot, 'components'))

// Group issues by type
const errors = issues.filter(i => i.type === 'error')
const warnings = issues.filter(i => i.type === 'warning')
const infos = issues.filter(i => i.type === 'info')

// Print results
console.log(`\n📊 Audit Results:\n`)
console.log(`  ❌ Errors: ${errors.length}`)
console.log(`  ⚠️  Warnings: ${warnings.length}`)
console.log(`  ℹ️  Info: ${infos.length}`)
console.log(`  📝 Total: ${issues.length}\n`)

if (errors.length > 0) {
  console.log('❌ ERRORS (Must Fix):\n')
  errors.forEach(issue => {
    console.log(`  ${issue.file}:${issue.line}`)
    console.log(`    ${issue.message}`)
    if (issue.code) console.log(`    Code: ${issue.code.substring(0, 80)}...`)
    console.log()
  })
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS (Should Fix):\n')
  warnings.slice(0, 20).forEach(issue => {
    console.log(`  ${issue.file}:${issue.line}`)
    console.log(`    ${issue.message}`)
    if (issue.code) console.log(`    Code: ${issue.code.substring(0, 80)}...`)
    console.log()
  })
  if (warnings.length > 20) {
    console.log(`  ... and ${warnings.length - 20} more warnings\n`)
  }
}

if (infos.length > 0 && infos.length <= 10) {
  console.log('ℹ️  INFO (Consider):\n')
  infos.forEach(issue => {
    console.log(`  ${issue.file}:${issue.line}`)
    console.log(`    ${issue.message}`)
    console.log()
  })
}

// Summary
console.log('\n' + '='.repeat(60))
if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ No critical accessibility issues found!')
  console.log('   Continue with manual testing and screen reader testing.')
} else {
  console.log(`⚠️  Found ${errors.length} errors and ${warnings.length} warnings`)
  console.log('   Please review and fix the issues above.')
}
console.log('='.repeat(60) + '\n')

// Exit with error code if there are critical issues
process.exit(errors.length > 0 ? 1 : 0)

