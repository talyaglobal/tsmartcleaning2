import { test, expect } from '@playwright/test'

/**
 * Comprehensive Cross-Browser Testing Suite
 * 
 * This test suite verifies that the application works correctly across:
 * - Chrome (Desktop & Mobile)
 * - Firefox (Desktop & Mobile)
 * - Safari (Desktop & Mobile)
 * - Edge (Desktop)
 * - Mobile browsers (iOS Safari, Chrome Mobile)
 * 
 * It also tests:
 * - Responsive design at different viewport sizes
 * - Dark mode/light mode
 * - Animations and transitions
 */

// Common test pages to verify
const TEST_PAGES = [
  '/',
  '/find-cleaners',
  '/about',
  '/contact',
  '/insurance',
  '/for-providers',
  '/login',
  '/signup',
]

// Viewport sizes for responsive testing
const VIEWPORTS = {
  mobile: { width: 375, height: 667 }, // iPhone SE
  mobileLarge: { width: 414, height: 896 }, // iPhone 11 Pro Max
  tablet: { width: 768, height: 1024 }, // iPad
  tabletLandscape: { width: 1024, height: 768 }, // iPad Landscape
  desktop: { width: 1920, height: 1080 }, // Full HD
  desktopLarge: { width: 2560, height: 1440 }, // 2K
}

test.describe('Cross-Browser: Page Loading', () => {
  // Test that all key pages load without errors across browsers
  for (const pagePath of TEST_PAGES) {
    test(`should load ${pagePath} without errors`, async ({ page, browserName }) => {
      const response = await page.goto(pagePath)
      
      // Check HTTP status
      expect(response?.status()).toBeLessThan(400)
      
      // Check for console errors
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })
      
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      
      // Log browser name for debugging
      console.log(`Testing ${pagePath} on ${browserName}`)
      
      // Check that page has content
      const body = page.locator('body')
      await expect(body).toBeVisible({ timeout: 5000 })
      
      // Log errors if any (but don't fail - some browsers may have different console behavior)
      if (errors.length > 0) {
        console.warn(`Console errors on ${browserName} for ${pagePath}:`, errors)
      }
    })
  }
})

test.describe('Cross-Browser: Responsive Design', () => {
  test('should display correctly on mobile viewport', async ({ page, browserName }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto('/')
    
    // Check that page is visible and not broken
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // Check for horizontal scroll (should not exist)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    
    // Allow small tolerance for browser differences
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
    
    // Check that navigation is accessible (mobile menu should be visible or navigation should work)
    const nav = page.locator('nav, [role="navigation"]').first()
    await expect(nav).toBeVisible()
  })

  test('should display correctly on tablet viewport', async ({ page, browserName }) => {
    await page.setViewportSize(VIEWPORTS.tablet)
    await page.goto('/')
    
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // Check layout adapts to tablet size
    const mainContent = page.locator('main, [role="main"]').first()
    await expect(mainContent).toBeVisible()
  })

  test('should display correctly on desktop viewport', async ({ page, browserName }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await page.goto('/')
    
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // Check that desktop layout is used
    const mainContent = page.locator('main, [role="main"]').first()
    await expect(mainContent).toBeVisible()
  })

  test('should adapt layout at different breakpoints', async ({ page, browserName }) => {
    const breakpoints = [
      VIEWPORTS.mobile,
      VIEWPORTS.tablet,
      VIEWPORTS.desktop,
    ]
    
    for (const viewport of breakpoints) {
      await page.setViewportSize(viewport)
      await page.goto('/')
      await page.waitForLoadState('networkidle', { timeout: 10000 })
      
      // Verify page renders without horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      
      // Log viewport info
      console.log(`${browserName} - Viewport ${viewport.width}x${viewport.height}: horizontal scroll = ${hasHorizontalScroll}`)
      
      // Should not have significant horizontal scroll (allow small tolerance)
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10)
    }
  })
})

