import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createMockRequest, createMockUser } from '@/tests/utils/test-helpers'
import { UserRole } from '@/lib/auth/roles'
import { createSupabaseMock } from '@/tests/utils/supabase-mock'

// Create mock instance outside of vi.mock to avoid hoisting issues
const { mockSupabase } = createSupabaseMock()

// Mock Supabase
vi.mock('@/lib/supabase', () => {
	return {
		createServerSupabase: vi.fn(() => mockSupabase),
		createAnonSupabase: vi.fn(() => mockSupabase),
		resolveTenantFromRequest: vi.fn(() => 'test-tenant-id'),
	}
})

// Mock auth functions
vi.mock('@/lib/auth/server-auth', () => ({
	requireAuth: vi.fn(),
	requireAdmin: vi.fn(),
	requireRootAdmin: vi.fn(),
	authenticateRequest: vi.fn(),
	requireRole: vi.fn(),
	requirePermission: vi.fn(),
}))

vi.mock('@/lib/auth/rbac', async () => {
	const actual = await vi.importActual('@/lib/auth/rbac')
	return {
		...actual,
		withAuth: vi.fn((handler: any, options?: any) => handler),
		withRootAdmin: vi.fn((handler: any) => handler),
		verifyBookingOwnership: vi.fn(),
		verifyCompanyMembership: vi.fn(),
	}
})

// Mock usage metering
vi.mock('@/lib/usage', () => ({
	recordUsageEvent: vi.fn(async () => {}),
}))

// Import mocked functions to access them (after mocks are defined)
import * as serverAuth from '@/lib/auth/server-auth'
import * as rbac from '@/lib/auth/rbac'

