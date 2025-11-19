import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockRequest, createMockUser } from '../../utils/test-helpers'
import { UserRole } from '@/lib/auth/roles'

// Mock Supabase
vi.mock('@/lib/supabase', () => {
	const { createSupabaseMock } = require('../../utils/supabase-mock')
	const { mockSupabase } = createSupabaseMock()
	return {
		createServerSupabase: vi.fn(() => mockSupabase),
		resolveTenantFromRequest: vi.fn(() => 'test-tenant-id'),
	}
})

// Mock auth
vi.mock('@/lib/auth/rbac', () => ({
	withRootAdmin: (handler: any) => handler,
	withAuth: (handler: any) => handler,
}))

vi.mock('@/lib/auth/server-auth', () => ({
	requireRootAdmin: vi.fn(async () => {}),
	requireAdmin: vi.fn(async () => ({
		user: {
			id: 'admin_123',
			email: 'admin@example.com',
			role: UserRole.ROOT_ADMIN,
		},
	})),
	requireAuth: vi.fn(async () => ({
		user: {
			id: 'user_123',
			email: 'user@example.com',
			role: UserRole.CLEANING_LADY,
		},
	})),
}))

// Mock usage metering
vi.mock('@/lib/usage', () => ({
	recordUsageEvent: vi.fn(async () => {}),
}))

describe('Admin API Routes', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('GET /api/admin/users', () => {
		it('should require admin authentication', async () => {
			const { GET } = await import('@/app/api/admin/users/route')
			const req = createMockRequest('http://localhost/api/admin/users', {
				user: createMockUser({ role: UserRole.CLEANING_LADY }), // Non-admin
			})

			const res = await GET(req as any)
			// Should return 401 or 403 for non-admin
			expect([401, 403]).toContain(res.status)
		})

		it('should return users list for admin', async () => {
			const { GET } = await import('@/app/api/admin/users/route')
			const req = createMockRequest('http://localhost/api/admin/users', {
				user: createMockUser({ role: UserRole.ROOT_ADMIN }),
			})

			const res = await GET(req as any)
			expect(res.status).toBe(200)
			const body = await res.json()
			expect(Array.isArray(body.users)).toBe(true)
		})
	})

	describe('GET /api/admin/stats', () => {
		it('should require admin authentication', async () => {
			const { GET } = await import('@/app/api/admin/stats/route')
			const req = createMockRequest('http://localhost/api/admin/stats', {
				user: createMockUser({ role: UserRole.CLEANING_LADY }),
			})

			const res = await GET(req as any)
			expect([401, 403]).toContain(res.status)
		})

		it('should return stats for admin', async () => {
			const { GET } = await import('@/app/api/admin/stats/route')
			const req = createMockRequest('http://localhost/api/admin/stats', {
				user: createMockUser({ role: UserRole.ROOT_ADMIN }),
			})

			const res = await GET(req as any)
			expect(res.status).toBe(200)
		})
	})

	describe('GET /api/root-admin/tenants', () => {
		it('should require root admin authentication', async () => {
			const { GET } = await import('@/app/api/root-admin/tenants/route')
			const req = createMockRequest('http://localhost/api/root-admin/tenants', {
				user: createMockUser({ role: UserRole.CLEANING_COMPANY }), // Not root admin
			})

			const res = await GET(req as any)
			expect([401, 403]).toContain(res.status)
		})

		it('should return tenants for root admin', async () => {
			const { GET } = await import('@/app/api/root-admin/tenants/route')
			const req = createMockRequest('http://localhost/api/root-admin/tenants', {
				user: createMockUser({ role: UserRole.ROOT_ADMIN }),
			})

			const res = await GET(req as any)
			expect(res.status).toBe(200)
		})
	})
})