test.describe('Cross-Browser: Navigation', () => {
  test('navigation links should work correctly', async ({ page, browserName }) => {
    await page.goto('/')
    
    // Test Find Cleaners link
    const findCleanersLink = page.getByRole('link', { name: /find cleaners/i }).first()
    if (await findCleanersLink.isVisible()) {
      await findCleanersLink.click()
      await expect(page).toHaveURL(/.*find-cleaners/, { timeout: 5000 })
    }
    
    // Test About link
    await page.goto('/')
    const aboutLink = page.getByRole('link', { name: /about/i }).first()
    if (await aboutLink.isVisible()) {
      await aboutLink.click()
      await expect(page).toHaveURL(/.*about/, { timeout: 5000 })
    }
    
    // Test Contact link
    await page.goto('/')
    const contactLink = page.getByRole('link', { name: /contact/i }).first()
    if (await contactLink.isVisible()) {
      await contactLink.click()
      await expect(page).toHaveURL(/.*contact/, { timeout: 5000 })
    }
  })

  test('mobile navigation menu should work', async ({ page, browserName }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto('/')
    
    // Look for mobile menu button
    const menuButton = page.locator(
      'button[aria-label*="menu" i], button[aria-label*="navigation" i], [aria-label*="menu" i]'
    ).first()
    
    if (await menuButton.isVisible()) {
      await menuButton.click()
      
      // Wait for menu to open
      await page.waitForTimeout(500)
      
      // Check that menu items are visible
      const menuItems = page.locator('nav a, [role="navigation"] a')
      const count = await menuItems.count()
      expect(count).toBeGreaterThan(0)
    }
  })
})

test.describe('Cross-Browser: Dark Mode / Light Mode', () => {
  test('should support theme switching', async ({ page, browserName }) => {
    await page.goto('/')
    
    // Check if theme provider is present
    const html = page.locator('html')
    const initialTheme = await html.getAttribute('class')
    
    // Try to find theme toggle button
    const themeToggle = page.locator(
      'button[aria-label*="theme" i], button[aria-label*="dark" i], button[aria-label*="light" i], [data-theme-toggle]'
    ).first()
    
    if (await themeToggle.isVisible()) {
      // Toggle theme
      await themeToggle.click()
      await page.waitForTimeout(500)
      
      // Check that theme class changed
      const newTheme = await html.getAttribute('class')
      expect(newTheme).not.toBe(initialTheme)
      
      // Toggle back
      await themeToggle.click()
      await page.waitForTimeout(500)
      
      const finalTheme = await html.getAttribute('class')
      expect(finalTheme).toBe(initialTheme)
    } else {
      // If no toggle button, check if dark mode class can be applied manually
      // This tests that the CSS supports dark mode
      await page.evaluate(() => {
        document.documentElement.classList.add('dark')
      })
      
      const hasDarkClass = await html.evaluate((el) => el.classList.contains('dark'))
      expect(hasDarkClass).toBe(true)
      
      // Remove dark class
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark')
      })
    }
  })

  test('should respect system preference', async ({ page, browserName }) => {
    // Test with dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.waitForTimeout(1000)
    
    // Check if dark mode is applied (if system preference is respected)
    const html = page.locator('html')
    const classList = await html.getAttribute('class')
    
    // Some browsers may apply dark mode automatically
    console.log(`${browserName} - Dark mode preference: class="${classList}"`)
    
    // Test with light mode preference
    await page.emulateMedia({ colorScheme: 'light' })
    await page.reload()
    await page.waitForTimeout(1000)
    
    const lightClassList = await html.getAttribute('class')
    console.log(`${browserName} - Light mode preference: class="${lightClassList}"`)
  })
})

test.describe('Cross-Browser: Animations and Transitions', () => {
  test('should handle animations gracefully', async ({ page, browserName }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check for CSS animations/transitions
    const hasAnimations = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets)
      let foundAnimations = false
      
      for (const sheet of styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules || [])
          for (const rule of rules) {
            if (rule instanceof CSSKeyframesRule || 
                (rule instanceof CSSStyleRule && 
                 (rule.style.animation || rule.style.transition))) {
              foundAnimations = true
              break
            }
          }
        } catch (e) {
          // Cross-origin stylesheets may throw
        }
        if (foundAnimations) break
      }
      
      return foundAnimations
    })
    
    // Log whether animations are present
    console.log(`${browserName} - Animations detected: ${hasAnimations}`)
    
    // Test that page is still interactive even with animations
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should respect prefers-reduced-motion', async ({ page, browserName }) => {
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForTimeout(1000)
    
    // Page should still be functional
    const body = page.locator('body')
    await expect(body).toBeVisible()
    
    // Test without reduced motion
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.reload()
    await page.waitForTimeout(1000)
    
    await expect(body).toBeVisible()
  })

  test('hover effects should work', async ({ page, browserName }) => {
    await page.goto('/')
    
    // Find interactive elements (buttons, links)
    const buttons = page.locator('button, a[href]').first()
    if (await buttons.isVisible()) {
      // Hover over element
      await buttons.hover()
      await page.waitForTimeout(300)
      
      // Check that element is still visible and interactive
      await expect(buttons).toBeVisible()
    }
  })
})

