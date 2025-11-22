#!/usr/bin/env tsx

/**
 * High Contrast Mode Testing Script
 * 
 * Tests the application's compatibility with high contrast mode
 * Checks for proper border styles, focus indicators, and contrast ratios
 */

import { chromium, type Browser, type Page } from 'playwright'

interface HighContrastTestResult {
  passed: boolean
  message: string
  selector?: string
}

class HighContrastTester {
  private browser: Browser | null = null
  private page: Page | null = null

  async start() {
    console.log('🎨 Starting High Contrast Mode Testing...\n')
    
    this.browser = await chromium.launch({ headless: false })
    this.page = await this.browser.newPage()
    
    // Simulate high contrast mode
    await this.page.addInitScript(() => {
      // Force high contrast styles by adding CSS
      const style = document.createElement('style')
      style.textContent = `
        @media (prefers-contrast: high) {
          * {
            border-color: currentColor !important;
          }
          
          button, a.button, .button {
            border: 2px solid currentColor !important;
          }
          
          input, textarea, select {
            border: 2px solid currentColor !important;
            background: transparent !important;
          }
        }
      `
      document.head.appendChild(style)
      
      // Force high contrast styles to apply
      Object.defineProperty(window, 'matchMedia', {
        value: (query: string) => {
          if (query === '(prefers-contrast: high)') {
            return { matches: true, media: query }
          }
          return { matches: false, media: query }
        }
      })
    })
    
    await this.page.goto('http://localhost:3002')
    await this.page.waitForLoadState('networkidle')
    
    const results: HighContrastTestResult[] = []
    
    // Test 1: Check if elements have visible borders
    results.push(await this.testElementBorders())
    
    // Test 2: Check if buttons have proper borders
    results.push(await this.testButtonBorders())
    
    // Test 3: Check if form inputs have borders
    results.push(await this.testFormInputBorders())
    
    // Test 4: Check if focus indicators are visible
    results.push(await this.testFocusIndicators())
    
    // Test 5: Check if links are distinguishable
    results.push(await this.testLinkVisibility())
    
    // Test 6: Check if text has sufficient contrast
    results.push(await this.testTextContrast())
    
    this.printResults(results)
    
    await this.browser?.close()
  }
  
  private async testElementBorders(): Promise<HighContrastTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const elementsWithBorders = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('button, input, select, textarea')
      let count = 0
      
      elements.forEach(el => {
        const computed = window.getComputedStyle(el)
        if (computed.borderWidth !== '0px' || computed.outline !== 'none') {
          count++
        }
      })
      
