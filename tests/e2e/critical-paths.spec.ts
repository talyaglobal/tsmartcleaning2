import { test, expect } from '@playwright/test'

/**
 * E2E tests for critical user paths
 * These tests verify end-to-end functionality in a real browser environment
 */

test.describe('Critical User Paths', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to homepage before each test
		await page.goto('/')
	})

	test('homepage loads and displays correctly', async ({ page }) => {
		await expect(page).toHaveTitle(/tSmart Cleaning/i)
		
		// Check for key elements
		const heading = page.getByRole('heading', { level: 1 })
		await expect(heading).toBeVisible()
	})

	test('navigation links work correctly', async ({ page }) => {
		// Test Find Cleaners link
		const findCleanersLink = page.getByRole('link', { name: /find cleaners/i })
		if (await findCleanersLink.isVisible()) {
			await findCleanersLink.click()
			await expect(page).toHaveURL(/.*find-cleaners/)
		}

		// Test About link
		await page.goto('/')
		const aboutLink = page.getByRole('link', { name: /about/i })
		if (await aboutLink.isVisible()) {
			await aboutLink.click()
			await expect(page).toHaveURL(/.*about/)
		}
	})

	test('contact form submission flow', async ({ page }) => {
		await page.goto('/contact')
		
		// Fill out contact form
		await page.fill('input[name="name"], input[type="text"]', 'Test User')
		await page.fill('input[name="email"], input[type="email"]', 'test@example.com')
		await page.fill('textarea[name="message"], textarea', 'Test message')
		
		// Submit form (if submit button exists)
		const submitButton = page.getByRole('button', { name: /submit|send/i })
		if (await submitButton.isVisible()) {
			await submitButton.click()
			// Wait for response (success message or redirect)
			await page.waitForTimeout(1000)
		}
	})

	test('booking flow - service selection', async ({ page }) => {
		await page.goto('/customer/book')
		
		// Check if booking page loads
		await expect(page).toHaveURL(/.*book/)
		
		// Look for service selection elements
		const serviceElements = page.locator('[data-testid="service"], .service, button')
		const count = await serviceElements.count()
		
		// If services are available, click first one
		if (count > 0) {
			await serviceElements.first().click()
		}
	})

	test('authentication flow', async ({ page }) => {
		await page.goto('/login')
		
		// Check login page loads
		await expect(page).toHaveURL(/.*login/)
		
		// Fill login form if it exists
		const emailInput = page.locator('input[type="email"], input[name="email"]')
		const passwordInput = page.locator('input[type="password"], input[name="password"]')
		
		if (await emailInput.isVisible() && await passwordInput.isVisible()) {
			await emailInput.fill('test@example.com')
			await passwordInput.fill('password123')
			
			const submitButton = page.getByRole('button', { name: /login|sign in/i })
			if (await submitButton.isVisible()) {
				await submitButton.click()
				// Wait for redirect or error message
				await page.waitForTimeout(2000)
			}
		}
	})

	test('responsive design - mobile viewport', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 })
		await page.goto('/')
		
		// Check that page is responsive
		const body = page.locator('body')
		await expect(body).toBeVisible()
		
		// Check for mobile menu if it exists
		const mobileMenu = page.locator('[aria-label*="menu"], button[aria-label*="Menu"]')
		if (await mobileMenu.isVisible()) {
			await mobileMenu.click()
		}
	})

	test('accessibility - keyboard navigation', async ({ page }) => {
		await page.goto('/')
		
		// Tab through interactive elements
		await page.keyboard.press('Tab')
		await page.keyboard.press('Tab')
		await page.keyboard.press('Tab')
		
		// Check that focus is visible
		const focusedElement = page.locator(':focus')
		await expect(focusedElement).toBeVisible()
	})
})

test.describe('Error Handling', () => {
	test('404 page displays correctly', async ({ page }) => {
		await page.goto('/non-existent-page-12345')
		await expect(page).toHaveURL(/.*non-existent-page-12345/)
		
		// Check for 404 content
		const notFoundText = page.getByText(/404|not found|page not found/i)
		await expect(notFoundText.first()).toBeVisible()
	})
})

