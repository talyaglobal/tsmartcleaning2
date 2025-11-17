import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase to avoid database dependencies
vi.mock('@/lib/supabase', () => {
	const createQueryBuilder = (table: string) => {
		const chain: any = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			single: vi.fn().mockResolvedValue({ data: { id: 'test-id', base_price: 100 }, error: null }),
			not: vi.fn().mockReturnThis(),
			in: vi.fn().mockReturnThis(),
			upsert: vi.fn().mockReturnThis(),
		}

		// Handle multiple order() calls - second one returns data
		let orderCallCount = 0
		chain.order = vi.fn().mockImplementation(() => {
			orderCallCount++
			if (orderCallCount >= 2) {
				orderCallCount = 0 // Reset for next query
				return Promise.resolve({ data: [], error: null })
			}
			return chain
		})

		// Handle insert chain for bookings
		if (table === 'bookings') {
			chain.insert = vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: {
							id: 'booking_1',
							tenant_id: 'test-tenant-id',
							subtotal: 100,
							service_fee: 10,
							tax: 0,
							total_amount: 110,
						},
						error: null,
					}),
				}),
			})
		}

		// Handle services table for price lookup
		if (table === 'services') {
			chain.single = vi.fn().mockResolvedValue({
				data: { id: 'service_1', base_price: 100 },
				error: null,
			})
		}

		return chain
	}

	const mockSupabase = {
		auth: {
			signInWithPassword: vi.fn(async () => ({
				data: { user: { id: 'user_1', email: 'test@example.com' }, session: { access_token: 'token' } },
				error: null,
			})),
			signUp: vi.fn(async () => ({
				data: { user: { id: 'user_1', email: 'test@example.com' } },
				error: null,
			})),
			signOut: vi.fn(async () => ({ error: null })),
		},
		from: vi.fn((table: string) => createQueryBuilder(table)),
	}

	return {
		createServerSupabase: vi.fn(() => mockSupabase),
		createAnonSupabase: vi.fn(() => mockSupabase),
		resolveTenantFromRequest: vi.fn(() => 'test-tenant-id'),
	}
})

// Mock tenant utilities
vi.mock('@/lib/tenant', () => ({
	requireTenantId: vi.fn(() => 'test-tenant-id'),
}))

// Mock usage metering
vi.mock('@/lib/usage', () => ({
	recordUsageEvent: vi.fn(async () => {}),
}))

// Mock pricing
vi.mock('@/lib/pricing', () => ({
	computePrice: vi.fn(() => ({
		subtotalBeforeFees: 100,
		serviceFee: 10,
		tax: 0,
		total: 110,
	})),
}))

function makeReq(url: string, init?: RequestInit) {
	return new NextRequest(new Request(url, init))
}