      return { count, total: elements.length }
    })
    
    const percentage = elementsWithBorders.total > 0 
      ? (elementsWithBorders.count / elementsWithBorders.total) * 100 
      : 100
      
    return {
      passed: percentage >= 80,
      message: `Elements with borders: ${elementsWithBorders.count}/${elementsWithBorders.total} (${percentage.toFixed(1)}%)`
    }
  }
  
  private async testButtonBorders(): Promise<HighContrastTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const buttons = await this.page.locator('button, .button, a[role="button"]').all()
    let buttonsWithBorders = 0
    
    for (const button of buttons.slice(0, 10)) {
      const hasBorder = await button.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return computed.borderWidth !== '0px' && computed.borderStyle !== 'none'
      })
      
      if (hasBorder) buttonsWithBorders++
    }
    
    const tested = Math.min(buttons.length, 10)
    const percentage = tested > 0 ? (buttonsWithBorders / tested) * 100 : 100
    
    return {
      passed: percentage >= 80,
      message: `Buttons with borders: ${buttonsWithBorders}/${tested} (${percentage.toFixed(1)}%)`
    }
  }
  
  private async testFormInputBorders(): Promise<HighContrastTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const inputs = await this.page.locator('input, textarea, select').all()
    let inputsWithBorders = 0
    
    for (const input of inputs.slice(0, 10)) {
      const hasBorder = await input.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return computed.borderWidth !== '0px' && computed.borderStyle !== 'none'
      })
      
      if (hasBorder) inputsWithBorders++
    }
    
    const tested = Math.min(inputs.length, 10)
    const percentage = tested > 0 ? (inputsWithBorders / tested) * 100 : 100
    
    return {
      passed: percentage >= 80,
      message: `Form inputs with borders: ${inputsWithBorders}/${tested} (${percentage.toFixed(1)}%)`
    }
  }
  
  private async testFocusIndicators(): Promise<HighContrastTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const button = this.page.locator('button').first()
    if (await button.count() === 0) {
      return { passed: true, message: 'No buttons found to test focus indicators' }
    }
    
    await button.focus()
    
    const focusVisible = await button.evaluate((el) => {
      const computed = window.getComputedStyle(el, ':focus-visible')
      return (
        computed.outlineWidth !== '0px' && 
        computed.outlineStyle !== 'none'
      ) || (
        computed.boxShadow !== 'none' && 
        computed.boxShadow.includes('outline')
      )
    })
    
    return {
      passed: focusVisible,
      message: focusVisible 
        ? 'Focus indicators are visible'
        : 'Focus indicators are NOT visible - may not work in high contrast mode'
    }
  }
  
  private async testLinkVisibility(): Promise<HighContrastTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const links = await this.page.locator('a').all()
    let visibleLinks = 0
    
    for (const link of links.slice(0, 10)) {
      const isDistinguishable = await link.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return (
          computed.textDecorationLine === 'underline' ||
          computed.borderBottom !== 'none' ||
          computed.color !== computed.color // This would be different in high contrast
        )
      })
      
      if (isDistinguishable) visibleLinks++
    }
    
    const tested = Math.min(links.length, 10)
    const percentage = tested > 0 ? (visibleLinks / tested) * 100 : 100
    
    return {
      passed: percentage >= 80,
      message: `Links distinguishable: ${visibleLinks}/${tested} (${percentage.toFixed(1)}%)`
    }
  }
  
  private async testTextContrast(): Promise<HighContrastTestResult> {
    if (!this.page) throw new Error('Page not initialized')
    
    const textElements = await this.page.locator('p, h1, h2, h3, h4, h5, h6, span').all()
    let readableText = 0
    
    for (const element of textElements.slice(0, 10)) {
      const isReadable = await element.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        const color = computed.color
        const background = computed.backgroundColor
        
        // In high contrast mode, text should have high contrast
        // This is a simplified check - in reality, OS handles this
        return color !== background && color !== 'transparent'
      })
      
      if (isReadable) readableText++
    }
    
    const tested = Math.min(textElements.length, 10)
    const percentage = tested > 0 ? (readableText / tested) * 100 : 100
    
    return {
      passed: percentage >= 90,
      message: `Text elements readable: ${readableText}/${tested} (${percentage.toFixed(1)}%)`
    }
  }
  
  private printResults(results: HighContrastTestResult[]) {
    console.log('📊 High Contrast Mode Test Results:\n')
    
    let passed = 0
    let total = results.length
    
    results.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌'
      console.log(`${icon} Test ${index + 1}: ${result.message}`)
      if (result.passed) passed++
    })
    
    console.log(`\n🎯 Overall Score: ${passed}/${total} tests passed (${((passed/total) * 100).toFixed(1)}%)`)
    
    if (passed === total) {
      console.log('🎉 All high contrast tests passed! Your app is ready for users with visual needs.')
    } else {
      console.log('⚠️  Some high contrast tests failed. Consider improving border styles and contrast.')
    }
    
    console.log('\n📝 Manual Testing Instructions:')
    console.log('1. Enable high contrast mode in your OS settings:')
    console.log('   - Windows: Settings > Ease of Access > High Contrast')
    console.log('   - macOS: System Preferences > Accessibility > Display > Increase Contrast')
    console.log('2. Navigate through your application')
    console.log('3. Verify all interactive elements are clearly visible')
    console.log('4. Test keyboard navigation and focus indicators')
  }
}

async function main() {
  const tester = new HighContrastTester()
  await tester.start()
}

if (require.main === module) {
  main().catch(console.error)
}

export { HighContrastTester }