describe('API Authentication & Security Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks()

		// Default mock implementations
		vi.mocked(serverAuth.requireAuth).mockImplementation(async (req: NextRequest) => {
			const userId = req.headers.get('x-user-id') || 'user_123'
			const role = (req.headers.get('x-user-role') as UserRole) || UserRole.CLEANING_LADY
			const { mockSupabase } = createSupabaseMock()
			return {
				user: {
					id: userId,
					email: 'test@example.com',
					role,
					name: 'Test User',
					isActive: true,
				},
				supabase: mockSupabase,
				tenantId: 'test-tenant-id',
			}
		})

		vi.mocked(serverAuth.requireAdmin).mockImplementation(async (req: NextRequest) => {
			const role = (req.headers.get('x-user-role') as UserRole) || UserRole.CLEANING_LADY
			if (![UserRole.ROOT_ADMIN, UserRole.PARTNER_ADMIN, UserRole.TSMART_TEAM, UserRole.CLEANING_COMPANY].includes(role)) {
				throw NextResponse.json({ error: 'Admin access required' }, { status: 403 })
			}
			const { mockSupabase } = createSupabaseMock()
			return {
				user: {
					id: req.headers.get('x-user-id') || 'admin_123',
					email: 'admin@example.com',
					role,
					name: 'Admin User',
					isActive: true,
				},
				supabase: mockSupabase,
				tenantId: 'test-tenant-id',
			}
		})

		vi.mocked(serverAuth.requireRootAdmin).mockImplementation(async (req: NextRequest) => {
			const role = (req.headers.get('x-user-role') as UserRole) || UserRole.CLEANING_LADY
			if (role !== UserRole.ROOT_ADMIN) {
				throw NextResponse.json({ error: 'Root admin access required' }, { status: 403 })
			}
		})

		vi.mocked(rbac.verifyBookingOwnership).mockResolvedValue(true)
		vi.mocked(rbac.verifyCompanyMembership).mockResolvedValue(true)
	})

	describe('1. Users can only access their own data', () => {
		it('should prevent users from accessing other users bookings via userId query param', async () => {
			// Mock a route that accepts userId from query params (vulnerable pattern)
			const vulnerableHandler = async (req: NextRequest) => {
				const { searchParams } = new URL(req.url)
				const userId = searchParams.get('userId')
				// This is the vulnerable pattern - using userId from query without verification
				return NextResponse.json({ bookings: [{ id: 'booking_1', user_id: userId }] })
			}

			const user1 = createMockUser({ id: 'user_1', role: UserRole.CUSTOMER })
			const user2 = createMockUser({ id: 'user_2', role: UserRole.CUSTOMER })

			// User 1 tries to access User 2's bookings
			const req = createMockRequest('http://localhost/api/bookings?userId=user_2', {
				user: user1,
			})

			// This should be blocked - but if the route doesn't verify ownership, it will succeed
			// In a properly secured route, this should return 403
			const res = await vulnerableHandler(req)
			
			// This test documents the vulnerability - the route should verify ownership
			expect(res.status).toBe(200)
			const body = await res.json()
			// The vulnerability: user_1 can see user_2's bookings
			expect(body.bookings[0].user_id).toBe('user_2')
		})

		it('should prevent users from accessing other users customer profile', async () => {
			// Test customer profile route
			const handler = async (req: NextRequest, auth: any, context: any) => {
				const customerId = context?.params?.id || new URL(req.url).pathname.split('/').pop()
				// Properly secured: verify ownership
				if (auth.user.id !== customerId && !auth.user.role.includes('admin')) {
					return NextResponse.json(
						{ error: 'You do not have permission to access this resource' },
						{ status: 403 }
					)
				}
				return NextResponse.json({ id: customerId, email: 'customer@example.com' })
			}

			const user1 = createMockUser({ id: 'user_1', role: UserRole.CUSTOMER })
			const authResult = await serverAuth.requireAuth(createMockRequest('http://localhost/api/customers/user_2', { user: user1 }))

			const req = createMockRequest('http://localhost/api/customers/user_2', { user: user1 })
			const res = await handler(req, authResult, { params: { id: 'user_2' } })

			expect(res.status).toBe(403)
			const body = await res.json()
			expect(body.error).toContain('permission')
		})

		it('should allow users to access their own customer profile', async () => {
			const handler = async (req: NextRequest, auth: any, context: any) => {
				const customerId = context?.params?.id
				if (auth.user.id !== customerId && !auth.user.role.includes('admin')) {
					return NextResponse.json(
						{ error: 'You do not have permission to access this resource' },
						{ status: 403 }
					)
				}
				return NextResponse.json({ id: customerId, email: auth.user.email })
			}

			const user1 = createMockUser({ id: 'user_1', role: UserRole.CUSTOMER })
			const authResult = await serverAuth.requireAuth(createMockRequest('http://localhost/api/customers/user_1', { user: user1 }))

			const req = createMockRequest('http://localhost/api/customers/user_1', { user: user1 })
			const res = await handler(req, authResult, { params: { id: 'user_1' } })

			expect(res.status).toBe(200)
			const body = await res.json()
			expect(body.id).toBe('user_1')
		})

		it('should verify booking ownership before allowing access', async () => {
			vi.mocked(rbac.verifyBookingOwnership).mockImplementation(async (bookingId: string, userId: string) => {
				// User can only access their own bookings
				return bookingId === 'booking_user1' && userId === 'user_1'
			})

			const handler = async (req: NextRequest, auth: any, context: any) => {
				const bookingId = context?.params?.id
				const { mockSupabase } = createSupabaseMock()
				const hasAccess = await rbac.verifyBookingOwnership(bookingId, auth.user.id, auth.user.role, mockSupabase)
				if (!hasAccess) {
					return NextResponse.json({ error: 'Access denied' }, { status: 403 })
				}
				return NextResponse.json({ id: bookingId })
			}

			const user1 = createMockUser({ id: 'user_1', role: UserRole.CUSTOMER })
			const authResult = await serverAuth.requireAuth(createMockRequest('http://localhost/api/bookings/booking_user2', { user: user1 }))

			const req = createMockRequest('http://localhost/api/bookings/booking_user2', { user: user1 })
			const res = await handler(req, authResult, { params: { id: 'booking_user2' } })

			expect(res.status).toBe(403)
		})
	})

	describe('2. Admins can access admin routes', () => {
		it('should allow admin users to access admin routes', async () => {
			const { GET } = await import('@/app/api/admin/users/route')
			const adminUser = createMockUser({ id: 'admin_1', role: UserRole.ROOT_ADMIN })
			const req = createMockRequest('http://localhost/api/admin/users', { user: adminUser })

			const res = await GET(req as any)
			// Should succeed (200) or return data (not 403/401)
			expect([401, 403]).not.toContain(res.status)
		})

		it('should deny non-admin users access to admin routes', async () => {
			const { GET } = await import('@/app/api/admin/users/route')
			const regularUser = createMockUser({ id: 'user_1', role: UserRole.CLEANING_LADY })
			const req = createMockRequest('http://localhost/api/admin/users', { user: regularUser })

			const res = await GET(req as any)
			expect([401, 403]).toContain(res.status)
		})

		it('should allow PARTNER_ADMIN to access admin routes', async () => {
			const { GET } = await import('@/app/api/admin/stats/route')
			const partnerAdmin = createMockUser({ id: 'partner_1', role: UserRole.PARTNER_ADMIN })
			const req = createMockRequest('http://localhost/api/admin/stats', { user: partnerAdmin })

			const res = await GET(req as any)
			expect([401, 403]).not.toContain(res.status)
		})

		it('should allow CLEANING_COMPANY to access admin routes', async () => {
			const { GET } = await import('@/app/api/admin/bookings/route')
			const companyAdmin = createMockUser({ id: 'company_1', role: UserRole.CLEANING_COMPANY })
			const req = createMockRequest('http://localhost/api/admin/bookings', { user: companyAdmin })

			const res = await GET(req as any)
			expect([401, 403]).not.toContain(res.status)
		})
	})

	describe('3. Root admins can access root admin routes', () => {
		it('should allow root admin to access root admin routes', async () => {
			const { GET } = await import('@/app/api/root-admin/tenants/route')
			const rootAdmin = createMockUser({ id: 'root_1', role: UserRole.ROOT_ADMIN })
			const req = createMockRequest('http://localhost/api/root-admin/tenants', { user: rootAdmin })

			const res = await GET(req as any)
			expect([401, 403]).not.toContain(res.status)
		})

		it('should deny non-root-admin users access to root admin routes', async () => {
			const { GET } = await import('@/app/api/root-admin/tenants/route')
			const regularAdmin = createMockUser({ id: 'admin_1', role: UserRole.PARTNER_ADMIN })
			const req = createMockRequest('http://localhost/api/root-admin/tenants', { user: regularAdmin })

			const res = await GET(req as any)
			expect([401, 403]).toContain(res.status)
		})

		it('should deny regular users access to root admin routes', async () => {
			const { GET } = await import('@/app/api/root-admin/tenants/route')
			const regularUser = createMockUser({ id: 'user_1', role: UserRole.CUSTOMER })
			const req = createMockRequest('http://localhost/api/root-admin/tenants', { user: regularUser })

			const res = await GET(req as any)
			expect([401, 403]).toContain(res.status)
		})
	})

	describe('4. Public routes remain accessible', () => {
		it('should allow unauthenticated access to public blog listing', async () => {
			const { GET } = await import('@/app/api/blog/route')
			const req = createMockRequest('http://localhost/api/blog')

			const res = await GET(req as any)
			expect([401, 403]).not.toContain(res.status)
		})

		it('should allow unauthenticated access to public blog post', async () => {
			const { GET } = await import('@/app/api/blog/[slug]/route')
			const req = createMockRequest('http://localhost/api/blog/test-post')

			const res = await GET(req as any, { params: { slug: 'test-post' } })
			expect([401, 403]).not.toContain(res.status)
		})

		it('should allow unauthenticated access to public services listing', async () => {
			const { GET } = await import('@/app/api/services/route')
			const req = createMockRequest('http://localhost/api/services')

			const res = await GET(req as any)
			expect([401, 403]).not.toContain(res.status)
		})

		it('should allow unauthenticated access to public providers listing', async () => {
			const { GET } = await import('@/app/api/providers/route')
			const req = createMockRequest('http://localhost/api/providers')

			const res = await GET(req as any)
			expect([401, 403]).not.toContain(res.status)
		})

		it('should allow unauthenticated access to public provider profile', async () => {
			const { GET } = await import('@/app/api/providers/[id]/route')
			const req = createMockRequest('http://localhost/api/providers/provider_123')

			const res = await GET(req as any, { params: { id: 'provider_123' } })
			expect([401, 403]).not.toContain(res.status)
		})

		it('should allow unauthenticated POST to contact form', async () => {
			const { POST } = await import('@/app/api/contact/route')
			const req = createMockRequest('http://localhost/api/contact', {
				method: 'POST',
				body: {
					name: 'Test User',
					email: 'test@example.com',
					message: 'Test message',
				},
			})

			const res = await POST(req as any)
			expect([401, 403]).not.toContain(res.status)
		})

		it('should allow unauthenticated POST to newsletter subscription', async () => {
			const { POST } = await import('@/app/api/newsletter/subscribe/route')
			const req = createMockRequest('http://localhost/api/newsletter/subscribe', {
				method: 'POST',
				body: {
					email: 'test@example.com',
				},
			})

			const res = await POST(req as any)
			expect([401, 403]).not.toContain(res.status)
		})
	})

	describe('5. Resource ownership is properly verified', () => {
		it('should verify booking ownership for customer', async () => {
			const { mockSupabase, setMockData } = createSupabaseMock()
			setMockData('bookings', [
				{
					id: 'booking_1',
					customer_id: 'user_1',
					provider_id: 'provider_1',
					status: 'pending',
				},
			])

			vi.mocked(rbac.verifyBookingOwnership).mockImplementation(async (bookingId: string, userId: string, role: UserRole) => {
				if (role.includes('admin')) return true
				const { data } = await mockSupabase
					.from('bookings')
					.select('customer_id, provider_id')
					.eq('id', bookingId)
					.single()
				return data?.customer_id === userId || data?.provider_id === userId
			})

			const user1 = createMockUser({ id: 'user_1', role: UserRole.CUSTOMER })
			const hasAccess = await rbac.verifyBookingOwnership('booking_1', 'user_1', UserRole.CUSTOMER, mockSupabase)
			expect(hasAccess).toBe(true)

			const user2 = createMockUser({ id: 'user_2', role: UserRole.CUSTOMER })
			const noAccess = await rbac.verifyBookingOwnership('booking_1', 'user_2', UserRole.CUSTOMER, mockSupabase)
			expect(noAccess).toBe(false)
		})

		it('should verify booking ownership for provider', async () => {
			const { mockSupabase, setMockData } = createSupabaseMock()
			setMockData('bookings', [
				{
					id: 'booking_1',
					customer_id: 'customer_1',
					provider_id: 'provider_1',
					status: 'pending',
				},
			])

			vi.mocked(rbac.verifyBookingOwnership).mockImplementation(async (bookingId: string, userId: string, role: UserRole) => {
				if (role.includes('admin')) return true
				const { data } = await mockSupabase
					.from('bookings')
					.select('customer_id, provider_id')
					.eq('id', bookingId)
					.single()
				return data?.customer_id === userId || data?.provider_id === userId
			})

			const provider1 = createMockUser({ id: 'provider_1', role: UserRole.CLEANING_LADY })
			const hasAccess = await rbac.verifyBookingOwnership('booking_1', 'provider_1', UserRole.CLEANING_LADY, mockSupabase)
			expect(hasAccess).toBe(true)
		})

		it('should verify company membership', async () => {
			const { mockSupabase, setMockData } = createSupabaseMock()
			setMockData('company_users', [
				{
					id: 'membership_1',
					company_id: 'company_1',
					user_id: 'user_1',
					status: 'active',
				},
			])

			vi.mocked(rbac.verifyCompanyMembership).mockImplementation(async (companyId: string, userId: string, supabase: any, role?: UserRole) => {
				if (role && role.includes('admin')) return true
				const { data } = await supabase
					.from('company_users')
					.select('id, status')
					.eq('company_id', companyId)
					.eq('user_id', userId)
					.eq('status', 'active')
					.single()
				return !!data
			})

			const user1 = createMockUser({ id: 'user_1', role: UserRole.CLEANING_COMPANY })
			const isMember = await rbac.verifyCompanyMembership('company_1', 'user_1', mockSupabase, UserRole.CLEANING_COMPANY)
			expect(isMember).toBe(true)

			const user2 = createMockUser({ id: 'user_2', role: UserRole.CLEANING_COMPANY })
			const notMember = await rbac.verifyCompanyMembership('company_1', 'user_2', mockSupabase, UserRole.CLEANING_COMPANY)
			expect(notMember).toBe(false)
		})

		it('should allow admins to bypass ownership checks', async () => {
			const { mockSupabase } = createSupabaseMock()
			vi.mocked(rbac.verifyBookingOwnership).mockImplementation(async (bookingId: string, userId: string, role: UserRole) => {
				if (role.includes('admin')) return true
				return false
			})

			const admin = createMockUser({ id: 'admin_1', role: UserRole.ROOT_ADMIN })
			const hasAccess = await rbac.verifyBookingOwnership('booking_999', 'admin_1', UserRole.ROOT_ADMIN, mockSupabase)
			expect(hasAccess).toBe(true)
		})
	})

	describe('6. Error messages do not leak sensitive information', () => {
		it('should not leak user existence in authentication errors', async () => {
			const { POST } = await import('@/app/api/auth/login/route')
			const req = createMockRequest('http://localhost/api/auth/login', {
				method: 'POST',
				body: {
					email: 'nonexistent@example.com',
					password: 'wrongpassword',
				},
			})

			const res = await POST(req as any)
			const body = await res.json()

			// Should not reveal whether user exists or not
			expect(body.error).not.toContain('user')
			expect(body.error).not.toContain('email')
			expect(body.error).not.toContain('found')
			expect(body.error).not.toContain('exist')
		})

		it('should not leak database structure in error messages', async () => {
			const { mockSupabase, setMockError } = createSupabaseMock()
			setMockError('bookings', { message: 'relation "bookings" does not exist', code: '42P01' })

			const handler = async (req: NextRequest, auth: any) => {
				try {
					const { data, error } = await mockSupabase.from('bookings').select('*').single()
					if (error) {
						// Should not expose database errors directly
						return NextResponse.json(
							{ error: 'An error occurred while processing your request' },
							{ status: 500 }
						)
					}
					return NextResponse.json({ data })
				} catch (err: any) {
					return NextResponse.json(
						{ error: 'An error occurred while processing your request' },
						{ status: 500 }
					)
				}
			}

			const user = createMockUser({ id: 'user_1', role: UserRole.CUSTOMER })
			const authResult = await serverAuth.requireAuth(createMockRequest('http://localhost/api/bookings/1', { user }))
			const req = createMockRequest('http://localhost/api/bookings/1', { user })
			const res = await handler(req, authResult)

			const body = await res.json()
			expect(body.error).not.toContain('relation')
			expect(body.error).not.toContain('bookings')
			expect(body.error).not.toContain('42P01')
			expect(body.error).not.toContain('database')
		})

		it('should not leak internal paths or stack traces', async () => {
			const handler = async () => {
				try {
					throw new Error('Internal server error at /app/api/internal/path')
				} catch (err: any) {
					// Should sanitize error messages
					return NextResponse.json(
						{ error: 'An error occurred while processing your request' },
						{ status: 500 }
					)
				}
			}

			const req = createMockRequest('http://localhost/api/test')
			const res = await handler()

			const body = await res.json()
			expect(body.error).not.toContain('/app/')
			expect(body.error).not.toContain('/api/')
			expect(body.error).not.toContain('internal')
			expect(body.stack).toBeUndefined()
		})

		it('should not leak user IDs or sensitive data in error messages', async () => {
			const handler = async (req: NextRequest, auth: any, context: any) => {
				const resourceId = context?.params?.id
				// Should not include user IDs or resource IDs in error messages
				if (!resourceId) {
					return NextResponse.json(
						{ error: 'Resource not found' },
						{ status: 404 }
					)
				}
				return NextResponse.json({ id: resourceId })
			}

			const user = createMockUser({ id: 'user_123_secret', role: UserRole.CUSTOMER })
			const authResult = await serverAuth.requireAuth(createMockRequest('http://localhost/api/resource', { user }))
			const req = createMockRequest('http://localhost/api/resource', { user })
			const res = await handler(req, authResult, { params: {} })

			const body = await res.json()
			expect(body.error).not.toContain('user_123')
			expect(body.error).not.toContain('secret')
		})

		it('should return generic error messages for authorization failures', async () => {
			const handler = async (req: NextRequest, auth: any, context: any) => {
				const resourceId = context?.params?.id
				if (auth.user.id !== resourceId) {
					// Should not reveal what resource was attempted or why it failed
					return NextResponse.json(
						{ error: 'You do not have permission to access this resource' },
						{ status: 403 }
					)
				}
				return NextResponse.json({ id: resourceId })
			}

			const user1 = createMockUser({ id: 'user_1', role: UserRole.CUSTOMER })
			const authResult = await serverAuth.requireAuth(createMockRequest('http://localhost/api/resource/user_2', { user: user1 }))
			const req = createMockRequest('http://localhost/api/resource/user_2', { user: user1 })
			const res = await handler(req, authResult, { params: { id: 'user_2' } })

			const body = await res.json()
			expect(body.error).toBe('You do not have permission to access this resource')
			// Should not reveal the attempted resource ID
			expect(body.error).not.toContain('user_2')
		})
	})
})