describe('API Routes Accessibility', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('/api/auth/login', () => {
		it('should be accessible and return a response (not 404)', async () => {
			const { POST } = await import('@/app/api/auth/login/route')
			const req = makeReq('http://localhost/api/auth/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
			})

			const res = await POST(req as any)
			expect(res.status).not.toBe(404)
			expect(res).toBeDefined()
		})

		it('should return 400 for missing credentials', async () => {
			const { POST } = await import('@/app/api/auth/login/route')
			const req = makeReq('http://localhost/api/auth/login', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({}),
			})

			const res = await POST(req as any)
			expect(res.status).toBe(400)
		})
	})

	describe('/api/bookings', () => {
		it('GET should be accessible and return a response (not 404)', async () => {
			const { GET } = await import('@/app/api/bookings/route')
			const req = makeReq('http://localhost/api/bookings?userId=u1&role=customer', {
				headers: { 'x-tenant-id': 'test-tenant-id' },
			})

			const res = await GET(req as any)
			expect(res.status).not.toBe(404)
			expect(res).toBeDefined()
		})

		it('POST should be accessible and return a response (not 404)', async () => {
			const { POST } = await import('@/app/api/bookings/route')
			const today = new Date()
			today.setDate(today.getDate() + 1)
			const dateStr = today.toISOString().slice(0, 10)

			const req = makeReq('http://localhost/api/bookings', {
				method: 'POST',
				headers: {
					'x-tenant-id': 'test-tenant-id',
					'content-type': 'application/json',
				},
				body: JSON.stringify({
					customerId: 'c1',
					serviceId: 's1',
					date: dateStr,
					time: '10:00',
					addressId: 'a1',
				}),
			})

			const res = await POST(req as any)
			expect(res.status).not.toBe(404)
			expect(res).toBeDefined()
		})
	})

	describe('/api/services', () => {
		it('should be accessible and return a response (not 404)', async () => {
			const { GET } = await import('@/app/api/services/route')
			const req = makeReq('http://localhost/api/services')

			const res = await GET(req as any)
			expect(res.status).not.toBe(404)
			expect(res).toBeDefined()
		})
	})

	describe('/api/auth/me', () => {
		it('should be accessible and return a response (not 404)', async () => {
			const { GET } = await import('@/app/api/auth/me/route')
			const req = makeReq('http://localhost/api/auth/me')

			const res = await GET(req as any)
			expect(res.status).not.toBe(404)
			expect(res).toBeDefined()
		})
	})

	describe('/api/auth/logout', () => {
		it('should be accessible and return a response (not 404)', async () => {
			const { POST } = await import('@/app/api/auth/logout/route')
			const req = makeReq('http://localhost/api/auth/logout', {
				method: 'POST',
			})

			const res = await POST(req as any)
			expect(res.status).not.toBe(404)
			expect(res).toBeDefined()
		})
	})

	describe('/api/auth/signup', () => {
		it('should be accessible and return a response (not 404)', async () => {
			const { POST } = await import('@/app/api/auth/signup/route')
			const req = makeReq('http://localhost/api/auth/signup', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
			})

			const res = await POST(req as any)
			expect(res.status).not.toBe(404)
			expect(res).toBeDefined()
		})
	})

	describe('/api/providers', () => {
		it('should be accessible and return a response (not 404)', async () => {
			const { GET } = await import('@/app/api/providers/route')
			const req = makeReq('http://localhost/api/providers')

			const res = await GET(req as any)
			expect(res.status).not.toBe(404)
			expect(res).toBeDefined()
		})
	})

	describe('/api/users', () => {
		it('should be accessible and return a response (not 404)', async () => {
			const { GET } = await import('@/app/api/users/route')
			const req = makeReq('http://localhost/api/users')

			const res = await GET(req as any)
			expect(res.status).not.toBe(404)
			expect(res).toBeDefined()
		})
	})

	describe('/api/contact', () => {
		it('should be accessible and return a response (not 404)', async () => {
			const { POST } = await import('@/app/api/contact/route')
			const req = makeReq('http://localhost/api/contact', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ name: 'Test', email: 'test@example.com', message: 'Hello' }),
			})

			const res = await POST(req as any)
			expect(res.status).not.toBe(404)
			expect(res).toBeDefined()
		})
	})

	describe('/api/reviews', () => {
		it('should be accessible and return a response (not 404)', async () => {
			const { GET } = await import('@/app/api/reviews/route')
			const req = makeReq('http://localhost/api/reviews')

			const res = await GET(req as any)
			expect(res.status).not.toBe(404)
			expect(res).toBeDefined()
		})
	})

	describe('/api/availability', () => {
		it('should be accessible and return a response (not 404)', async () => {
			const { GET } = await import('@/app/api/availability/route')
			const tomorrow = new Date()
			tomorrow.setDate(tomorrow.getDate() + 1)
			const dateStr = tomorrow.toISOString().slice(0, 10)
			const req = makeReq(`http://localhost/api/availability?date=${dateStr}`, {
				headers: { 'x-tenant-id': 'test-tenant-id' },
			})

			const res = await GET(req as any)
			expect(res.status).not.toBe(404)
			expect(res).toBeDefined()
		})
	})
})

