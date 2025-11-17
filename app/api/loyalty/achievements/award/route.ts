import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()
		const userId = body.user_id as string
		const code = (body.code as string)?.trim()
		if (!userId || !code) {
			return NextResponse.json({ error: 'Missing user_id or code' }, { status: 400 })
		}
		const supabase = createServerSupabase()
		await supabase.rpc('ensure_loyalty_account', { p_user_id: userId })

		const { data: achievement, error: aErr } = await supabase
			.from('achievements')
			.select('*')
			.eq('code', code)
			.single()
		if (aErr || !achievement) {
			return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })
		}

		if (achievement.once_per_user) {
			const { data: existing } = await supabase
				.from('user_achievements')
				.select('user_id')
				.eq('user_id', userId)
				.eq('achievement_id', achievement.id)
			if (existing && existing.length > 0) {
				return NextResponse.json({ ok: true, alreadyAwarded: true })
			}
		}

		await supabase.from('user_achievements').insert({
			user_id: userId,
			achievement_id: achievement.id,
		} as any)

		if ((achievement.bonus_points ?? 0) > 0) {
			await supabase.from('loyalty_transactions').insert({
				user_id: userId,
				delta_points: achievement.bonus_points,
				source_type: 'badge',
				metadata: { code },
			} as any)
			const { data: acc } = await supabase
				.from('loyalty_accounts')
				.select('points_balance')
				.eq('user_id', userId)
				.single()
			await supabase
				.from('loyalty_accounts')
				.update({ points_balance: (acc?.points_balance ?? 0) + achievement.bonus_points })
				.eq('user_id', userId)
		}

		return NextResponse.json({ ok: true })
	} catch (e) {
		console.error('[loyalty] achievements award error', e)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}


