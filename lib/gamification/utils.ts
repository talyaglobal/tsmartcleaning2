/**
 * Gamification utility functions
 */

import { createServerSupabase } from '@/lib/supabase'
import type { UserType, PointAction } from './types'

/**
 * Default point values for different actions
 */
export const DEFAULT_POINT_VALUES: Record<PointAction, { company: number; cleaner: number }> = {
  // Company actions
  post_job: { company: 10, cleaner: 0 },
  complete_job: { company: 50, cleaner: 0 },
  rate_cleaner: { company: 5, cleaner: 0 },
  refer_company: { company: 500, cleaner: 0 },
  complete_profile: { company: 25, cleaner: 25 },
  upload_logo: { company: 15, cleaner: 0 },
  first_job_posted: { company: 100, cleaner: 0 },
  ten_jobs_completed: { company: 250, cleaner: 250 },
  
  // Cleaner actions
  upload_photo: { company: 0, cleaner: 15 },
  complete_certification: { company: 0, cleaner: 100 },
  accept_job: { company: 0, cleaner: 5 },
  receive_five_star_rating: { company: 0, cleaner: 25 },
  refer_cleaner: { company: 0, cleaner: 200 },
  first_job_completed: { company: 0, cleaner: 100 },
  fifty_jobs_completed: { company: 0, cleaner: 1000 },
}

/**
 * Get point value for an action based on user type
 */
export function getPointValue(action: PointAction, userType: UserType): number {
  const values = DEFAULT_POINT_VALUES[action]
  return userType === 'company' ? values.company : values.cleaner
}

/**
 * Ensure gamification account exists for a user
 */
export async function ensureGamificationAccount(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string,
  userType: UserType
): Promise<void> {
  // Check if account exists
  const { data: existing } = await supabase
    .from('gamification_accounts')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!existing) {
    // Create new account
    await supabase.from('gamification_accounts').insert({
      user_id: userId,
      user_type: userType,
      total_points: 0,
      current_level: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }
}

/**
 * Calculate level from total points
 */
export function calculateLevel(points: number, userType: UserType): number {
  if (userType === 'company') {
    if (points >= 10000) return 5 // Diamond
    if (points >= 4000) return 4 // Platinum
    if (points >= 1500) return 3 // Gold
    if (points >= 500) return 2 // Silver
    return 1 // Bronze
  } else {
    // Cleaner levels
    if (points >= 7500) return 5 // Master
    if (points >= 3000) return 4 // Expert
    if (points >= 1000) return 3 // Advanced
    if (points >= 300) return 2 // Intermediate
    return 1 // Beginner
  }
}

/**
 * Get level name from level number and user type
 */
export function getLevelName(level: number, userType: UserType): string {
  if (userType === 'company') {
    const names = ['', 'Bronze Partner', 'Silver Partner', 'Gold Partner', 'Platinum Partner', 'Diamond Partner']
    return names[level] || 'Unknown'
  } else {
    const names = ['', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master']
    return names[level] || 'Unknown'
  }
}

/**
 * Calculate points needed for next level
 */
export function getPointsForNextLevel(currentLevel: number, userType: UserType): number {
  if (userType === 'company') {
    const thresholds = [0, 0, 500, 1500, 4000, 10000]
    return thresholds[Math.min(currentLevel + 1, 5)] || 0
  } else {
    const thresholds = [0, 0, 300, 1000, 3000, 7500]
    return thresholds[Math.min(currentLevel + 1, 5)] || 0
  }
}

/**
 * Calculate progress percentage to next level
 */
export function calculateProgress(currentPoints: number, currentLevel: number, userType: UserType): number {
  const pointsForCurrent = getPointsForNextLevel(currentLevel - 1, userType)
  const pointsForNext = getPointsForNextLevel(currentLevel, userType)
  const range = pointsForNext - pointsForCurrent
  
  if (range === 0) return 100
  
  const progress = ((currentPoints - pointsForCurrent) / range) * 100
  return Math.max(0, Math.min(100, progress))
}

