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
					{ error: 'You can only view your own achievements' },
					{ status: 403 }
				)
			}

			// Get all available achievements
			const { data: allAchievements, error: achievementsError } = await supabase
				.from('achievements')
				.select('*')
				.order('created_at', { ascending: false })

			if (achievementsError) {
				console.error('[loyalty] achievements fetch error', achievementsError)
				return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
			}

			// Get user's earned achievements
			const { data: userAchievements, error: userAchievementsError } = await supabase
				.from('user_achievements')
				.select('achievement_id, awarded_at')
				.eq('user_id', userId)

			if (userAchievementsError) {
				console.error('[loyalty] user achievements fetch error', userAchievementsError)
				return NextResponse.json({ error: 'Failed to fetch user achievements' }, { status: 500 })
			}

			const earnedAchievementIds = new Set((userAchievements || []).map(ua => ua.achievement_id))

			// Combine achievements with user's earned status
			const achievementsWithStatus = (allAchievements || []).map(achievement => ({
				...achievement,
				earned: earnedAchievementIds.has(achievement.id),
				awardedAt: userAchievements?.find(ua => ua.achievement_id === achievement.id)?.awarded_at || null,
			}))

			return NextResponse.json({ achievements: achievementsWithStatus })
		} catch (e) {
			console.error('[loyalty] achievements error', e)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	}
)

