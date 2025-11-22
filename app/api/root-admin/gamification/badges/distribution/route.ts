import { NextRequest, NextResponse } from 'next/server'
import { withRootAdmin } from '@/lib/auth/rbac'
import { handleApiError } from '@/lib/api/errors'
import { validateQueryParams } from '@/lib/api/validation'
import { createServerSupabase } from '@/lib/supabase'
import { z } from 'zod'

// Get badge distribution statistics
export const GET = withRootAdmin(async (request: NextRequest) => {
  try {
    const querySchema = z.object({
      userType: z.enum(['company', 'cleaner']).optional(),
    })

    const validation = validateQueryParams(request, querySchema)
    if (!validation.success) {
      return validation.response
    }

    const supabase = createServerSupabase()
    const { userType } = validation.data

    // Get all badges
    let badgesQuery = supabase.from('gamification_badges').select('*')

    if (userType) {
      badgesQuery = badgesQuery.eq('user_type', userType)
    }

    const { data: badges, error: badgesError } = await badgesQuery

    if (badgesError) {
      console.error('[gamification] Failed to fetch badges:', badgesError)
      return NextResponse.json({ badges: [], distribution: {} })
    }

    // Get distribution for each badge
    const distribution: Record<string, number> = {}

    for (const badge of badges || []) {
      const { count } = await supabase
        .from('gamification_user_badges')
        .select('*', { count: 'exact', head: true })
        .eq('badge_id', badge.id)

      distribution[badge.id] = count || 0
    }

    // Calculate statistics
    const totalBadges = badges?.length || 0
    const totalEarned = Object.values(distribution).reduce((sum, count) => sum + count, 0)
    const averageEarned = totalBadges > 0 ? totalEarned / totalBadges : 0

    // Get top badges by earn count
    const topBadges = Object.entries(distribution)
      .map(([badgeId, count]) => {
        const badge = badges?.find((b) => b.id === badgeId)
        return {
          badgeId,
          badgeName: badge?.name || 'Unknown',
          count,
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({
      badges: badges || [],
      distribution,
      statistics: {
        totalBadges,
        totalEarned,
        averageEarned: Math.round(averageEarned * 100) / 100,
      },
      topBadges,
    })
  } catch (error) {
    return handleApiError('root-admin/gamification/badges/distribution', error)
  }
})

