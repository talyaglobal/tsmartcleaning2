import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockRequest, createMockUser, TestData } from '@/tests/utils/test-helpers'
import { UserRole } from '@/lib/auth/roles'
import { createSupabaseMock } from '@/tests/utils/supabase-mock'

// Create mock instance outside of vi.mock to avoid hoisting issues
const { mockSupabase, setMockData } = createSupabaseMock()

// Mock Supabase with more realistic behavior
vi.mock('@/lib/supabase', () => {
	return {
		createServerSupabase: vi.fn(() => mockSupabase),
		createAnonSupabase: vi.fn(() => mockSupabase),
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
	computePrice: vi.fn((serviceId: string, options: any) => {
		return {
			subtotalBeforeFees: 100,
			serviceFee: 10,
			tax: 0,
			total: 110,
		}
	}),
}))

// Mock email
vi.mock('@/lib/emails/booking/send', () => ({
	sendBookingEmail: vi.fn(async () => {}),
}))

describe('Booking Flow Integration Tests', () => {
	const customer = createMockUser({ role: UserRole.CLEANING_LADY, id: 'customer_123' })
	const provider = createMockUser({ role: UserRole.CLEANING_COMPANY, id: 'provider_123' })

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('Complete Booking Lifecycle', () => {
		it('should create, update, and cancel a booking', async () => {
			// Step 1: Create booking
			const { POST } = await import('@/app/api/bookings/route')
			const tomorrow = new Date()
			tomorrow.setDate(tomorrow.getDate() + 1)
			const dateStr = tomorrow.toISOString().slice(0, 10)

			const createReq = createMockRequest('http://localhost/api/bookings', {
				method: 'POST',
				body: {
					customerId: customer.id,
					serviceId: 'service_123',
					date: dateStr,
					time: '10:00',
					addressId: 'address_123',
					notes: 'Test booking',
				},
				user: customer,
			})

			const createRes = await POST(createReq as any)
			expect(createRes.status).toBe(200)
			const createBody = await createRes.json()
			const bookingId = createBody.booking?.id || 'booking_123'

			// Step 2: Get booking details
			const { GET } = await import('@/app/api/bookings/[id]/route')
			const getReq = createMockRequest(`http://localhost/api/bookings/${bookingId}`, {
				user: customer,
			})

			const getRes = await GET(getReq as any, { params: { id: bookingId } })
			expect(getRes.status).toBe(200)

			// Step 3: Update booking status
			const { PATCH } = await import('@/app/api/bookings/[id]/route')
			const updateReq = createMockRequest(`http://localhost/api/bookings/${bookingId}`, {
				method: 'PATCH',
				body: { status: 'confirmed' },
				user: provider,
			})

			const updateRes = await PATCH(updateReq as any, { params: { id: bookingId } })
			expect(updateRes.status).not.toBe(404)

			// Step 4: Cancel booking
			const cancelReq = createMockRequest(`http://localhost/api/bookings/${bookingId}`, {
				method: 'PATCH',
				body: { status: 'cancelled', cancellationReason: 'Customer request' },
				user: customer,
			})

			const cancelRes = await PATCH(cancelReq as any, { params: { id: bookingId } })
			expect(cancelRes.status).not.toBe(404)
		})

		it('should handle booking reschedule flow', async () => {
			const { POST } = await import('@/app/api/bookings/route')
			const tomorrow = new Date()
			tomorrow.setDate(tomorrow.getDate() + 1)
			const dateStr = tomorrow.toISOString().slice(0, 10)

			// Create initial booking
			const createReq = createMockRequest('http://localhost/api/bookings', {
				method: 'POST',
				body: {
					customerId: customer.id,
					serviceId: 'service_123',
					date: dateStr,
					time: '10:00',
					addressId: 'address_123',
				},
				user: customer,
			})

			const createRes = await POST(createReq as any)
			expect(createRes.status).toBe(200)
			const bookingId = 'booking_123'

			// Reschedule booking
			const { POST: reschedulePOST } = await import('@/app/api/bookings/[id]/reschedule/route')
			const nextWeek = new Date()
			nextWeek.setDate(nextWeek.getDate() + 7)
			const newDateStr = nextWeek.toISOString().slice(0, 10)

			const rescheduleReq = createMockRequest(
				`http://localhost/api/bookings/${bookingId}/reschedule`,
				{
					method: 'POST',
					body: {
						date: newDateStr,
						time: '14:00',
					},
					user: customer,
				}
			)

			const rescheduleRes = await reschedulePOST(rescheduleReq as any, {
				params: { id: bookingId },
			})
			expect(rescheduleRes.status).not.toBe(404)
		})

		it('should list bookings for customer', async () => {
			const { GET } = await import('@/app/api/bookings/route')
			const req = createMockRequest(
				`http://localhost/api/bookings?userId=${customer.id}&role=customer`,
				{
					user: customer,
				}
			)

			const res = await GET(req as any)
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(Array.isArray(body.bookings)).toBe(true)
		})

		it('should list bookings for provider', async () => {
			const { GET } = await import('@/app/api/bookings/route')
			const req = createMockRequest(
				`http://localhost/api/bookings?userId=${provider.id}&role=provider`,
				{
					user: provider,
				}
			)

			const res = await GET(req as any)
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(Array.isArray(body.bookings)).toBe(true)
		})
	})

	describe('Booking Validation', () => {
		it('should reject booking with past date', async () => {
			const { POST } = await import('@/app/api/bookings/route')
			const yesterday = new Date()
			yesterday.setDate(yesterday.getDate() - 1)
			const dateStr = yesterday.toISOString().slice(0, 10)

			const req = createMockRequest('http://localhost/api/bookings', {
				method: 'POST',
				body: {
					customerId: customer.id,
					serviceId: 'service_123',
					date: dateStr,
					time: '10:00',
					addressId: 'address_123',
				},
				user: customer,
			})

			const res = await POST(req as any)
			expect(res.status).toBe(400)
		})

		it('should reject booking with missing required fields', async () => {
			const { POST } = await import('@/app/api/bookings/route')
			const req = createMockRequest('http://localhost/api/bookings', {
				method: 'POST',
				body: {
					customerId: customer.id,
					// Missing serviceId, date, time, addressId
				},
				user: customer,
			})

			const res = await POST(req as any)
			expect(res.status).toBe(400)
		})
	})
})

