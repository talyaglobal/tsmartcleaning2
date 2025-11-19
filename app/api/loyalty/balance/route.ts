import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'

export const GET = withAuth(async (req: NextRequest, auth) => {
	try {
		const { searchParams } = new URL(req.url)
		const requestedUserId = searchParams.get('user_id') || req.headers.get('x-user-id')
		
		// Use authenticated user ID if no user_id provided, otherwise verify ownership
		const userId = requestedUserId || auth.user.id
		const isAdmin = isAdminRole(auth.user.role)
		
		// Verify user can only access their own balance (unless admin)
		if (!isAdmin && userId !== auth.user.id) {
			return NextResponse.json(
				{ error: 'You can only view your own loyalty balance' },
				{ status: 403 }
			)
		}

		// ensure account exists
		await auth.supabase.rpc('ensure_loyalty_account', { p_user_id: userId })

		const { data: account, error } = await auth.supabase
			.from('loyalty_accounts')
			.select('*')
			.eq('user_id', userId)
			.single()

		if (error || !account) {
			console.error('[loyalty] balance fetch error', error)
			return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 })
		}

		const tierBonusMap: Record<string, number> = {
			Bronze: 0,
			Silver: 0.1,
			Gold: 0.2,
			Platinum: 0.3,
		}
		const tierOrder = ['Bronze', 'Silver', 'Gold', 'Platinum']
		const thresholds = {
			Bronze: 0,
			Silver: 1000,
			Gold: 5000,
			Platinum: 15000,
		}
		const nextTier =
			account.tier === 'Platinum'
				? 'Platinum'
				: tierOrder[tierOrder.indexOf(account.tier) + 1]
		const nextThreshold =
			account.tier === 'Platinum' ? thresholds.Platinum : (thresholds as any)[nextTier]
		const progressToNext =
			account.tier === 'Platinum'
				? 1
				: Math.max(0, Math.min(1, account.tier_points_12m / nextThreshold))

		return NextResponse.json({
			points: account.points_balance,
			tier: account.tier,
			tierPoints12m: account.tier_points_12m,
			tierBonus: tierBonusMap[account.tier] ?? 0,
			streakCount: account.streak_count,
			lastBookingAt: account.last_booking_at,
			progressToNext,
			nextTier,
			nextThreshold,
		})
	} catch (e) {
		console.error('[loyalty] balance error', e)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
	}
)


