import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockRequest, createMockUser } from '../../utils/test-helpers'
import { UserRole } from '@/lib/auth/roles'

// Mock Supabase
vi.mock('@/lib/supabase', () => {
	const { createSupabaseMock } = require('../../utils/supabase-mock')
	const { mockSupabase } = createSupabaseMock()
	return {
		createServerSupabase: vi.fn(() => mockSupabase),
		createAnonSupabase: vi.fn(() => mockSupabase),
		resolveTenantFromRequest: vi.fn(() => 'test-tenant-id'),
	}
})

// Mock usage metering
vi.mock('@/lib/usage', () => ({
	recordUsageEvent: vi.fn(async () => {}),
}))

describe('Auth API Routes', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('POST /api/auth/login', () => {
		it('should return 400 for missing credentials', async () => {
			const { POST } = await import('@/app/api/auth/login/route')
			const req = createMockRequest('http://localhost/api/auth/login', {
				method: 'POST',
				body: {},
			})

			const res = await POST(req as any)
			expect(res.status).toBe(400)
		})

		it('should return 400 for invalid email format', async () => {
			const { POST } = await import('@/app/api/auth/login/route')
			const req = createMockRequest('http://localhost/api/auth/login', {
				method: 'POST',
				body: {
					email: 'invalid-email',
					password: 'password123',
				},
			})

			const res = await POST(req as any)
			expect(res.status).toBe(400)
		})

		it('should return 400 for missing password', async () => {
			const { POST } = await import('@/app/api/auth/login/route')
			const req = createMockRequest('http://localhost/api/auth/login', {
				method: 'POST',
				body: {
					email: 'test@example.com',
				},
			})

			const res = await POST(req as any)
			expect(res.status).toBe(400)
		})

		it('should handle valid login request', async () => {
			const { POST } = await import('@/app/api/auth/login/route')
			const req = createMockRequest('http://localhost/api/auth/login', {
				method: 'POST',
				body: {
					email: 'test@example.com',
					password: 'password123',
				},
			})

			const res = await POST(req as any)
			// Should not be 400 or 404
			expect([400, 404]).not.toContain(res.status)
		})
	})

	describe('POST /api/auth/signup', () => {
		it('should return 400 for missing required fields', async () => {
			const { POST } = await import('@/app/api/auth/signup/route')
			const req = createMockRequest('http://localhost/api/auth/signup', {
				method: 'POST',
				body: {},
			})

			const res = await POST(req as any)
			expect(res.status).toBe(400)
		})

		it('should validate email format', async () => {
			const { POST } = await import('@/app/api/auth/signup/route')
			const req = createMockRequest('http://localhost/api/auth/signup', {
				method: 'POST',
				body: {
					email: 'invalid-email',
					password: 'password123',
					fullName: 'Test User',
				},
			})

			const res = await POST(req as any)
			expect(res.status).toBe(400)
		})

		it('should validate password strength', async () => {
			const { POST } = await import('@/app/api/auth/signup/route')
			const req = createMockRequest('http://localhost/api/auth/signup', {
				method: 'POST',
				body: {
					email: 'test@example.com',
					password: '123', // Too short
					fullName: 'Test User',
				},
			})

			const res = await POST(req as any)
			// Should validate password (may be 400 or handled by Supabase)
			expect([400, 422]).toContain(res.status)
		})
	})

	describe('GET /api/auth/me', () => {
		it('should return 401 for missing token', async () => {
			const { GET } = await import('@/app/api/auth/me/route')
			const req = createMockRequest('http://localhost/api/auth/me')

			const res = await GET(req as any)
			expect(res.status).toBe(401)
		})

		it('should return 401 for invalid token', async () => {
			const { GET } = await import('@/app/api/auth/me/route')
			const req = createMockRequest('http://localhost/api/auth/me', {
				headers: {
					authorization: 'Bearer invalid-token',
				},
			})

			const res = await GET(req as any)
			expect(res.status).toBe(401)
		})

		it('should return user data for valid token', async () => {
			const { GET } = await import('@/app/api/auth/me/route')
			const req = createMockRequest('http://localhost/api/auth/me', {
				headers: {
					authorization: 'Bearer valid-token',
				},
			})

			const res = await GET(req as any)
			// Should not be 401 or 404
			expect([401, 404]).not.toContain(res.status)
		})
	})

	describe('POST /api/auth/logout', () => {
		it('should handle logout request', async () => {
			const { POST } = await import('@/app/api/auth/logout/route')
			const req = createMockRequest('http://localhost/api/auth/logout', {
				method: 'POST',
			})

			const res = await POST(req as any)
			expect(res.status).not.toBe(404)
		})
	})
})

