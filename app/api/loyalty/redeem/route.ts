import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'

export const POST = withAuth(
	async (request: NextRequest, { user, supabase }) => {
		try {
			const body = await request.json()
			const requestedUserId = body.user_id
			const requestedPoints = Number(body.requested_points ?? 0)
			const orderSubtotal = Number(body.order_subtotal ?? 0) // pre-tax, post-discount
			const capPercent = Number(body.cap_percent ?? 50) // optional override

			// If user_id is provided, verify the authenticated user owns it (unless admin)
			const userId = requestedUserId || user.id
			const isAdmin = isAdminRole(user.role)
			
			if (!isAdmin && userId !== user.id) {
				return NextResponse.json(
					{ error: 'You can only redeem points from your own account' },
					{ status: 403 }
				)
			}
		if (!Number.isFinite(requestedPoints) || requestedPoints <= 0) {
			return NextResponse.json({ error: 'Invalid requested_points' }, { status: 400 })
		}
		if (!Number.isFinite(orderSubtotal) || orderSubtotal < 0) {
			return NextResponse.json({ error: 'Invalid order_subtotal' }, { status: 400 })
		}

		const supabase = createServerSupabase()
		await supabase.rpc('ensure_loyalty_account', { p_user_id: userId })
		const { data: account, error: accErr } = await supabase
			.from('loyalty_accounts')
			.select('user_id, points_balance')
			.eq('user_id', userId)
			.single()
		if (accErr || !account) {
			console.error('[loyalty] redeem load account error', accErr)
			return NextResponse.json({ error: 'Account not found' }, { status: 500 })
		}

		// compute usable points
		const maxByBalance = Math.floor(account.points_balance / 10) * 10
		const maxByCap = Math.floor((orderSubtotal * (capPercent / 100)) / 0.1 / 10) * 10
		const minRedeem = 100
		const usable = Math.max(0, Math.min(maxByBalance, maxByCap, Math.floor(requestedPoints / 10) * 10))
		if (usable < minRedeem) {
			return NextResponse.json({ appliedPoints: 0, creditAmount: 0, reason: 'BELOW_MINIMUM' })
		}
		const creditAmount = usable * 0.1

		// apply redemption: ledger + balance update
		const { error: txErr } = await supabase.from('loyalty_transactions').insert({
			user_id: userId,
			delta_points: -usable,
			source_type: 'redemption',
			metadata: { order_subtotal: orderSubtotal, cap_percent: capPercent },
		} as any)
		if (txErr) {
			console.error('[loyalty] redeem insert tx error', txErr)
			return NextResponse.json({ error: 'Failed to record redemption' }, { status: 500 })
		}
		const { error: updErr } = await supabase
			.from('loyalty_accounts')
			.update({ points_balance: account.points_balance - usable })
			.eq('user_id', userId)
		if (updErr) {
			console.error('[loyalty] redeem update balance error', updErr)
			return NextResponse.json({ error: 'Failed to apply redemption' }, { status: 500 })
		}

		return NextResponse.json({ appliedPoints: usable, creditAmount })
	} catch (e) {
		console.error('[loyalty] redeem error', e)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
	}
)


