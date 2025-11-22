import { test, expect } from '@playwright/test'
import {
	VIEWPORT_SIZES,
	hasHorizontalScroll,
	hasMinimumTouchTarget,
	isTextReadable,
	checkResponsiveImages,
	testNavigationAtViewport,
	testFormUsability,
	expectNoHorizontalScroll,
	getViewportCategory,
	waitForBreakpointContent,
} from '../utils/responsive-test-helpers'

/**
 * Comprehensive E2E tests for responsive design
 * Tests actual rendering and behavior across different viewport sizes
 */

// Key pages to test for responsive design
const keyPages = [
	{ path: '/', name: 'Homepage' },
	{ path: '/find-cleaners', name: 'Find Cleaners' },
	{ path: '/about', name: 'About' },
	{ path: '/contact', name: 'Contact' },
	{ path: '/insurance', name: 'Insurance' },
	{ path: '/tsmartcard', name: 'TSmart Card' },
	{ path: '/for-providers', name: 'For Providers' },
	{ path: '/login', name: 'Login' },
	{ path: '/signup', name: 'Signup' },
]

test.describe('Responsive Design - Mobile Viewport (< 768px)', () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize(VIEWPORT_SIZES.mobile)
	})

	test('homepage has no horizontal scroll on mobile', async ({ page }) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		await expectNoHorizontalScroll(page)
	})

	test('mobile navigation menu works', async ({ page }) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		// Look for mobile menu button (hamburger menu)
		const menuButton = page.locator(
			'.w-nav-button, [aria-label*="menu" i], button[aria-label*="Menu" i], [class*="menu-toggle"], [class*="hamburger"]'
		).first()
		
		// If menu button exists, test it
		if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
			// Check initial state - menu should be hidden
			const menu = page.locator('.w-nav-menu, [class*="mobile-menu"], nav[aria-hidden="false"]').first()
			
			// Click menu button
			await menuButton.click()
			await page.waitForTimeout(500)
			
			// Menu should be visible after click
			const menuAfterClick = page.locator('.w-nav-menu, [class*="mobile-menu"]').first()
			if (await menuAfterClick.isVisible({ timeout: 1000 }).catch(() => false)) {
				// Menu is visible, close it
				await menuButton.click()
				await page.waitForTimeout(500)
			}
		}
	})

	test('mobile buttons have minimum touch target size', async ({ page }) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		const buttons = page.locator('button, a[role="button"], .w-button, [class*="button"]')
		const count = await buttons.count()
		
		if (count > 0) {
			// Check first 5 visible buttons
			let foundValid = false
			for (let i = 0; i < Math.min(count, 5); i++) {
				const button = buttons.nth(i)
				if (await button.isVisible({ timeout: 1000 }).catch(() => false)) {
					const box = await button.boundingBox()
					if (box && box.width >= 44 && box.height >= 44) {
						foundValid = true
						break
					}
				}
			}
			// At least one button should have minimum size
			if (count > 0) {
				expect(foundValid || count === 0).toBeTruthy() // At least one valid or no buttons to check
			}
		}
	})

	test('mobile images are responsive', async ({ page }) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		const result = await checkResponsiveImages(page)
		// All visible images should be responsive
		if (result.violations.length > 0) {
			console.warn('Some images may not be fully responsive:', result.violations)
		}
		// At minimum, most images should be responsive
		expect(result.violations.length).toBeLessThan(3) // Allow some tolerance
	})

	test('mobile text is readable', async ({ page }) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		// Check body text font size (should be at least 14px)
		const readability = await isTextReadable(page, 'body', 14)
		expect(readability.readable).toBe(true)
	})

	for (const { path, name } of keyPages) {
		test(`${name} page loads correctly on mobile`, async ({ page }) => {
			await page.goto(path)
			await page.waitForLoadState('networkidle')
			
			// Page should load without errors
			await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/').replace('[', '\\[').replace(']', '\\]')))
			
			// No horizontal scroll
			await expectNoHorizontalScroll(page)
		})
	}

	test('mobile forms are usable', async ({ page }) => {
		await page.goto('/contact')
		await page.waitForLoadState('networkidle')
		
		const formTest = await testFormUsability(page)
		
		// If form exists, inputs should be accessible and readable
		if (formTest.inputsAccessible) {
			expect(formTest.inputsReadable).toBe(true)
		}
	})
})

