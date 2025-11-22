#!/usr/bin/env tsx

/**
 * Screen Reader Compatibility Test Script
 * 
 * Tests the application for screen reader accessibility
 * Checks semantic HTML, ARIA attributes, labels, and heading structure
 */

import { chromium, type Browser, type Page } from 'playwright'

interface ScreenReaderTestResult {
  passed: boolean
  message: string
  details?: string[]
  severity: 'error' | 'warning' | 'info'
}

class ScreenReaderTester {
  private browser: Browser | null = null
  private page: Page | null = null

  async start() {
    console.log('🔊 Starting Screen Reader Compatibility Testing...\n')
    
    this.browser = await chromium.launch({ headless: true })
    this.page = await this.browser.newPage()
    
    await this.page.goto('http://localhost:3002')
    await this.page.waitForLoadState('networkidle')
    
    const results: ScreenReaderTestResult[] = []
    
    // Test 1: Check heading hierarchy
    results.push(await this.testHeadingHierarchy())
    
    // Test 2: Check for proper landmarks
    results.push(await this.testLandmarks())
    
    // Test 3: Check image alt text
    results.push(await this.testImageAltText())
    
    // Test 4: Check form labels
    results.push(await this.testFormLabels())
    
    // Test 5: Check button accessibility
    results.push(await this.testButtonAccessibility())
    
    // Test 6: Check link descriptions
    results.push(await this.testLinkDescriptions())
    
    // Test 7: Check ARIA attributes
    results.push(await this.testAriaAttributes())
    
    // Test 8: Check focus management
    results.push(await this.testFocusManagement())
    
    // Test 9: Check live regions
    results.push(await this.testLiveRegions())
    
    this.printResults(results)
    
    await this.browser?.close()
  }
  
  private async testHeadingHierarchy(): Promise<ScreenReaderTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const headingInfo = await this.page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      const levels = headings.map(h => parseInt(h.tagName.charAt(1)))
      const h1Count = headings.filter(h => h.tagName === 'H1').length
      
      let hierarchyErrors: string[] = []
      
      // Check if there's at least one H1
      if (h1Count === 0) {
        hierarchyErrors.push('No H1 heading found')
      } else if (h1Count > 1) {
        hierarchyErrors.push(`Multiple H1 headings found (${h1Count})`)
      }
      
      // Check heading sequence
      for (let i = 1; i < levels.length; i++) {
        const current = levels[i]
        const previous = levels[i - 1]
        if (current > previous + 1) {
          hierarchyErrors.push(`Heading level jumps from H${previous} to H${current}`)
        }
      }
      
