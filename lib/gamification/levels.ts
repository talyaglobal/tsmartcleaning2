/**
 * Levels service for gamification system
 */

import { createServerSupabase } from '@/lib/supabase'
import { calculateLevel, getLevelName, getPointsForNextLevel, calculateProgress } from './utils'
import type { UserType, Level, UserLevel } from './types'

/**
 * Get user's current level information
 */
export async function getUserLevel(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string
): Promise<UserLevel | null> {
  try {
    const { data: account, error } = await supabase
      .from('gamification_accounts')
      .select('total_points, current_level, user_type')
      .eq('user_id', userId)
      .single()

    if (error || !account) {
      return null
    }

    const userType = account.user_type as UserType
    const currentPoints = account.total_points || 0
    const currentLevel = account.current_level || calculateLevel(currentPoints, userType)
    const levelName = getLevelName(currentLevel, userType)
    const pointsToNext = getPointsForNextLevel(currentLevel, userType)
    const progress = calculateProgress(currentPoints, currentLevel, userType)

    return {
      user_id: userId,
      user_type: userType,
      current_level: currentLevel,
      current_points: currentPoints,
      points_to_next_level: pointsToNext,
      level_name: levelName,
      progress_percentage: progress,
      updated_at: account.updated_at || new Date().toISOString(),
    }
  } catch (error) {
    console.error('[gamification] getUserLevel error:', error)
    return null
  }
}

/**
 * Get all levels for a user type
 */
export async function getLevels(
  supabase: ReturnType<typeof createServerSupabase>,
  userType: UserType
): Promise<Level[]> {
  try {
    const { data, error } = await supabase
      .from('gamification_levels')
      .select('*')
      .eq('user_type', userType)
      .order('level_number', { ascending: true })

    if (error) {
      console.error('[gamification] getLevels error:', error)
      return []
    }

    return (data as Level[]) || []
  } catch (error) {
    console.error('[gamification] getLevels error:', error)
    return []
  }
}

/**
 * Get level by number and user type
 */
export async function getLevelByNumber(
  supabase: ReturnType<typeof createServerSupabase>,
  levelNumber: number,
  userType: UserType
): Promise<Level | null> {
  try {
    const { data, error } = await supabase
      .from('gamification_levels')
      .select('*')
      .eq('user_type', userType)
      .eq('level_number', levelNumber)
      .single()

    if (error || !data) {
      return null
    }

    return data as Level
  } catch (error) {
    console.error('[gamification] getLevelByNumber error:', error)
    return null
  }
}

/**
 * Recalculate and update user's level based on current points
 */
export async function recalculateUserLevel(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string
): Promise<{ success: boolean; newLevel: number; error?: string }> {
  try {
    const { data: account, error: accountError } = await supabase
      .from('gamification_accounts')
      .select('total_points, user_type')
      .eq('user_id', userId)
      .single()

    if (accountError || !account) {
      return { success: false, newLevel: 1, error: 'Account not found' }
    }

    const userType = account.user_type as UserType
    const currentPoints = account.total_points || 0
    const newLevel = calculateLevel(currentPoints, userType)

    const { error: updateError } = await supabase
      .from('gamification_accounts')
      .update({
        current_level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('[gamification] Failed to update level:', updateError)
      return { success: false, newLevel: 1, error: 'Failed to update level' }
    }

    return { success: true, newLevel, error: undefined }
  } catch (error) {
    console.error('[gamification] recalculateUserLevel error:', error)
    return { success: false, newLevel: 1, error: 'Internal error' }
  }
}

/**
 * Get level distribution statistics
 */
export async function getLevelDistribution(
  supabase: ReturnType<typeof createServerSupabase>,
  userType: UserType
): Promise<Record<number, number>> {
  try {
    const { data, error } = await supabase
      .from('gamification_accounts')
      .select('current_level')
      .eq('user_type', userType)

    if (error) {
      console.error('[gamification] getLevelDistribution error:', error)
      return {}
    }

    const distribution: Record<number, number> = {}
    
    data?.forEach((account) => {
      const level = account.current_level || 1
      distribution[level] = (distribution[level] || 0) + 1
    })

    return distribution
  } catch (error) {
    console.error('[gamification] getLevelDistribution error:', error)
    return {}
  }
}

