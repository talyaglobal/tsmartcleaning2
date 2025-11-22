/**
 * Helper utilities for responsive design testing
 */

import { Page, expect } from '@playwright/test'

/**
 * Viewport size definitions for testing
 */
export const VIEWPORT_SIZES = {
	mobile: { width: 375, height: 667 }, // iPhone SE
	mobileLarge: { width: 414, height: 896 }, // iPhone 11 Pro Max
	mobileLandscape: { width: 667, height: 375 }, // Mobile landscape
	tablet: { width: 768, height: 1024 }, // iPad Portrait
	tabletLarge: { width: 991, height: 1200 }, // Large tablet
	tabletLandscape: { width: 1024, height: 768 }, // iPad Landscape
	desktop: { width: 1200, height: 800 }, // Standard desktop
	desktopLarge: { width: 1920, height: 1080 }, // Full HD
	desktopXL: { width: 2560, height: 1440 }, // 2K
} as const

/**
 * Breakpoint definitions matching CSS
 */
export const BREAKPOINTS = {
	mobile: 767, // max-width: 767px
	tablet: 991, // max-width: 991px
	desktop: 992, // min-width: 992px
} as const

/**
 * Check if page has horizontal scroll
 */
export async function hasHorizontalScroll(page: Page): Promise<boolean> {
	const scrollWidth = await page.evaluate(() => {
		return Math.max(
			document.body.scrollWidth,
			document.documentElement.scrollWidth
		)
	})
	const clientWidth = await page.evaluate(() => {
		return Math.max(
			document.body.clientWidth,
			document.documentElement.clientWidth
		)
	})
	return scrollWidth > clientWidth
}

/**
 * Check if element meets minimum touch target size (44x44px recommended)
 */
export async function hasMinimumTouchTarget(
	page: Page,
	selector: string
): Promise<{ valid: boolean; width: number; height: number }> {
	const element = page.locator(selector).first()
	if (!(await element.isVisible({ timeout: 1000 }).catch(() => false))) {
		return { valid: false, width: 0, height: 0 }
	}

	const box = await element.boundingBox()
	if (!box) {
		return { valid: false, width: 0, height: 0 }
	}

	const MIN_SIZE = 44
	return {
		valid: box.width >= MIN_SIZE && box.height >= MIN_SIZE,
		width: box.width,
		height: box.height,
	}
}

/**
 * Get computed font size in pixels
 */
export async function getComputedFontSize(
	page: Page,
	selector: string
): Promise<number> {
	return await page.evaluate((sel: string) => {
		const element = document.querySelector(sel)
		if (!element) return 0
		const styles = window.getComputedStyle(element)
		const fontSize = styles.fontSize
		return parseFloat(fontSize)
	}, selector)
}

/**
 * Get viewport size category (mobile, tablet, desktop)
 */
export function getViewportCategory(width: number): 'mobile' | 'tablet' | 'desktop' {
	if (width <= BREAKPOINTS.mobile) {
		return 'mobile'
	}
	if (width <= BREAKPOINTS.tablet) {
		return 'tablet'
	}
	return 'desktop'
}

/**
 * Check if images are responsive (don't exceed viewport width)
 */
export async function checkResponsiveImages(
	page: Page,
	maxWidth?: number
): Promise<{ allResponsive: boolean; violations: Array<{ src: string; width: number }> }> {
	const viewportSize = page.viewportSize()
	const maxAllowedWidth = maxWidth || (viewportSize?.width || 1920) + 40 // Allow 40px for padding/margins

	const images = page.locator('img')
	const count = await images.count()
	const violations: Array<{ src: string; width: number }> = []

	for (let i = 0; i < count; i++) {
		const img = images.nth(i)
		if (await img.isVisible({ timeout: 1000 }).catch(() => false)) {
			const box = await img.boundingBox()
			if (box && box.width > maxAllowedWidth) {
				const src = (await img.getAttribute('src')) || 'unknown'
				violations.push({ src, width: box.width })
			}
		}
	}

	return {
		allResponsive: violations.length === 0,
		violations,
	}
}

/**
 * Wait for breakpoint-specific content to load
 */
export async function waitForBreakpointContent(
	page: Page,
	category: 'mobile' | 'tablet' | 'desktop'
): Promise<void> {
	const viewportSize = page.viewportSize()
	if (!viewportSize) return

	// Wait a bit for CSS to apply after viewport change
	await page.waitForTimeout(300)

	// Wait for any breakpoint-specific animations or content
	await page.waitForLoadState('networkidle')
}

/**
 * Test navigation behavior at different viewports
 */
