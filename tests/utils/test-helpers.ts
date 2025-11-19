import { NextRequest } from 'next/server'
import { UserRole } from '@/lib/auth/roles'

/**
 * Test utilities for creating mock requests and responses
 */

export function createMockRequest(
	url: string,
	options?: {
		method?: string
		headers?: Record<string, string>
		body?: any
		user?: {
			id: string
			email: string
			role: UserRole
			tenantId?: string
		}
	}
): NextRequest {
	const headers = new Headers(options?.headers || {})
	
	// Add auth headers if user is provided
	if (options?.user) {
		headers.set('authorization', `Bearer mock-token-${options.user.id}`)
		headers.set('x-user-id', options.user.id)
		headers.set('x-user-role', options.user.role)
		if (options.user.tenantId) {
			headers.set('x-tenant-id', options.user.tenantId)
		}
	}

	const init: RequestInit = {
		method: options?.method || 'GET',
		headers,
	}

	if (options?.body) {
		if (typeof options.body === 'string') {
			init.body = options.body
		} else {
			init.body = JSON.stringify(options.body)
			headers.set('content-type', 'application/json')
		}
	}

	return new NextRequest(new Request(url, init))
}

export function createMockUser(overrides?: Partial<{
	id: string
	email: string
	role: UserRole
	tenantId: string
}>) {
	return {
		id: overrides?.id || 'user_123',
		email: overrides?.email || 'test@example.com',
		role: overrides?.role || UserRole.CLEANING_LADY,
		tenantId: overrides?.tenantId || 'tenant_123',
		...overrides,
	}
}

export const TEST_TENANT_ID = 'test-tenant-123'
export const TEST_USER_ID = 'test-user-123'

/**
 * Common test data factories
 */
export const TestData = {
	booking: (overrides?: any) => ({
		id: 'booking_123',
		customer_id: 'customer_123',
		provider_id: 'provider_123',
		service_id: 'service_123',
		date: new Date().toISOString().split('T')[0],
		time: '10:00',
		status: 'pending',
		subtotal: 100,
		service_fee: 10,
		tax: 0,
		total_amount: 110,
		...overrides,
	}),
	
	service: (overrides?: any) => ({
		id: 'service_123',
		name: 'Standard Cleaning',
		category: 'residential',
		base_price: 100,
		is_active: true,
		...overrides,
	}),
	
	address: (overrides?: any) => ({
		id: 'address_123',
		user_id: 'user_123',
		street: '123 Test St',
		city: 'Test City',
		state: 'CA',
		zip: '12345',
		...overrides,
	}),
}

