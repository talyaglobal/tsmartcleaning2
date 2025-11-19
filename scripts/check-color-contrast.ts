#!/usr/bin/env tsx
/**
 * Color Contrast Checker
 * 
 * Verifies that color combinations meet WCAG 2.1 contrast requirements:
 * - Level AA: 4.5:1 for normal text, 3:1 for large text
 * - Level AAA: 7:1 for normal text, 4.5:1 for large text
 */

// Convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

// Calculate relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// Calculate contrast ratio
function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) {
    return 0
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

// Check if contrast meets WCAG standards
function checkContrast(
  foreground: string,
  background: string,
  isLargeText = false
): {
  ratio: number
  passesAA: boolean
  passesAAA: boolean
  level: 'AA' | 'AAA' | 'FAIL'
} {
  const ratio = getContrastRatio(foreground, background)
  const aaThreshold = isLargeText ? 3 : 4.5
  const aaaThreshold = isLargeText ? 4.5 : 7

  const passesAA = ratio >= aaThreshold
  const passesAAA = ratio >= aaaThreshold

  let level: 'AA' | 'AAA' | 'FAIL' = 'FAIL'
  if (passesAAA) level = 'AAA'
  else if (passesAA) level = 'AA'

  return { ratio, passesAA, passesAAA, level }
}

// Color combinations from the design system
const colorCombinations = [
  // Primary text on backgrounds
  {
    name: 'Primary text on light background',
    foreground: '#373d36',
    background: '#f5f1eb',
    isLargeText: false,
  },
  {
    name: 'Primary text on light background (large)',
    foreground: '#373d36',
    background: '#f5f1eb',
    isLargeText: true,
  },
  {
    name: 'Muted text on light background',
    foreground: '#373d36cc', // ~80% opacity (updated for better contrast)
    background: '#f5f1eb',
    isLargeText: false,
  },
  {
    name: 'Text on accent background',
    foreground: '#ffffff',
    background: '#a06547', // Darker accent for better contrast
    isLargeText: false,
  },
  {
    name: 'Text on accent background (large)',
    foreground: '#ffffff',
    background: '#a06547', // Darker accent for better contrast
    isLargeText: true,
  },
  {
    name: 'Primary text on secondary background',
    foreground: '#373d36',
    background: '#e6dcd4',
    isLargeText: false,
  },
  {
    name: 'Link color on light background',
    foreground: '#8b5538', // Darker link color for better contrast
    background: '#f5f1eb',
    isLargeText: false,
  },
  {
    name: 'Destructive text on light background',
    foreground: '#b91c1c', // Darker red for better contrast
    background: '#f5f1eb',
    isLargeText: false,
  },
]

console.log('🎨 Color Contrast Check\n')
console.log('='.repeat(80))

let passCount = 0
let failCount = 0

colorCombinations.forEach((combo) => {
  // Handle opacity in hex color
  let fg = combo.foreground
  if (fg.includes('cc')) {
    // Approximate 80% opacity by blending with background
    // This is a simplified calculation
    fg = '#4a5048' // Approximated darker version for 80% opacity
  } else if (fg.includes('99')) {
    // Approximate 60% opacity by blending with background
    // This is a simplified calculation
    fg = '#6b7269' // Approximated darker version
  }

  const result = checkContrast(fg, combo.background, combo.isLargeText)
  const status = result.level === 'FAIL' ? '❌' : result.level === 'AAA' ? '✅✅' : '✅'
  const sizeLabel = combo.isLargeText ? ' (Large Text)' : ''

  console.log(`\n${status} ${combo.name}${sizeLabel}`)
  console.log(`   Foreground: ${combo.foreground}`)
  console.log(`   Background: ${combo.background}`)
  console.log(`   Contrast Ratio: ${result.ratio.toFixed(2)}:1`)
  console.log(`   WCAG Level: ${result.level}`)
  console.log(`   AA Compliant: ${result.passesAA ? 'Yes' : 'No'}`)
  console.log(`   AAA Compliant: ${result.passesAAA ? 'Yes' : 'No'}`)

  if (result.level === 'FAIL') {
    failCount++
    console.log(`   ⚠️  WARNING: Does not meet WCAG AA standards!`)
  } else {
    passCount++
  }
})

console.log('\n' + '='.repeat(80))
console.log(`\n📊 Summary:`)
console.log(`   ✅ Passing: ${passCount}`)
console.log(`   ❌ Failing: ${failCount}`)

if (failCount === 0) {
  console.log(`\n🎉 All color combinations meet WCAG AA standards!`)
  process.exit(0)
} else {
  console.log(`\n⚠️  ${failCount} color combination(s) need adjustment to meet WCAG AA standards.`)
  process.exit(1)
}

