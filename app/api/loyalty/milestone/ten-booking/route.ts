import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

// Awards the 10th booking milestone: either 300 points (default) or metadata-only upgrade marker
export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const userId = body.user_id as string
		const choice = (body.choice as 'points' | 'upgrade') ?? 'points'
		if (!userId) {
			return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
		}
		const supabase = createServerSupabase()
		await supabase.rpc('ensure_loyalty_account', { p_user_id: userId })

		if (choice === 'points') {
			const bonus = 300
			await supabase.from('loyalty_transactions').insert({
				user_id: userId,
				delta_points: bonus,
				source_type: 'milestone',
				metadata: { milestone: '10th_booking' },
			} as any)
			const { data: acc } = await supabase
				.from('loyalty_accounts')
				.select('points_balance')
				.eq('user_id', userId)
				.single()
			await supabase
				.from('loyalty_accounts')
				.update({ points_balance: (acc?.points_balance ?? 0) + bonus })
				.eq('user_id', userId)
		} else {
			// record upgrade benefit issuance (no point change)
			await supabase.from('loyalty_transactions').insert({
				user_id: userId,
				delta_points: 0,
				source_type: 'milestone',
				metadata: { milestone: '10th_booking', benefit: 'free_upgrade' },
			} as any)
		}

		return NextResponse.json({ ok: true })
	} catch (e) {
		console.error('[loyalty] milestone ten-booking error', e)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


