/**
 * Leaderboard Update Scheduler
 * Handles automatic leaderboard refreshes
 */

import { createServerSupabase } from '@/lib/supabase'
import { getLeaderboard } from './leaderboards'
import type { UserType, LeaderboardType } from './types'

export interface LeaderboardRefreshOptions {
  userTypes?: UserType[]
  types?: LeaderboardType[]
  timeframes?: Array<'daily' | 'weekly' | 'monthly' | 'all_time'>
  tenantId?: string | null
}

/**
 * Refresh all leaderboards
 */
export async function refreshAllLeaderboards(options: LeaderboardRefreshOptions = {}): Promise<void> {
  try {
    const {
      userTypes = ['company', 'cleaner'],
      types = ['points', 'jobs', 'ratings', 'referrals'],
      timeframes = ['daily', 'weekly', 'monthly', 'all_time'],
      tenantId = null,
    } = options

    const supabase = createServerSupabase(tenantId ?? undefined)

    // Refresh each combination
    for (const userType of userTypes) {
      for (const type of types) {
        for (const timeframe of timeframes) {
          try {
            await getLeaderboard(supabase, {
              type,
              timeframe,
              userType,
              limit: 100,
              tenantId,
            })
            console.log(`[leaderboard] Refreshed ${type} leaderboard for ${userType} (${timeframe})`)
          } catch (error) {
            console.error(`[leaderboard] Error refreshing ${type} for ${userType} (${timeframe}):`, error)
          }
        }
      }
    }
  } catch (error) {
    console.error('[leaderboard] refreshAllLeaderboards error:', error)
  }
}

/**
 * Refresh specific leaderboard type
 */
export async function refreshLeaderboard(
  type: LeaderboardType,
  userType: UserType,
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time',
  tenantId?: string | null
): Promise<void> {
  try {
    const supabase = createServerSupabase(tenantId ?? undefined)

    await getLeaderboard(supabase, {
      type,
      timeframe,
      userType,
      limit: 100,
      tenantId,
    })

    console.log(`[leaderboard] Refreshed ${type} leaderboard for ${userType} (${timeframe})`)
  } catch (error) {
    console.error(`[leaderboard] Error refreshing ${type} for ${userType} (${timeframe}):`, error)
  }
}

/**
 * Schedule leaderboard refresh (can be called from cron job or scheduled task)
 */
export async function scheduleLeaderboardRefresh(): Promise<void> {
  try {
    // Refresh daily leaderboards every hour
    await refreshAllLeaderboards({
      timeframes: ['daily'],
    })

    // Refresh weekly leaderboards every 6 hours
    const now = new Date()
    if (now.getHours() % 6 === 0) {
      await refreshAllLeaderboards({
        timeframes: ['weekly'],
      })
    }

    // Refresh monthly leaderboards once per day
    if (now.getHours() === 0) {
      await refreshAllLeaderboards({
        timeframes: ['monthly'],
      })
    }

    // Refresh all-time leaderboards once per day
    if (now.getHours() === 0 && now.getMinutes() < 30) {
      await refreshAllLeaderboards({
        timeframes: ['all_time'],
      })
    }
  } catch (error) {
    console.error('[leaderboard] scheduleLeaderboardRefresh error:', error)
  }
}

