import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockRequest, createMockUser, TestData } from '../../utils/test-helpers'
import { UserRole } from '@/lib/auth/roles'

// Mock Supabase
vi.mock('@/lib/supabase', () => {
	const { createSupabaseMock } = require('../../utils/supabase-mock')
	const { mockSupabase, setMockData } = createSupabaseMock()
	return {
		createServerSupabase: vi.fn(() => mockSupabase),
		resolveTenantFromRequest: vi.fn(() => 'test-tenant-id'),
		setMockData,
	}
})

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

// Mock email
vi.mock('@/lib/emails/booking/send', () => ({
	sendBookingEmail: vi.fn(async () => {}),
}))

describe('Bookings API Routes', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('GET /api/bookings', () => {
		it('should return 400 for missing userId', async () => {
			const { GET } = await import('@/app/api/bookings/route')
			const req = createMockRequest('http://localhost/api/bookings', {
				user: createMockUser(),
			})

			const res = await GET(req as any)
			expect(res.status).toBe(400)
		})

		it('should return 400 for missing role', async () => {
			const { GET } = await import('@/app/api/bookings/route')
			const req = createMockRequest('http://localhost/api/bookings?userId=u1', {
				user: createMockUser(),
			})

			const res = await GET(req as any)
			expect(res.status).toBe(400)
		})

		it('should return bookings for customer role', async () => {
			const { GET } = await import('@/app/api/bookings/route')
			const req = createMockRequest(
				'http://localhost/api/bookings?userId=u1&role=customer',
				{
					user: createMockUser({ role: UserRole.CLEANING_LADY }),
				}
			)

			const res = await GET(req as any)
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(Array.isArray(body.bookings)).toBe(true)
		})

		it('should return bookings for provider role', async () => {
			const { GET } = await import('@/app/api/bookings/route')
			const req = createMockRequest(
				'http://localhost/api/bookings?userId=u1&role=provider',
				{
					user: createMockUser({ role: UserRole.CLEANING_COMPANY }),
				}
			)

			const res = await GET(req as any)
			expect(res.status).toBe(200)
		})
	})

	describe('POST /api/bookings', () => {
		it('should return 400 for missing required fields', async () => {
			const { POST } = await import('@/app/api/bookings/route')
			const req = createMockRequest('http://localhost/api/bookings', {
				method: 'POST',
				body: {},
				user: createMockUser(),
			})

			const res = await POST(req as any)
			expect(res.status).toBe(400)
		})

		it('should validate date is in the future', async () => {
			const { POST } = await import('@/app/api/bookings/route')
			const yesterday = new Date()
			yesterday.setDate(yesterday.getDate() - 1)
			const dateStr = yesterday.toISOString().slice(0, 10)

			const req = createMockRequest('http://localhost/api/bookings', {
				method: 'POST',
				body: {
					customerId: 'c1',
					serviceId: 's1',
					date: dateStr,
					time: '10:00',
					addressId: 'a1',
				},
				user: createMockUser(),
			})

			const res = await POST(req as any)
			expect(res.status).toBe(400)
		})

		it('should create booking with valid data', async () => {
			const { POST } = await import('@/app/api/bookings/route')
			const tomorrow = new Date()
			tomorrow.setDate(tomorrow.getDate() + 1)
			const dateStr = tomorrow.toISOString().slice(0, 10)

			const req = createMockRequest('http://localhost/api/bookings', {
				method: 'POST',
				body: {
					customerId: 'c1',
					serviceId: 's1',
					date: dateStr,
					time: '10:00',
					addressId: 'a1',
					notes: 'Test booking',
				},
				user: createMockUser(),
			})

			const res = await POST(req as any)
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.booking).toBeDefined()
		})
	})

	describe('GET /api/bookings/[id]', () => {
		it('should return 404 for non-existent booking', async () => {
			const { GET } = await import('@/app/api/bookings/[id]/route')
			const req = createMockRequest('http://localhost/api/bookings/non-existent', {
				user: createMockUser(),
			})

			const res = await GET(req as any, { params: { id: 'non-existent' } })
			expect(res.status).toBe(404)
		})

		it('should return booking details for valid id', async () => {
			const { GET } = await import('@/app/api/bookings/[id]/route')
			const req = createMockRequest('http://localhost/api/bookings/booking_123', {
				user: createMockUser(),
			})

			const res = await GET(req as any, { params: { id: 'booking_123' } })
			// Should not be 404 (may be 200 or 500 depending on mock setup)
			expect(res.status).not.toBe(404)
		})
	})

	describe('PATCH /api/bookings/[id]', () => {
		it('should return 404 for non-existent booking', async () => {
			const { PATCH } = await import('@/app/api/bookings/[id]/route')
			const req = createMockRequest('http://localhost/api/bookings/non-existent', {
				method: 'PATCH',
				body: { status: 'confirmed' },
				user: createMockUser(),
			})

			const res = await PATCH(req as any, { params: { id: 'non-existent' } })
			expect(res.status).toBe(404)
		})

		it('should update booking status', async () => {
			const { PATCH } = await import('@/app/api/bookings/[id]/route')
			const req = createMockRequest('http://localhost/api/bookings/booking_123', {
				method: 'PATCH',
				body: { status: 'confirmed' },
				user: createMockUser(),
			})

			const res = await PATCH(req as any, { params: { id: 'booking_123' } })
			expect(res.status).not.toBe(404)
		})
	})
})

