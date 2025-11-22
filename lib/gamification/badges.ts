/**
 * Badges service for gamification system
 */

import { createServerSupabase } from '@/lib/supabase'
import { awardPoints } from './points'
import type { UserType, Badge, UserBadge, BadgeCriteria } from './types'

export interface CreateBadgeParams {
  code: string
  name: string
  description: string
  icon?: string
  userType: UserType
  criteria: BadgeCriteria
  pointsReward?: number
}

export interface CheckBadgeEligibilityParams {
  userId: string
  userType: UserType
  badgeId: string
}

/**
 * Create a new badge
 */
export async function createBadge(
  supabase: ReturnType<typeof createServerSupabase>,
  params: CreateBadgeParams
): Promise<{ success: boolean; badge: Badge | null; error?: string }> {
  try {
    const { code, name, description, icon, userType, criteria, pointsReward } = params

    // Check if badge with code already exists
    const { data: existing } = await supabase
      .from('gamification_badges')
      .select('id')
      .eq('code', code)
      .single()

    if (existing) {
      return { success: false, badge: null, error: 'Badge code already exists' }
    }

    const { data: badge, error } = await supabase
      .from('gamification_badges')
      .insert({
        code,
        name,
        description,
        icon,
        user_type: userType,
        criteria,
        points_reward: pointsReward || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !badge) {
      console.error('[gamification] Failed to create badge:', error)
      return { success: false, badge: null, error: 'Failed to create badge' }
    }

    return { success: true, badge: badge as Badge, error: undefined }
  } catch (error) {
    console.error('[gamification] createBadge error:', error)
    return { success: false, badge: null, error: 'Internal error' }
  }
}

/**
 * Get all badges for a user type
 */
export async function getBadges(
  supabase: ReturnType<typeof createServerSupabase>,
  userType: UserType
): Promise<Badge[]> {
  try {
    const { data, error } = await supabase
      .from('gamification_badges')
      .select('*')
      .eq('user_type', userType)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[gamification] getBadges error:', error)
      return []
    }

    return (data as Badge[]) || []
  } catch (error) {
    console.error('[gamification] getBadges error:', error)
    return []
  }
}

/**
 * Get user's earned badges
 */
export async function getUserBadges(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string
): Promise<UserBadge[]> {
  try {
    const { data, error } = await supabase
      .from('gamification_user_badges')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (error) {
      console.error('[gamification] getUserBadges error:', error)
      return []
    }

    return (data as UserBadge[]) || []
  } catch (error) {
    console.error('[gamification] getUserBadges error:', error)
    return []
  }
}

/**
 * Award a badge to a user
 */
export async function awardBadge(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string,
  badgeId: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user already has this badge
    const { data: existing } = await supabase
      .from('gamification_user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .single()

    if (existing) {
      return { success: false, error: 'Badge already awarded' }
    }

    // Get badge details
    const { data: badge, error: badgeError } = await supabase
      .from('gamification_badges')
      .select('*')
      .eq('id', badgeId)
      .single()

    if (badgeError || !badge) {
      return { success: false, error: 'Badge not found' }
    }

    // Award badge
    const { error: awardError } = await supabase
      .from('gamification_user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
        earned_at: new Date().toISOString(),
        metadata: metadata || {},
      })

    if (awardError) {
      console.error('[gamification] Failed to award badge:', awardError)
      return { success: false, error: 'Failed to award badge' }
    }

    // Award points if badge has point reward
    if (badge.points_reward && badge.points_reward > 0) {
      await awardPoints(supabase, {
        userId,
        userType: badge.user_type as UserType,
        action: 'complete_certification', // Using existing action for badge points
        metadata: { badge_id: badgeId, badge_code: badge.code },
        customPoints: badge.points_reward,
      })
    }

    return { success: true, error: undefined }
  } catch (error) {
    console.error('[gamification] awardBadge error:', error)
    return { success: false, error: 'Internal error' }
  }
}