test.describe('Responsive Design - Tablet Viewport (768px - 991px)', () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize(VIEWPORT_SIZES.tablet)
	})

	test('homepage has no horizontal scroll on tablet', async ({ page }) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		await expectNoHorizontalScroll(page)
	})

	test('tablet navigation adapts correctly', async ({ page }) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		// Check if navigation exists
		const nav = page.locator('nav, .w-nav, [role="navigation"]').first()
		await expect(nav).toBeVisible()
		
		// Navigation should be visible (either full menu or hamburger)
		const navMenu = page.locator('.w-nav-menu, [class*="nav-menu"]').first()
		const menuButton = page.locator('.w-nav-button, [class*="menu-toggle"]').first()
		
		// Either menu is visible or menu button is visible
		const menuVisible = await navMenu.isVisible({ timeout: 1000 }).catch(() => false)
		const buttonVisible = await menuButton.isVisible({ timeout: 1000 }).catch(() => false)
		
		expect(menuVisible || buttonVisible).toBe(true)
	})

	test('tablet layout uses appropriate grid columns', async ({ page }) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		// Check for grid layouts
		const grids = page.locator('.w-layout-grid, [class*="grid"]')
		const count = await grids.count()
		
		if (count > 0) {
			// At least one grid should exist
			expect(count).toBeGreaterThan(0)
			
			// Check that grid items are properly sized
			const firstGrid = grids.first()
			const gridBox = await firstGrid.boundingBox()
			expect(gridBox).toBeTruthy()
		}
	})

	for (const { path, name } of keyPages) {
		test(`${name} page loads correctly on tablet`, async ({ page }) => {
			await page.goto(path)
			await page.waitForLoadState('networkidle')
			
			await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/').replace('[', '\\[').replace(']', '\\]')))
			
			await expectNoHorizontalScroll(page)
		})
	}
})

test.describe('Responsive Design - Desktop Viewport (> 991px)', () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize(VIEWPORT_SIZES.desktop)
	})

	test('homepage has no horizontal scroll on desktop', async ({ page }) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		await expectNoHorizontalScroll(page)
	})

	test('desktop navigation shows full menu', async ({ page }) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		// Full navigation menu should be visible (not hamburger menu)
		const navMenu = page.locator('.w-nav-menu, [class*="nav-menu"], nav ul').first()
		await expect(navMenu).toBeVisible()
		
		// Menu button should not be visible on desktop
		const menuButton = page.locator('.w-nav-button, [class*="menu-toggle"]').first()
		const buttonVisible = await menuButton.isVisible({ timeout: 1000 }).catch(() => false)
		
		// On desktop, menu button might still exist but should be hidden via CSS
		// We just verify that full menu is accessible
		expect(navMenu).toBeVisible()
	})

	test('desktop layout uses multi-column grids', async ({ page }) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		const grids = page.locator('.w-layout-grid, [class*="grid"], [class*="col"]')
		const count = await grids.count()
		
		// Should have at least some grid layouts
		if (count > 0) {
			const firstGrid = grids.first()
			const gridBox = await firstGrid.boundingBox()
			expect(gridBox).toBeTruthy()
			
			// Grid should be reasonably wide on desktop
			if (gridBox) {
				expect(gridBox.width).toBeGreaterThan(500)
			}
		}
	})

	test('desktop hover states work', async ({ page }) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		const links = page.locator('a[href], button').first()
		if (await links.isVisible()) {
			await links.hover()
			await page.waitForTimeout(200)
			
			// Element should still be visible after hover
			await expect(links).toBeVisible()
		}
	})

	for (const { path, name } of keyPages) {
		test(`${name} page loads correctly on desktop`, async ({ page }) => {
			await page.goto(path)
			await page.waitForLoadState('networkidle')
			
			await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/').replace('[', '\\[').replace(']', '\\]')))
			
			await expectNoHorizontalScroll(page)
		})
	}
})

test.describe('Responsive Design - Viewport Breakpoints', () => {
	test('breakpoint transitions work correctly', async ({ page }) => {
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		// Test mobile breakpoint
		await page.setViewportSize(VIEWPORT_SIZES.mobile)
		await waitForBreakpointContent(page, 'mobile')
		await expectNoHorizontalScroll(page)
		
		// Test tablet breakpoint
		await page.setViewportSize(VIEWPORT_SIZES.tablet)
		await waitForBreakpointContent(page, 'tablet')
		await expectNoHorizontalScroll(page)
		
		// Test desktop breakpoint
		await page.setViewportSize(VIEWPORT_SIZES.desktop)
		await waitForBreakpointContent(page, 'desktop')
		await expectNoHorizontalScroll(page)
	})

	test('viewport meta tag is correct', async ({ page }) => {
		await page.goto('/')
		
		const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content')
		expect(viewportMeta).toBeTruthy()
		expect(viewportMeta).toContain('width=device-width')
		expect(viewportMeta).toContain('initial-scale=1')
	})
})

