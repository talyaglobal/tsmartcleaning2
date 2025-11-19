import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createMockRequest, createMockUser } from '@/tests/utils/test-helpers'
import { UserRole } from '@/lib/auth/roles'
import { createSupabaseMock } from '@/tests/utils/supabase-mock'

// Create mock instance
const { mockSupabase, setMockData, setMockError, clearMocks } = createSupabaseMock()

// Mock Supabase
vi.mock('@/lib/supabase', () => {
	return {
		createServerSupabase: vi.fn(() => mockSupabase),
		createAnonSupabase: vi.fn(() => mockSupabase),
	}
})

// Mock auth functions
vi.mock('@/lib/auth/rbac', async () => {
	const actual = await vi.importActual('@/lib/auth/rbac')
	return {
		...actual,
		withAuth: vi.fn((handler: any) => {
			return async (req: NextRequest) => {
				const url = new URL(req.url)
				const userId = url.searchParams.get('user_id') || req.headers.get('x-user-id') || 'user_123'
				const role = (req.headers.get('x-user-role') as UserRole) || UserRole.CUSTOMER
				let body = {}
				if (req.method === 'POST') {
					try {
						body = await req.json()
					} catch {
						body = {}
					}
				}
				
				return handler(req, {
					user: {
						id: (body as any).user_id || userId,
						email: 'test@example.com',
						role,
						name: 'Test User',
						isActive: true,
					},
					supabase: mockSupabase,
				})
			}
		}),
		isAdminRole: vi.fn((role: UserRole) => {
			return [UserRole.ROOT_ADMIN, UserRole.PARTNER_ADMIN, UserRole.TSMART_TEAM, UserRole.CLEANING_COMPANY].includes(role)
		}),
	}
})

// Import routes after mocks
import { GET as getBalance } from '@/app/api/loyalty/balance/route'
import { POST as earnPoints } from '@/app/api/loyalty/earn/route'
import { POST as redeemPoints } from '@/app/api/loyalty/redeem/route'
import { GET as getTransactions } from '@/app/api/loyalty/transactions/route'
import { POST as completeReferral } from '@/app/api/loyalty/referral/complete/route'
import { POST as awardAchievement } from '@/app/api/loyalty/achievements/award/route'
import { POST as milestoneTenBooking } from '@/app/api/loyalty/milestone/ten-booking/route'