/**
 * Check if user is eligible for a badge and award it
 */
export async function checkAndAwardBadge(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string,
  userType: UserType,
  badgeId: string
): Promise<{ success: boolean; awarded: boolean; error?: string }> {
  try {
    // Get badge
    const { data: badge, error: badgeError } = await supabase
      .from('gamification_badges')
      .select('*')
      .eq('id', badgeId)
      .eq('user_type', userType)
      .single()

    if (badgeError || !badge) {
      return { success: false, awarded: false, error: 'Badge not found' }
    }

    // Check if already awarded
    const { data: existing } = await supabase
      .from('gamification_user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .single()

    if (existing) {
      return { success: true, awarded: false, error: undefined }
    }

    // Check eligibility based on criteria
    const isEligible = await checkBadgeEligibility(supabase, { userId, userType, badgeId })

    if (!isEligible) {
      return { success: true, awarded: false, error: undefined }
    }

    // Award badge
    const result = await awardBadge(supabase, userId, badgeId)
    return { success: result.success, awarded: result.success, error: result.error }
  } catch (error) {
    console.error('[gamification] checkAndAwardBadge error:', error)
    return { success: false, awarded: false, error: 'Internal error' }
  }
}

/**
 * Check if user meets badge criteria
 */
async function checkBadgeEligibility(
  supabase: ReturnType<typeof createServerSupabase>,
  params: CheckBadgeEligibilityParams
): Promise<boolean> {
  try {
    const { userId, userType, badgeId } = params

    // Get badge
    const { data: badge, error: badgeError } = await supabase
      .from('gamification_badges')
      .select('*')
      .eq('id', badgeId)
      .single()

    if (badgeError || !badge) {
      return false
    }

    const criteria = badge.criteria as BadgeCriteria

    switch (criteria.type) {
      case 'points': {
        const { data: account } = await supabase
          .from('gamification_accounts')
          .select('total_points')
          .eq('user_id', userId)
          .single()

        return (account?.total_points || 0) >= criteria.threshold
      }

      case 'jobs': {
        // Query completed jobs/bookings
        if (userType === 'company') {
          const { count } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', userId)
            .eq('status', 'completed')
          
          return (count || 0) >= criteria.threshold
        } else {
          // Cleaner
          const { count } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('provider_id', userId)
            .eq('status', 'completed')
          
          return (count || 0) >= criteria.threshold
        }
      }

      case 'ratings': {
        // Query reviews/ratings
        if (userType === 'company') {
          // Companies receive ratings from reviews
          const { count } = await supabase
            .from('reviews')
            .select('id', { count: 'exact', head: true })
            .eq('customer_id', userId)
          
          return (count || 0) >= criteria.threshold
        } else {
          // Cleaners receive ratings
          const { count } = await supabase
            .from('reviews')
            .select('id', { count: 'exact', head: true })
            .eq('provider_id', userId)
          
          return (count || 0) >= criteria.threshold
        }
      }

      case 'streak': {
        // Check for consecutive days with activity
        // This is a simplified version - could be enhanced with actual streak tracking
        const { data: recentActivity } = await supabase
          .from('gamification_point_transactions')
          .select('created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(criteria.threshold)
        
        if (!recentActivity || recentActivity.length < criteria.threshold) {
          return false
        }
        
        // Check if activities are consecutive days
        // Simplified: just check if we have enough recent activities
        return true
      }

      case 'referrals': {
        // Query referrals table
        const { count } = await supabase
          .from('referrals')
          .select('id', { count: 'exact', head: true })
          .eq('referrer_id', userId)
          .eq('status', 'completed')
        
        return (count || 0) >= criteria.threshold
      }

      case 'custom': {
        // Custom criteria would need to be evaluated based on metadata
        return false
      }

      default:
        return false
    }
  } catch (error) {
    console.error('[gamification] checkBadgeEligibility error:', error)
    return false
  }
}

