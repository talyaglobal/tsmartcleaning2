import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'

export const GET = withAuth(
	async (request: NextRequest, { user, supabase }) => {
		try {
			const { searchParams } = new URL(request.url)
			const requestedUserId = searchParams.get('user_id')
			
			// If user_id is provided, verify the authenticated user owns it (unless admin)
			const userId = requestedUserId || user.id
			const isAdmin = isAdminRole(user.role)
			
			if (!isAdmin && userId !== user.id) {
				return NextResponse.json(
					{ error: 'You can only view your own referrals' },
					{ status: 403 }
				)
			}

			// Get referrals where user is the referrer
			const { data: referralsAsReferrer, error: referrerError } = await supabase
				.from('referrals')
				.select('*')
				.eq('referrer_id', userId)
				.order('created_at', { ascending: false })

			if (referrerError) {
				console.error('[loyalty] referrals as referrer fetch error', referrerError)
				return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 })
			}

			// Get referrals where user is the referee
			const { data: referralsAsReferee, error: refereeError } = await supabase
				.from('referrals')
				.select('*')
				.eq('referee_id', userId)
				.order('created_at', { ascending: false })

			if (refereeError) {
				console.error('[loyalty] referrals as referee fetch error', refereeError)
				return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 })
			}

			// Generate referral code (using user ID as base, can be enhanced)
			const referralCode = userId.substring(0, 8).toUpperCase()

			return NextResponse.json({
				referralCode,
				referralsAsReferrer: referralsAsReferrer || [],
				referralsAsReferee: referralsAsReferee || [],
				stats: {
					totalReferrals: (referralsAsReferrer || []).length,
					completedReferrals: (referralsAsReferrer || []).filter(r => r.status === 'completed').length,
					pendingReferrals: (referralsAsReferrer || []).filter(r => r.status === 'pending').length,
				},
			})
		} catch (e) {
			console.error('[loyalty] referrals error', e)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	}
)

