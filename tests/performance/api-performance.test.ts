import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockRequest } from '../utils/test-helpers'

/**
 * Performance tests for API routes
 * These tests measure response times and ensure APIs meet performance thresholds
 */

// Mock Supabase
vi.mock('@/lib/supabase', () => {
	const { createSupabaseMock } = require('../utils/supabase-mock')
	const { mockSupabase } = createSupabaseMock()
	return {
		createServerSupabase: vi.fn(() => mockSupabase),
		resolveTenantFromRequest: vi.fn(() => 'test-tenant-id'),
	}
})

vi.mock('@/lib/usage', () => ({
	recordUsageEvent: vi.fn(async () => {}),
}))

describe('API Performance Tests', () => {
	const PERFORMANCE_THRESHOLDS = {
		fast: 100, // 100ms for simple queries
		medium: 500, // 500ms for complex queries
		slow: 1000, // 1s for very complex operations
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	async function measureResponseTime(fn: () => Promise<any>): Promise<number> {
		const start = Date.now()
		await fn()
		return Date.now() - start
	}

	describe('GET /api/services', () => {
		it('should respond within fast threshold', async () => {
			const { GET } = await import('@/app/api/services/route')
			const req = createMockRequest('http://localhost/api/services')

			const responseTime = await measureResponseTime(async () => {
				await GET(req as any)
			})

			expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.fast)
		})
	})

	describe('GET /api/bookings', () => {
		it('should respond within medium threshold', async () => {
			const { GET } = await import('@/app/api/bookings/route')
			const req = createMockRequest(
				'http://localhost/api/bookings?userId=u1&role=customer',
				{
					headers: { 'x-tenant-id': 'test-tenant-id' },
				}
			)

			const responseTime = await measureResponseTime(async () => {
				await GET(req as any)
			})

			expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.medium)
		})
	})

	describe('POST /api/bookings', () => {
		it('should respond within medium threshold', async () => {
			const { POST } = await import('@/app/api/bookings/route')
			const tomorrow = new Date()
			tomorrow.setDate(tomorrow.getDate() + 1)
			const dateStr = tomorrow.toISOString().slice(0, 10)

			const req = createMockRequest('http://localhost/api/bookings', {
				method: 'POST',
				headers: {
					'x-tenant-id': 'test-tenant-id',
					'content-type': 'application/json',
				},
				body: {
					customerId: 'c1',
					serviceId: 's1',
					date: dateStr,
					time: '10:00',
					addressId: 'a1',
				},
			})

			const responseTime = await measureResponseTime(async () => {
				await POST(req as any)
			})

			expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.medium)
		})
	})

	describe('GET /api/users', () => {
		it('should respond within fast threshold', async () => {
			const { GET } = await import('@/app/api/users/route')
			const req = createMockRequest('http://localhost/api/users')

			const responseTime = await measureResponseTime(async () => {
				await GET(req as any)
			})

			expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.fast)
		})
	})

	describe('Concurrent Request Handling', () => {
		it('should handle multiple concurrent requests', async () => {
			const { GET } = await import('@/app/api/services/route')
			const requests = Array.from({ length: 10 }, () =>
				createMockRequest('http://localhost/api/services')
			)

			const start = Date.now()
			await Promise.all(requests.map(req => GET(req as any)))
			const totalTime = Date.now() - start

			// All requests should complete within reasonable time
			// (not 10x the single request time due to blocking)
			expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.fast * 3)
		})
	})
})