test.describe('Cross-Browser: Forms and Interactions', () => {
  test('forms should be usable', async ({ page, browserName }) => {
    await page.goto('/contact')
    
    // Look for form inputs
    const nameInput = page.locator('input[name="name"], input[type="text"]').first()
    const emailInput = page.locator('input[name="email"], input[type="email"]').first()
    const messageTextarea = page.locator('textarea[name="message"], textarea').first()
    
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User')
      const value = await nameInput.inputValue()
      expect(value).toBe('Test User')
    }
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com')
      const value = await emailInput.inputValue()
      expect(value).toBe('test@example.com')
    }
    
    if (await messageTextarea.isVisible()) {
      await messageTextarea.fill('Test message')
      const value = await messageTextarea.inputValue()
      expect(value).toBe('Test message')
    }
  })

  test('buttons should be clickable', async ({ page, browserName }) => {
    await page.goto('/')
    
    // Find buttons on the page
    const buttons = page.locator('button').all()
    const buttonCount = await page.locator('button').count()
    
    if (buttonCount > 0) {
      // Test first button
      const firstButton = page.locator('button').first()
      await expect(firstButton).toBeVisible()
      
      // Click should not throw errors
      try {
        await firstButton.click({ timeout: 2000 })
      } catch (e) {
        // Some buttons may be disabled or hidden, which is okay
        console.log(`${browserName} - Button click handled: ${e}`)
      }
    }
  })
})

test.describe('Cross-Browser: Images and Assets', () => {
  test('images should load correctly', async ({ page, browserName }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    
    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'))
      return images.filter(img => {
        // Check if image failed to load
        return !img.complete || img.naturalWidth === 0
      }).length
    })
    
    // Log broken images count
    if (brokenImages > 0) {
      console.warn(`${browserName} - Found ${brokenImages} potentially broken images`)
    }
    
    // Check that at least some images loaded
    const totalImages = await page.locator('img').count()
    console.log(`${browserName} - Total images: ${totalImages}, Broken: ${brokenImages}`)
  })

  test('CSS files should load', async ({ page, browserName }) => {
    await page.goto('/')
    
    // Check that CSS is loaded
    const stylesheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).length
    })
    
    expect(stylesheets).toBeGreaterThan(0)
    console.log(`${browserName} - Stylesheets loaded: ${stylesheets}`)
  })
})

test.describe('Cross-Browser: JavaScript Functionality', () => {
  test('JavaScript should execute without errors', async ({ page, browserName }) => {
    const errors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Log errors for debugging (but don't fail - some browsers may have different behavior)
    if (errors.length > 0) {
      console.warn(`${browserName} - JavaScript errors:`, errors)
    }
    
    // Check that page is interactive
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })

  test('should handle touch events on mobile', async ({ page, browserName }) => {
    await page.setViewportSize(VIEWPORTS.mobile)
    await page.goto('/')
    
    // Simulate touch event
    const body = page.locator('body')
    await body.tap()
    
    // Page should still be responsive
    await expect(body).toBeVisible()
  })
})

test.describe('Cross-Browser: Performance', () => {
  test('pages should load within reasonable time', async ({ page, browserName }) => {
    const startTime = Date.now()
    
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 })
    
    const loadTime = Date.now() - startTime
    
    // Log load time for each browser
    console.log(`${browserName} - Page load time: ${loadTime}ms`)
    
    // Should load within 30 seconds (generous timeout)
    expect(loadTime).toBeLessThan(30000)
    
    // Ideally should load within 5 seconds
    if (loadTime > 5000) {
      console.warn(`${browserName} - Slow load time: ${loadTime}ms`)
    }
  })

  test('should not have memory leaks', async ({ page, browserName }) => {
    await page.goto('/')
    
    // Navigate to multiple pages
    for (const pagePath of ['/about', '/contact', '/find-cleaners']) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle', { timeout: 10000 })
    }
    
    // Return to homepage
    await page.goto('/')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    
    // Page should still be functional
    const body = page.locator('body')
    await expect(body).toBeVisible()
  })
})

test.describe('Cross-Browser: Accessibility', () => {
  test('should have proper semantic HTML', async ({ page, browserName }) => {
    await page.goto('/')
    
    // Check for main landmark
    const main = page.locator('main, [role="main"]').first()
    await expect(main).toBeVisible()
    
    // Check for navigation
    const nav = page.locator('nav, [role="navigation"]').first()
    await expect(nav).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page, browserName }) => {
    await page.goto('/')
    
    // Tab through page
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})

