import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock usage metering to avoid side effects
vi.mock('@/lib/usage', () => ({
	recordUsageEvent: vi.fn(async () => {}),
}))

// Build a minimal supabase query builder mock that supports both GET and POST flows
function makeSupabaseMock() {
	const api: any = {}

	function makeQueryFor(table: string) {
		// Service price lookup
		if (table === 'services') {
			const chain: any = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				single: vi.fn(async () => ({ data: { base_price: 120 }, error: null })),
			}
			return chain
		}
		// Insert booking
		if (table === 'bookings_insert') {
			const chain: any = {
				insert: vi.fn().mockReturnThis(),
				select: vi.fn().mockReturnThis(),
				single: vi.fn(async () => ({
					data: {
						id: 'bk_1',
						tenant_id: TENANT_ID,
						subtotal: 100,
						service_fee: 10,
						tax: 0,
						total_amount: 110,
					},
					error: null,
				})),
			}
			return chain
		}
		// GET bookings chain
		if (table === 'bookings') {
			let orderCalls = 0
			const chain: any = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockReturnThis(),
				order: vi.fn().mockImplementation(() => {
					orderCalls += 1
					if (orderCalls >= 2) {
						return { data: [{ id: 'bk_1' }], error: null }
					}
					return chain
				}),
			}
			return chain
		}
		return {}
	}

	api.from = vi.fn().mockImplementation((table: string) => {
		// When inserting, our route uses .from('bookings').insert(...).select().single()
		// To avoid conflicting with 'bookings' GET chain, we detect an 'insert' call at runtime by swapping the object
		const query = makeQueryFor(table)
		// augment to detect .insert on bookings chain
		if (table === 'bookings') {
			const insertChain = makeQueryFor('bookings_insert')
			query.insert = vi.fn().mockReturnValue(insertChain)
		}
		return query
	})

	return api
}

// Mock Supabase factory
vi.mock('@/lib/supabase', () => {
	return {
		createServerSupabase: vi.fn(() => makeSupabaseMock()),
	}
})

const TENANT_ID = '123e4567-e89b-12d3-a456-426614174000'

// Mock tenant id extraction to focus on route logic
vi.mock('@/lib/tenant', () => ({
	requireTenantId: () => TENANT_ID,
}))

// Import after mocks are defined
import { GET, POST } from '@/app/api/bookings/route'

function makeReq(url: string, init?: RequestInit) {
	return new NextRequest(new Request(url, init))
}

describe('app/api/bookings/route', () => {
	beforeEach(() => {
		vi.useRealTimers()
	})

	it('GET validates required query params', async () => {
		const req = makeReq(`http://localhost/api/bookings`, {
			headers: { 'x-tenant-id': TENANT_ID },
		})
		const res = await GET(req as any)
		expect(res.status).toBe(400)
	})

	it('GET returns bookings list for valid params', async () => {
		const req = makeReq(`http://localhost/api/bookings?userId=u1&role=customer`, {
			headers: { 'x-tenant-id': TENANT_ID },
		})
		const res = await GET(req as any)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(Array.isArray(body.bookings)).toBe(true)
		expect(body.bookings[0].id).toBe('bk_1')
	})

	it('POST validates required body fields', async () => {
		const req = makeReq(`http://localhost/api/bookings`, {
			method: 'POST',
			headers: {
				'x-tenant-id': TENANT_ID,
				'content-type': 'application/json',
			},
			body: JSON.stringify({}),
		})
		const res = await POST(req as any)
		expect(res.status).toBe(400)
	})

	it('POST creates booking and returns pricing totals', async () => {
		const today = new Date()
		today.setDate(today.getDate() + 1)
		const dateStr = today.toISOString().slice(0, 10)
		const req = makeReq(`http://localhost/api/bookings`, {
			method: 'POST',
			headers: {
				'x-tenant-id': TENANT_ID,
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				customerId: 'c1',
				serviceId: 's1',
				date: dateStr,
				time: '10:00',
				addressId: 'a1',
				notes: 'pls',
			}),
		})
		const res = await POST(req as any)
		expect(res.status).toBe(200)
		const body = await res.json()
		expect(body.booking).toBeTruthy()
		expect(body.message).toContain('created')
	})
})