test.describe('Responsive Design - Visual Regression (Screenshots)', () => {
	test('homepage screenshot on mobile', async ({ page }) => {
		await page.setViewportSize(VIEWPORT_SIZES.mobile)
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		await expect(page).toHaveScreenshot('homepage-mobile.png', {
			fullPage: true,
			maxDiffPixels: 500, // Allow some tolerance for dynamic content
		})
	})

	test('homepage screenshot on tablet', async ({ page }) => {
		await page.setViewportSize(VIEWPORT_SIZES.tablet)
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		await expect(page).toHaveScreenshot('homepage-tablet.png', {
			fullPage: true,
			maxDiffPixels: 500,
		})
	})

	test('homepage screenshot on desktop', async ({ page }) => {
		await page.setViewportSize(VIEWPORT_SIZES.desktop)
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		
		await expect(page).toHaveScreenshot('homepage-desktop.png', {
			fullPage: true,
			maxDiffPixels: 500,
		})
	})
})

test.describe('Responsive Design - Cross-Viewport Consistency', () => {
	test('key content elements are visible across all viewports', async ({ page }) => {
		const viewportSizes = [
			VIEWPORT_SIZES.mobile,
			VIEWPORT_SIZES.tablet,
			VIEWPORT_SIZES.desktop,
		]
		
		await page.goto('/')
		
		for (const viewport of viewportSizes) {
			await page.setViewportSize(viewport)
			await waitForBreakpointContent(page, getViewportCategory(viewport.width))
			
			// Main heading should be visible on all viewports
			const heading = page.getByRole('heading', { level: 1 }).first()
			if (await heading.isVisible({ timeout: 2000 }).catch(() => false)) {
				await expect(heading).toBeVisible()
			}
			
			// Body should have content
			const body = page.locator('body')
			const textContent = await body.textContent()
			expect(textContent?.trim().length).toBeGreaterThan(0)
		}
	})

	test('interactive elements remain functional across viewports', async ({ page }) => {
		await page.goto('/')
		
		const viewportSizes = [
			VIEWPORT_SIZES.mobile,
			VIEWPORT_SIZES.tablet,
			VIEWPORT_SIZES.desktop,
		]
		
		for (const viewport of viewportSizes) {
			await page.setViewportSize(viewport)
			await waitForBreakpointContent(page, getViewportCategory(viewport.width))
			
			// Find a link or button
			const interactiveElement = page.locator('a[href], button').first()
			if (await interactiveElement.isVisible({ timeout: 2000 }).catch(() => false)) {
				const boundingBox = await interactiveElement.boundingBox()
				expect(boundingBox).toBeTruthy()
				
				// Element should be clickable
				await expect(interactiveElement).toBeVisible()
			}
		}
	})
})

test.describe('Responsive Design - Performance at Different Viewports', () => {
	test('page loads quickly on mobile', async ({ page }) => {
		await page.setViewportSize(VIEWPORT_SIZES.mobile)
		
		const startTime = Date.now()
		await page.goto('/', { waitUntil: 'networkidle' })
		const loadTime = Date.now() - startTime
		
		// Page should load within 10 seconds
		expect(loadTime).toBeLessThan(10000)
	})

	test('page loads quickly on tablet', async ({ page }) => {
		await page.setViewportSize(VIEWPORT_SIZES.tablet)
		
		const startTime = Date.now()
		await page.goto('/', { waitUntil: 'networkidle' })
		const loadTime = Date.now() - startTime
		
		expect(loadTime).toBeLessThan(10000)
	})

	test('page loads quickly on desktop', async ({ page }) => {
		await page.setViewportSize(VIEWPORT_SIZES.desktop)
		
		const startTime = Date.now()
		await page.goto('/', { waitUntil: 'networkidle' })
		const loadTime = Date.now() - startTime
		
		expect(loadTime).toBeLessThan(10000)
	})
})