describe('Loyalty System API Tests', () => {
	const testUserId = 'user_123'
	const testAdminId = 'admin_123'

	beforeEach(() => {
		vi.clearAllMocks()
		clearMocks()
		
		// Setup default mock responses
		mockSupabase.rpc.mockResolvedValue({ data: null, error: null })
	})

	describe('GET /api/loyalty/balance', () => {
		it('should return loyalty balance for authenticated user', async () => {
			const mockAccount = {
				user_id: testUserId,
				points_balance: 5000,
				tier: 'Gold',
				tier_points_12m: 6000,
				streak_count: 3,
				last_booking_at: new Date().toISOString(),
				dob_month: null,
				dob_day: null,
			}

			setMockData('loyalty_accounts', [mockAccount])

			const req = createMockRequest(`/api/loyalty/balance?user_id=${testUserId}`, {
				method: 'GET',
				user: createMockUser({ id: testUserId, role: UserRole.CUSTOMER }),
			})

			const response = await getBalance(req)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data).toHaveProperty('points', 5000)
			expect(data).toHaveProperty('tier', 'Gold')
			expect(data).toHaveProperty('tierPoints12m', 6000)
			expect(data).toHaveProperty('tierBonus', 0.2)
			expect(data).toHaveProperty('streakCount', 3)
		})

		it('should prevent users from accessing other users balance', async () => {
			const req = createMockRequest('/api/loyalty/balance?user_id=other_user', {
				method: 'GET',
				user: createMockUser({ id: testUserId, role: UserRole.CUSTOMER }),
			})

			const response = await getBalance(req)
			const data = await response.json()

			expect(response.status).toBe(403)
			expect(data).toHaveProperty('error')
		})

		it('should allow admins to access any user balance', async () => {
			const mockAccount = {
				user_id: 'other_user',
				points_balance: 2000,
				tier: 'Silver',
				tier_points_12m: 1500,
				streak_count: 1,
				last_booking_at: null,
			}

			setMockData('loyalty_accounts', [mockAccount])

			const req = createMockRequest('/api/loyalty/balance?user_id=other_user', {
				method: 'GET',
				user: createMockUser({ id: testAdminId, role: UserRole.ROOT_ADMIN }),
			})

			const response = await getBalance(req)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data).toHaveProperty('points', 2000)
		})
	})

	describe('POST /api/loyalty/earn', () => {
		it('should earn points for a booking', async () => {
			const mockAccount = {
				user_id: testUserId,
				points_balance: 1000,
				tier: 'Bronze',
				tier_points_12m: 500,
				streak_count: 1,
				last_booking_at: null,
				dob_month: null,
			}

			setMockData('loyalty_accounts', [mockAccount])

			const req = createMockRequest('/api/loyalty/earn', {
				method: 'POST',
				body: { user_id: testUserId, eligible_spend: 100 },
				user: createMockUser({ id: testUserId, role: UserRole.CUSTOMER }),
			})

			const response = await earnPoints(req)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data).toHaveProperty('pointsEarned')
			expect(data).toHaveProperty('newBalance')
			expect(data.pointsEarned).toBeGreaterThan(0)
		})

		it('should apply tier bonus correctly', async () => {
			const mockAccount = {
				user_id: testUserId,
				points_balance: 5000,
				tier: 'Gold',
				tier_points_12m: 6000,
				streak_count: 5,
				last_booking_at: new Date().toISOString(),
				dob_month: null,
			}

			setMockData('loyalty_accounts', [mockAccount])

			const req = createMockRequest('/api/loyalty/earn', {
				method: 'POST',
				body: { user_id: testUserId, eligible_spend: 100 },
				user: createMockUser({ id: testUserId, role: UserRole.CUSTOMER }),
			})

			const response = await earnPoints(req)
			const data = await response.json()

			expect(response.status).toBe(200)
			// Gold tier has 20% bonus, so 100 * 1.2 = 120 points
			expect(data.pointsEarned).toBe(120)
		})

		it('should reject invalid eligible_spend', async () => {
			const req = createMockRequest('/api/loyalty/earn', {
				method: 'POST',
				body: { user_id: testUserId, eligible_spend: -10 },
				user: createMockUser({ id: testUserId, role: UserRole.CUSTOMER }),
			})

			const response = await earnPoints(req)
			const data = await response.json()

			expect(response.status).toBe(400)
			expect(data).toHaveProperty('error')
		})
	})

	describe('POST /api/loyalty/redeem', () => {
		it('should redeem points successfully', async () => {
			const mockAccount = {
				user_id: testUserId,
				points_balance: 1000,
			}

			setMockData('loyalty_accounts', [mockAccount])

			const req = createMockRequest('/api/loyalty/redeem', {
				method: 'POST',
				body: {
					user_id: testUserId,
					requested_points: 500,
					order_subtotal: 200,
					cap_percent: 50,
				},
				user: createMockUser({ id: testUserId, role: UserRole.CUSTOMER }),
			})

			const response = await redeemPoints(req)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data).toHaveProperty('appliedPoints')
			expect(data).toHaveProperty('creditAmount')
			expect(data.appliedPoints).toBeGreaterThan(0)
		})

		it('should reject redemption below minimum', async () => {
			const mockAccount = {
				user_id: testUserId,
				points_balance: 50,
			}

			setMockData('loyalty_accounts', [mockAccount])

			const req = createMockRequest('/api/loyalty/redeem', {
				method: 'POST',
				body: {
					user_id: testUserId,
					requested_points: 50,
					order_subtotal: 200,
				},
				user: createMockUser({ id: testUserId, role: UserRole.CUSTOMER }),
			})

			const response = await redeemPoints(req)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data.reason).toBe('BELOW_MINIMUM')
			expect(data.appliedPoints).toBe(0)
		})

		it('should respect cap percent limit', async () => {
			const mockAccount = {
				user_id: testUserId,
				points_balance: 10000,
			}

			setMockData('loyalty_accounts', [mockAccount])

			const req = createMockRequest('/api/loyalty/redeem', {
				method: 'POST',
				body: {
					user_id: testUserId,
					requested_points: 10000,
					order_subtotal: 200,
					cap_percent: 50,
				},
				user: createMockUser({ id: testUserId, role: UserRole.CUSTOMER }),
			})

			const response = await redeemPoints(req)
			const data = await response.json()

			expect(response.status).toBe(200)
			// Cap is 50% of $200 = $100, which is 1000 points max
			expect(data.appliedPoints).toBeLessThanOrEqual(1000)
		})
	})

	describe('GET /api/loyalty/transactions', () => {
		it('should return transaction history', async () => {
			const mockTransactions = [
				{
					id: 'tx_1',
					user_id: testUserId,
					delta_points: 100,
					source_type: 'earn',
					source_id: null,
					metadata: {},
					created_at: new Date().toISOString(),
				},
				{
					id: 'tx_2',
					user_id: testUserId,
					delta_points: -50,
					source_type: 'redemption',
					source_id: null,
					metadata: {},
					created_at: new Date().toISOString(),
				},
			]

			setMockData('loyalty_transactions', mockTransactions)

			const req = createMockRequest(`/api/loyalty/transactions?user_id=${testUserId}&limit=50`, {
				method: 'GET',
				user: createMockUser({ id: testUserId, role: UserRole.CUSTOMER }),
			})

			const response = await getTransactions(req)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data).toHaveProperty('transactions')
			expect(data.transactions).toHaveLength(2)
		})
	})

	describe('POST /api/loyalty/referral/complete', () => {
		it('should complete referral and award points', async () => {
			const referrerId = 'referrer_123'
			const refereeId = 'referee_123'

			setMockData('referrals', [])
			setMockData('loyalty_accounts', [
				{ user_id: referrerId, points_balance: 0 },
				{ user_id: refereeId, points_balance: 0 },
			])

			const req = createMockRequest('/api/loyalty/referral/complete', {
				method: 'POST',
				body: {
					referrer_id: referrerId,
					referee_id: refereeId,
				},
			})

			const response = await completeReferral(req)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data).toHaveProperty('ok', true)
		})

		it('should be idempotent for already completed referrals', async () => {
			const referrerId = 'referrer_123'
			const refereeId = 'referee_123'

			setMockData('referrals', [{
				id: 'ref_123',
				referrer_id: referrerId,
				referee_id: refereeId,
				status: 'completed',
				rewarded_at: new Date().toISOString(),
			}])

			const req = createMockRequest('/api/loyalty/referral/complete', {
				method: 'POST',
				body: {
					referrer_id: referrerId,
					referee_id: refereeId,
				},
			})

			const response = await completeReferral(req)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data).toHaveProperty('ok', true)
			expect(data).toHaveProperty('alreadyRewarded', true)
		})
	})

	describe('POST /api/loyalty/achievements/award', () => {
		it('should award achievement to user', async () => {
			const achievementCode = 'first_booking'
			const mockAchievement = {
				id: 'ach_123',
				code: achievementCode,
				name: 'First Booking',
				bonus_points: 100,
				once_per_user: true,
			}

			setMockData('achievements', [mockAchievement])
			setMockData('user_achievements', [])
			setMockData('loyalty_accounts', [{ user_id: testUserId, points_balance: 0 }])

			const req = createMockRequest('/api/loyalty/achievements/award', {
				method: 'POST',
				body: {
					user_id: testUserId,
					code: achievementCode,
				},
			})

			const response = await awardAchievement(req)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data).toHaveProperty('ok', true)
		})

		it('should not award duplicate achievements if once_per_user is true', async () => {
			const achievementCode = 'first_booking'
			const mockAchievement = {
				id: 'ach_123',
				code: achievementCode,
				name: 'First Booking',
				bonus_points: 100,
				once_per_user: true,
			}

			setMockData('achievements', [mockAchievement])
			setMockData('user_achievements', [{ user_id: testUserId, achievement_id: 'ach_123' }])

			const req = createMockRequest('/api/loyalty/achievements/award', {
				method: 'POST',
				body: {
					user_id: testUserId,
					code: achievementCode,
				},
			})

			const response = await awardAchievement(req)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data).toHaveProperty('ok', true)
			expect(data).toHaveProperty('alreadyAwarded', true)
		})
	})

	describe('POST /api/loyalty/milestone/ten-booking', () => {
		it('should award points for 10th booking milestone', async () => {
			setMockData('loyalty_accounts', [{ user_id: testUserId, points_balance: 1000 }])

			const req = createMockRequest('/api/loyalty/milestone/ten-booking', {
				method: 'POST',
				body: {
					user_id: testUserId,
					choice: 'points',
				},
			})

			const response = await milestoneTenBooking(req)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data).toHaveProperty('ok', true)
		})

		it('should record upgrade benefit for 10th booking milestone', async () => {
			setMockData('loyalty_accounts', [{ user_id: testUserId, points_balance: 1000 }])

			const req = createMockRequest('/api/loyalty/milestone/ten-booking', {
				method: 'POST',
				body: {
					user_id: testUserId,
					choice: 'upgrade',
				},
			})

			const response = await milestoneTenBooking(req)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data).toHaveProperty('ok', true)
		})
	})
})