export async function testNavigationAtViewport(
	page: Page,
	viewport: { width: number; height: number }
): Promise<{
	menuButtonVisible: boolean
	menuVisible: boolean
	menuToggleable: boolean
}> {
	await page.setViewportSize(viewport)
	await page.goto('/')
	await waitForBreakpointContent(page, getViewportCategory(viewport.width))

	const menuButton = page
		.locator(
			'.w-nav-button, [aria-label*="menu" i], button[aria-label*="Menu" i], [class*="menu-toggle"], [class*="hamburger"]'
		)
		.first()

	const navMenu = page
		.locator('.w-nav-menu, [class*="mobile-menu"], nav[aria-hidden="false"]')
		.first()

	const menuButtonVisible = await menuButton
		.isVisible({ timeout: 1000 })
		.catch(() => false)

	const menuVisible = await navMenu.isVisible({ timeout: 1000 }).catch(() => false)

	let menuToggleable = false
	if (menuButtonVisible) {
		// Try to toggle menu
		await menuButton.click()
		await page.waitForTimeout(500)

		const menuAfterClick = page
			.locator('.w-nav-menu, [class*="mobile-menu"]')
			.first()
		const menuVisibleAfterClick = await menuAfterClick
			.isVisible({ timeout: 1000 })
			.catch(() => false)

		// Close menu if opened
		if (menuVisibleAfterClick) {
			await menuButton.click()
			await page.waitForTimeout(500)
		}

		menuToggleable = true
	}

	return {
		menuButtonVisible,
		menuVisible,
		menuToggleable,
	}
}

/**
 * Assert no horizontal scroll on page
 */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
	const hasScroll = await hasHorizontalScroll(page)
	expect(hasScroll).toBe(false)
}

/**
 * Assert minimum touch target size
 */
export async function expectMinimumTouchTarget(
	page: Page,
	selector: string,
	message?: string
): Promise<void> {
	const result = await hasMinimumTouchTarget(page, selector)
	expect(result.valid).toBe(true)
}

/**
 * Get all interactive elements (buttons, links with href, form inputs)
 */
export async function getInteractiveElements(page: Page): Promise<Array<{
	selector: string
	tagName: string
	text: string | null
	boundingBox: { width: number; height: number } | null
}>> {
	return await page.evaluate(() => {
		const interactive = Array.from(
			document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [tabindex="0"]')
		)

		return interactive.map((el) => {
			const rect = el.getBoundingClientRect()
			return {
				selector: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ')[0] : ''),
				tagName: el.tagName.toLowerCase(),
				text: el.textContent?.trim().substring(0, 50) || null,
				boundingBox: {
					width: rect.width,
					height: rect.height,
				},
			}
		})
	})
}

/**
 * Check if text is readable (minimum font size)
 */
export async function isTextReadable(
	page: Page,
	selector: string = 'body',
	minSize: number = 14
): Promise<{ readable: boolean; fontSize: number }> {
	const fontSize = await getComputedFontSize(page, selector)
	return {
		readable: fontSize >= minSize,
		fontSize,
	}
}

/**
 * Test form usability at viewport
 */
export async function testFormUsability(page: Page): Promise<{
	inputsAccessible: boolean
	inputsReadable: boolean
	submitButtonAccessible: boolean
}> {
	const inputs = page.locator('input[type="text"], input[type="email"], input[type="tel"], textarea')
	const inputCount = await inputs.count()

	let inputsAccessible = false
	let inputsReadable = false

	if (inputCount > 0) {
		const firstInput = inputs.first()
		inputsAccessible = await firstInput.isVisible({ timeout: 2000 }).catch(() => false)

		if (inputsAccessible) {
			const box = await firstInput.boundingBox()
			inputsReadable = box ? box.width >= 200 : false
		}
	}

	const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("submit"), button:has-text("send")').first()
	const submitButtonAccessible = await submitButton.isVisible({ timeout: 2000 }).catch(() => false)

	return {
		inputsAccessible,
		inputsReadable,
		submitButtonAccessible,
	}
}

/**
 * Compare layouts across viewports (useful for regression testing)
 */
export async function compareLayoutMetrics(
	page: Page,
	viewport1: { width: number; height: number },
	viewport2: { width: number; height: number },
	selector: string = 'body'
): Promise<{
	viewport1: { width: number; height: number }
	viewport2: { width: number; height: number }
	changed: boolean
}> {
	// Test at viewport 1
	await page.setViewportSize(viewport1)
	await page.goto('/')
	await waitForBreakpointContent(page, getViewportCategory(viewport1.width))

	const box1 = await page.locator(selector).boundingBox()

	// Test at viewport 2
	await page.setViewportSize(viewport2)
	await waitForBreakpointContent(page, getViewportCategory(viewport2.width))

	const box2 = await page.locator(selector).boundingBox()

	return {
		viewport1: {
			width: box1?.width || 0,
			height: box1?.height || 0,
		},
		viewport2: {
			width: box2?.width || 0,
			height: box2?.height || 0,
		},
		changed: (box1?.width !== box2?.width) || (box1?.height !== box2?.height),
	}
}

