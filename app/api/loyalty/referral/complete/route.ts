import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const referrerId = body.referrer_id as string
		const refereeId = body.referee_id as string
		if (!referrerId || !refereeId || referrerId === refereeId) {
			return NextResponse.json({ error: 'Invalid referrer/referee' }, { status: 400 })
		}
		const supabase = createServerSupabase()

		// Ensure accounts
		await supabase.rpc('ensure_loyalty_account', { p_user_id: referrerId })
		await supabase.rpc('ensure_loyalty_account', { p_user_id: refereeId })

		// Upsert referral
		const { data: existing } = await supabase
			.from('referrals')
			.select('*')
			.eq('referrer_id', referrerId)
			.eq('referee_id', refereeId)
			.maybeSingle()
		if (!existing) {
			await supabase.from('referrals').insert({
				referrer_id: referrerId,
				referee_id: refereeId,
				status: 'completed',
				rewarded_at: new Date().toISOString(),
			} as any)
		} else if (existing.status !== 'completed') {
			await supabase
				.from('referrals')
				.update({ status: 'completed', rewarded_at: new Date().toISOString() })
				.eq('id', existing.id)
		} else {
			// already completed - idempotent
			return NextResponse.json({ ok: true, alreadyRewarded: true })
		}

		// Award points: referrer 500, referee 200
		const awards = [
			{ user_id: referrerId, delta_points: 500, role: 'referrer' },
			{ user_id: refereeId, delta_points: 200, role: 'referee' },
		]
		for (const a of awards) {
			await supabase.from('loyalty_transactions').insert({
				user_id: a.user_id,
				delta_points: a.delta_points,
				source_type: 'referral',
				metadata: { role: a.role, referrerId, refereeId },
			} as any)
			const { data: acc } = await supabase
				.from('loyalty_accounts')
				.select('points_balance')
				.eq('user_id', a.user_id)
				.single()
			await supabase
				.from('loyalty_accounts')
				.update({ points_balance: (acc?.points_balance ?? 0) + a.delta_points })
				.eq('user_id', a.user_id)
		}

		// Award gamification points for referral completion (async, don't block)
		try {
			const { processGamificationUpdates } = await import('@/lib/gamification/integration')
			
			// Determine user type (would need to check user role or company/provider profile)
			// For now, we'll try to determine from user data
			const { data: user } = await supabase
				.from('users')
				.select('role')
				.eq('id', referrerId)
				.single()
			
			// Check if user is a company or cleaner
			const isCompany = user?.role === 'customer' || user?.role === 'cleaning_company'
			const userType = isCompany ? 'company' : 'cleaner'
			
			await processGamificationUpdates(
				{
					supabase,
					userId: referrerId,
					userType,
					tenantId: null,
				},
				'referral_completed',
				{ referralId: existing?.id || 'new', refereeId }
			)
		} catch (gamificationError) {
			// Don't fail the referral if gamification fails
			console.error('[loyalty/referral] Gamification error:', gamificationError)
		}

		return NextResponse.json({ ok: true })
	} catch (e) {
		console.error('[loyalty] referral complete error', e)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