      return {
        totalHeadings: headings.length,
        h1Count,
        levels,
        errors: hierarchyErrors
      }
    })
    
    return {
      passed: headingInfo.errors.length === 0 && headingInfo.h1Count === 1,
      message: `Heading hierarchy: ${headingInfo.totalHeadings} headings, ${headingInfo.h1Count} H1`,
      details: headingInfo.errors,
      severity: headingInfo.errors.length > 0 ? 'error' : 'info'
    }
  }
  
  private async testLandmarks(): Promise<ScreenReaderTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const landmarks = await this.page.evaluate(() => {
      const nav = document.querySelectorAll('nav, [role="navigation"]').length
      const main = document.querySelectorAll('main, [role="main"]').length
      const header = document.querySelectorAll('header, [role="banner"]').length
      const footer = document.querySelectorAll('footer, [role="contentinfo"]').length
      
      return { nav, main, header, footer }
    })
    
    const missing: string[] = []
    if (landmarks.nav === 0) missing.push('navigation')
    if (landmarks.main === 0) missing.push('main content')
    if (landmarks.header === 0) missing.push('header/banner')
    if (landmarks.footer === 0) missing.push('footer')
    
    return {
      passed: missing.length === 0,
      message: `Landmarks: nav(${landmarks.nav}) main(${landmarks.main}) header(${landmarks.header}) footer(${landmarks.footer})`,
      details: missing.length > 0 ? [`Missing landmarks: ${missing.join(', ')}`] : undefined,
      severity: missing.includes('main content') ? 'error' : 'warning'
    }
  }
  
  private async testImageAltText(): Promise<ScreenReaderTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const imageInfo = await this.page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'))
      const withoutAlt: string[] = []
      const decorative = images.filter(img => 
        img.getAttribute('alt') === '' || 
        img.getAttribute('role') === 'presentation' ||
        img.getAttribute('aria-hidden') === 'true'
      ).length
      
      images.forEach((img, index) => {
        const alt = img.getAttribute('alt')
        const ariaHidden = img.getAttribute('aria-hidden') === 'true'
        const rolePresentation = img.getAttribute('role') === 'presentation'
        
        if (alt === null && !ariaHidden && !rolePresentation) {
          withoutAlt.push(`Image ${index + 1}: ${img.src.substring(img.src.lastIndexOf('/') + 1)}`)
        }
      })
      
      return {
        total: images.length,
        withoutAlt,
        decorative
      }
    })
    
    return {
      passed: imageInfo.withoutAlt.length === 0,
      message: `Images: ${imageInfo.total} total, ${imageInfo.withoutAlt.length} missing alt text, ${imageInfo.decorative} decorative`,
      details: imageInfo.withoutAlt.length > 0 ? imageInfo.withoutAlt : undefined,
      severity: imageInfo.withoutAlt.length > 0 ? 'error' : 'info'
    }
  }
  
  private async testFormLabels(): Promise<ScreenReaderTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const formInfo = await this.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'))
      const withoutLabels: string[] = []
      
      inputs.forEach((input, index) => {
        const id = input.id
        const ariaLabel = input.getAttribute('aria-label')
        const ariaLabelledBy = input.getAttribute('aria-labelledby')
        const placeholder = input.getAttribute('placeholder')
        
        let hasLabel = false
        
        // Check for aria-label or aria-labelledby
        if (ariaLabel || ariaLabelledBy) {
          hasLabel = true
        }
        
        // Check for associated label
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`)
          if (label) hasLabel = true
        }
        
        // Check if input is inside a label
        const parentLabel = input.closest('label')
        if (parentLabel) hasLabel = true
        
        if (!hasLabel) {
          const inputType = input.tagName.toLowerCase() + (input.getAttribute('type') ? `[${input.getAttribute('type')}]` : '')
          withoutLabels.push(`${inputType} ${index + 1}${placeholder ? ` (placeholder: "${placeholder}")` : ''}`)
        }
      })
      
      return {
        total: inputs.length,
        withoutLabels
      }
    })
    
    return {
      passed: formInfo.withoutLabels.length === 0,
      message: `Form inputs: ${formInfo.total} total, ${formInfo.withoutLabels.length} without proper labels`,
      details: formInfo.withoutLabels.length > 0 ? formInfo.withoutLabels : undefined,
      severity: formInfo.withoutLabels.length > 0 ? 'error' : 'info'
    }
  }
  
  private async testButtonAccessibility(): Promise<ScreenReaderTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const buttonInfo = await this.page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
      const withoutText: string[] = []
      
      buttons.forEach((button, index) => {
        const textContent = button.textContent?.trim()
        const ariaLabel = button.getAttribute('aria-label')
        const ariaLabelledBy = button.getAttribute('aria-labelledby')
        
        if (!textContent && !ariaLabel && !ariaLabelledBy) {
          withoutText.push(`Button ${index + 1}`)
        }
      })
      
      return {
        total: buttons.length,
        withoutText
      }
    })
    
    return {
      passed: buttonInfo.withoutText.length === 0,
      message: `Buttons: ${buttonInfo.total} total, ${buttonInfo.withoutText.length} without accessible names`,
      details: buttonInfo.withoutText.length > 0 ? buttonInfo.withoutText : undefined,
      severity: buttonInfo.withoutText.length > 0 ? 'error' : 'info'
    }
  }
  
  private async testLinkDescriptions(): Promise<ScreenReaderTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const linkInfo = await this.page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'))
      const genericText = ['click here', 'read more', 'learn more', 'here', 'more']
      const poorLinks: string[] = []
      
      links.forEach((link, index) => {
        const text = link.textContent?.trim().toLowerCase() || ''
        const ariaLabel = link.getAttribute('aria-label')
        
        if (!text && !ariaLabel) {
          poorLinks.push(`Link ${index + 1}: No text or aria-label`)
        } else if (genericText.includes(text)) {
          poorLinks.push(`Link ${index + 1}: Generic text "${text}"`)
        }
      })
      
      return {
        total: links.length,
        poorLinks
      }
    })
    
    return {
      passed: linkInfo.poorLinks.length === 0,
      message: `Links: ${linkInfo.total} total, ${linkInfo.poorLinks.length} with poor descriptions`,
      details: linkInfo.poorLinks.length > 0 ? linkInfo.poorLinks : undefined,
      severity: linkInfo.poorLinks.length > 0 ? 'warning' : 'info'
    }
  }
  
  private async testAriaAttributes(): Promise<ScreenReaderTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const ariaInfo = await this.page.evaluate(() => {
      const interactiveElements = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"]'))
      const ariaIssues: string[] = []
      
      interactiveElements.forEach((element, index) => {
        const role = element.getAttribute('role')
        const ariaExpanded = element.getAttribute('aria-expanded')
        const ariaHaspopup = element.getAttribute('aria-haspopup')
        
        // Check for dropdowns without ARIA
        if (element.classList.contains('dropdown') || element.classList.contains('w-dropdown-toggle')) {
          if (!ariaExpanded && !ariaHaspopup) {
            ariaIssues.push(`Dropdown ${index + 1}: Missing aria-expanded or aria-haspopup`)
          }
        }
      })
      
      return {
        total: interactiveElements.length,
        issues: ariaIssues
      }
    })
    
    return {
      passed: ariaInfo.issues.length === 0,
      message: `ARIA attributes: ${ariaInfo.total} elements checked, ${ariaInfo.issues.length} issues`,
      details: ariaInfo.issues.length > 0 ? ariaInfo.issues : undefined,
      severity: ariaInfo.issues.length > 0 ? 'warning' : 'info'
    }
  }
  
  private async testFocusManagement(): Promise<ScreenReaderTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const focusInfo = await this.page.evaluate(() => {
      const skipLink = document.querySelector('a[href="#main"]')
      const mainElement = document.querySelector('#main, main, [role="main"]')
      
      return {
        hasSkipLink: !!skipLink,
        hasMainTarget: !!mainElement,
        skipLinkVisible: skipLink ? window.getComputedStyle(skipLink).display !== 'none' : false
      }
    })
    
    const issues: string[] = []
    if (!focusInfo.hasSkipLink) issues.push('No skip link found')
    if (!focusInfo.hasMainTarget) issues.push('No main content target found')
    if (focusInfo.hasSkipLink && !focusInfo.skipLinkVisible) issues.push('Skip link is not properly visible on focus')
    
    return {
      passed: issues.length === 0,
      message: `Focus management: Skip link(${focusInfo.hasSkipLink}), Main target(${focusInfo.hasMainTarget})`,
      details: issues.length > 0 ? issues : undefined,
      severity: issues.length > 0 ? 'error' : 'info'
    }
  }
  
  private async testLiveRegions(): Promise<ScreenReaderTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const liveRegions = await this.page.evaluate(() => {
      const regions = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]')
      return regions.length
    })
    
    return {
      passed: true, // Live regions are optional but good practice
      message: `Live regions: ${liveRegions} found`,
      details: liveRegions === 0 ? ['Consider adding live regions for dynamic content updates'] : undefined,
      severity: 'info'
    }
  }
  
  private printResults(results: ScreenReaderTestResult[]) {
    console.log('📊 Screen Reader Compatibility Test Results:\n')
    
    let errors = 0
    let warnings = 0
    let passed = 0
    
    results.forEach((result, index) => {
      let icon = ''
      switch (result.severity) {
        case 'error':
          icon = result.passed ? '✅' : '❌'
          if (!result.passed) errors++
          break
        case 'warning':
          icon = result.passed ? '✅' : '⚠️'
          if (!result.passed) warnings++
          break
        case 'info':
          icon = '📝'
          break
      }
      
      if (result.passed) passed++
      
      console.log(`${icon} Test ${index + 1}: ${result.message}`)
      
      if (result.details && result.details.length > 0) {
        result.details.forEach(detail => {
          console.log(`   → ${detail}`)
        })
      }
    })
    
    console.log(`\n🎯 Summary:`)
    console.log(`   ✅ Passed: ${passed}/${results.length} tests`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log(`   ⚠️  Warnings: ${warnings}`)
    
    if (errors === 0 && warnings === 0) {
      console.log('\n🎉 Excellent! Your app is highly compatible with screen readers.')
    } else if (errors === 0) {
      console.log('\n✨ Good! Minor improvements needed for optimal screen reader experience.')
    } else {
      console.log('\n🔧 Action needed! Critical accessibility issues must be fixed.')
    }
    
    console.log('\n📝 Manual Testing Instructions:')
    console.log('1. Test with actual screen readers:')
    console.log('   - NVDA (Windows, free): https://www.nvaccess.org/download/')
    console.log('   - JAWS (Windows, paid trial): https://www.freedomscientific.com/products/software/jaws/')
    console.log('   - VoiceOver (macOS/iOS, built-in): Cmd+F5 to enable')
    console.log('   - TalkBack (Android, built-in): Settings > Accessibility')
    console.log('2. Navigate using only keyboard and screen reader')
    console.log('3. Test form filling and submission')
    console.log('4. Test interactive elements like dropdowns and modals')
  }
}

async function main() {
  const tester = new ScreenReaderTester()
  await tester.start()
}

if (require.main === module) {
  main().catch(console.error)
}

export { ScreenReaderTester }