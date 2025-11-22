import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'
import { refreshAllLeaderboards, refreshLeaderboard } from '@/lib/gamification/leaderboard-scheduler'
import type { UserType, LeaderboardType } from '@/lib/gamification/types'

/**
 * POST /api/gamification/leaderboards/refresh
 * Manually trigger leaderboard refresh (root admin only)
 */
export const POST = withRootAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}))
    const { type, userType, timeframe, tenantId } = body

    // If specific parameters provided, refresh specific leaderboard
    if (type && userType && timeframe) {
      await refreshLeaderboard(
        type as LeaderboardType,
        userType as UserType,
        timeframe as 'daily' | 'weekly' | 'monthly' | 'all_time',
        tenantId || null
      )

      return NextResponse.json({
        success: true,
        message: `Refreshed ${type} leaderboard for ${userType} (${timeframe})`,
      })
    }

    // Otherwise, refresh all leaderboards
    await refreshAllLeaderboards({ tenantId: tenantId || null })

    return NextResponse.json({
      success: true,
      message: 'All leaderboards refreshed successfully',
    })
  } catch (error: any) {
    console.error('[gamification] leaderboard refresh error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to refresh leaderboards' },
      { status: 500 }
    )
  }
})

/**
 * GET /api/gamification/leaderboards/refresh
 * Get refresh status (for monitoring)
 */
export const GET = withRootAdmin(async (req: NextRequest) => {
  try {
    return NextResponse.json({
      status: 'ok',
      message: 'Leaderboard refresh endpoint is active',
      endpoints: {
        refresh: 'POST /api/gamification/leaderboards/refresh',
        schedule: 'Use cron job or scheduled task to call POST endpoint',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
})

