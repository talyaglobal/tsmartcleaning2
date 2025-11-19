import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'

function getTierBonus(tier: string): number {
	switch (tier) {
		case 'Silver':
			return 0.1
		case 'Gold':
			return 0.2
		case 'Platinum':
			return 0.3
		default:
			return 0
	}
}

export const POST = withAuth(
	async (request: NextRequest, { user, supabase }) => {
		try {
			const now = new Date()
			const body = await request.json()
			const requestedUserId = body.user_id
			const eligibleSpend = Number(body.eligible_spend ?? 0)

			// If user_id is provided, verify the authenticated user owns it (unless admin)
			const userId = requestedUserId || user.id
			const isAdmin = isAdminRole(user.role)
			
			if (!isAdmin && userId !== user.id) {
				return NextResponse.json(
					{ error: 'You can only earn points for your own account' },
					{ status: 403 }
				)
			}
			
			if (!Number.isFinite(eligibleSpend) || eligibleSpend < 0) {
				return NextResponse.json({ error: 'Invalid eligible_spend' }, { status: 400 })
			}

			await supabase.rpc('ensure_loyalty_account', { p_user_id: userId })
			const { data: account, error: accErr } = await supabase
				.from('loyalty_accounts')
				.select('*')
				.eq('user_id', userId)
				.single()
			if (accErr || !account) {
				console.error('[loyalty] earn load account error', accErr)
				return NextResponse.json({ error: 'Account not found' }, { status: 500 })
			}

				const isBirthdayMonth =
				account.dob_month && Number(account.dob_month) === now.getUTCMonth() + 1
			const tierBonus = getTierBonus(account.tier)
			let hasStreakBonus = false
			if (account.last_booking_at) {
				const last = new Date(account.last_booking_at)
				const msDiff = now.getTime() - last.getTime()
				const days = msDiff / (1000 * 60 * 60 * 24)
				if (days <= 35 && Number(account.streak_count ?? 0) >= 2) {
					hasStreakBonus = true
				}
			}

			let points = eligibleSpend
			if (isBirthdayMonth) points *= 2
			points *= 1 + tierBonus
			if (hasStreakBonus) points *= 1.1
			points = Math.floor(points)

			// ledger
			const { error: txErr } = await supabase.from('loyalty_transactions').insert({
				user_id: userId,
			delta_points: points,
			source_type: 'earn',
			metadata: {
				eligible_spend: eligibleSpend,
				isBirthdayMonth,
				tier: account.tier,
				tierBonus,
				streakBonus: hasStreakBonus,
			},
			} as any)
			if (txErr) {
				console.error('[loyalty] earn insert tx error', txErr)
				return NextResponse.json({ error: 'Failed to record earning' }, { status: 500 })
			}

			// update streak
			let nextStreak = 1
			if (account.last_booking_at) {
				const last = new Date(account.last_booking_at)
				const msDiff = now.getTime() - last.getTime()
				const days = msDiff / (1000 * 60 * 60 * 24)
				if (days <= 35) nextStreak = Number(account.streak_count ?? 0) + 1
			}

			// update balance and tier points
			const { data: updated, error: updErr } = await supabase
				.from('loyalty_accounts')
				.update({
					points_balance: (account.points_balance ?? 0) + points,
					tier_points_12m: (account.tier_points_12m ?? 0) + points,
					last_booking_at: now.toISOString(),
					streak_count: nextStreak,
				})
				.eq('user_id', userId)
				.select('points_balance, tier_points_12m, tier')
				.single()
			if (updErr) {
				console.error('[loyalty] earn update account error', updErr)
				return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
			}

			// Optional: recompute tier from thresholds
			const thresholds = { Silver: 1000, Gold: 5000, Platinum: 15000 }
			let newTier = updated.tier
			if (updated.tier_points_12m >= thresholds.Platinum) newTier = 'Platinum'
			else if (updated.tier_points_12m >= thresholds.Gold) newTier = 'Gold'
			else if (updated.tier_points_12m >= thresholds.Silver) newTier = 'Silver'
			else newTier = 'Bronze'
			if (newTier !== updated.tier) {
				await supabase.from('loyalty_accounts').update({ tier: newTier }).eq('user_id', userId)
			}

			return NextResponse.json({
				pointsEarned: points,
				newBalance: (updated.points_balance ?? 0),
				newTier,
			})
	} catch (e) {
		console.error('[loyalty] earn error', e)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
	}
)


