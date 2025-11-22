/**
 * Gamification Integration Service
 * Integrates points, badges, levels, and leaderboards with existing features
 */

import { createServerSupabase } from '@/lib/supabase'
import { awardPoints, getPointsBalance } from './points'
import { checkAndAwardBadge, getBadges, getUserBadges } from './badges'
import { recalculateUserLevel, getUserLevel } from './levels'
import { getLeaderboard } from './leaderboards'
import type { UserType, PointAction } from './types'

export interface IntegrationContext {
  supabase: ReturnType<typeof createServerSupabase>
  userId: string
  userType: UserType
  tenantId?: string | null
}

/**
 * Award points for job posting (company action)
 */
export async function handleJobPosting(context: IntegrationContext, jobId: string): Promise<void> {
  try {
    const { supabase, userId, userType } = context

    if (userType !== 'company') {
      return // Only companies post jobs
    }

    // Award points for posting a job
    const result = await awardPoints(supabase, {
      userId,
      userType,
      action: 'post_job',
      sourceId: jobId,
      metadata: { job_id: jobId },
    })

    if (result.success) {
      // Check if this is the first job (for bonus)
      const { data: jobs } = await supabase
        .from('bookings')
        .select('id')
        .eq('customer_id', userId)
        .eq('status', 'pending')

      if (jobs && jobs.length === 1) {
        // First job posted - award bonus
        await awardPoints(supabase, {
          userId,
          userType,
          action: 'first_job_posted',
          sourceId: jobId,
          metadata: { job_id: jobId, bonus: true },
        })
      }

      // Check for milestone badges
      await checkJobRelatedBadges(context, jobId)
      
      // Recalculate level
      await handleLevelUpdate(context)
    }
  } catch (error) {
    console.error('[gamification] handleJobPosting error:', error)
  }
}

/**
 * Award points for job completion (both company and cleaner)
 */
export async function handleJobCompletion(
  context: IntegrationContext,
  jobId: string,
  isCompany: boolean
): Promise<void> {
  try {
    const { supabase, userId, userType } = context

    // Award points for completing a job
    const action: PointAction = isCompany ? 'complete_job' : 'accept_job'
    
    const result = await awardPoints(supabase, {
      userId,
      userType,
      action,
      sourceId: jobId,
      metadata: { job_id: jobId, completed: true },
    })

    if (result.success) {
      // Check if this is the first job completed
      const { data: completedJobs } = await supabase
        .from('bookings')
        .select('id')
        .eq(isCompany ? 'customer_id' : 'provider_id', userId)
        .eq('status', 'completed')

      if (completedJobs && completedJobs.length === 1) {
        // First job completed - award bonus
        await awardPoints(supabase, {
          userId,
          userType,
          action: isCompany ? 'first_job_posted' : 'first_job_completed',
          sourceId: jobId,
          metadata: { job_id: jobId, bonus: true },
        })
      }

      // Check for 10 jobs milestone
      if (completedJobs && completedJobs.length === 10) {
        await awardPoints(supabase, {
          userId,
          userType,
          action: 'ten_jobs_completed',
          sourceId: jobId,
          metadata: { job_id: jobId, milestone: true },
        })
      }

      // Check for 50 jobs milestone (cleaners only)
      if (!isCompany && completedJobs && completedJobs.length === 50) {
        await awardPoints(supabase, {
          userId,
          userType,
          action: 'fifty_jobs_completed',
          sourceId: jobId,
          metadata: { job_id: jobId, milestone: true },
        })
      }

      // Check for job-related badges
      await checkJobRelatedBadges(context, jobId)
      
      // Recalculate level
      await handleLevelUpdate(context)
    }
  } catch (error) {
    console.error('[gamification] handleJobCompletion error:', error)
  }
}

/**
 * Award points for rating submission (company action)
 */
export async function handleRatingSubmission(
  context: IntegrationContext,
  reviewId: string,
  rating: number,
  providerId: string
): Promise<void> {
  try {
    const { supabase, userId, userType } = context

    if (userType !== 'company') {
      return // Only companies rate cleaners
    }

    // Award points for rating
    const result = await awardPoints(supabase, {
      userId,
      userType,
      action: 'rate_cleaner',
      sourceId: reviewId,
      metadata: { review_id: reviewId, rating, provider_id: providerId },
    })

    if (result.success) {
      // Check for rating-related badges
      await checkRatingRelatedBadges(context, reviewId, rating)
      
      // Recalculate level
      await handleLevelUpdate(context)
    }

    // Also check if cleaner receives 5-star rating
    if (rating === 5) {
      const cleanerContext: IntegrationContext = {
        supabase,
        userId: providerId,
        userType: 'cleaner',
        tenantId: context.tenantId,
      }
      
      await awardPoints(supabase, {
        userId: providerId,
        userType: 'cleaner',
        action: 'receive_five_star_rating',
        sourceId: reviewId,
        metadata: { review_id: reviewId, rating: 5 },
      })

      await checkRatingRelatedBadges(cleanerContext, reviewId, rating)
      await handleLevelUpdate(cleanerContext)
    }
  } catch (error) {
    console.error('[gamification] handleRatingSubmission error:', error)
  }
}

/**
 * Award points for referral completion
 */
export async function handleReferralCompletion(
  context: IntegrationContext,
  referralId: string,
  refereeId: string
): Promise<void> {
  try {
    const { supabase, userId, userType } = context

    // Award points for referring
    const action: PointAction = userType === 'company' ? 'refer_company' : 'refer_cleaner'
    
    const result = await awardPoints(supabase, {
      userId,
      userType,
      action,
      sourceId: referralId,
      metadata: { referral_id: referralId, referee_id: refereeId },
    })

    if (result.success) {
      // Check for referral-related badges
      await checkReferralRelatedBadges(context, referralId)
      
      // Recalculate level
      await handleLevelUpdate(context)
    }
  } catch (error) {
    console.error('[gamification] handleReferralCompletion error:', error)
  }
}

/**
 * Award points for profile completion
 */
export async function handleProfileCompletion(
  context: IntegrationContext,
  profileData?: Record<string, unknown>
): Promise<void> {
  try {
    const { supabase, userId, userType } = context

    // Award points for completing profile
    const result = await awardPoints(supabase, {
      userId,
      userType,
      action: 'complete_profile',
      metadata: { profile_data: profileData },
    })

    if (result.success) {
      // Check for profile-related badges
      await checkProfileRelatedBadges(context)
      
      // Recalculate level
      await handleLevelUpdate(context)
    }
  } catch (error) {
    console.error('[gamification] handleProfileCompletion error:', error)
  }
}

/**
 * Check and award job-related badges
 */
async function checkJobRelatedBadges(context: IntegrationContext, jobId: string): Promise<void> {
  try {
    const { supabase, userId, userType } = context

    // Get all badges for this user type
    const badges = await getBadges(supabase, userType)

    // Check each badge that might be related to jobs
    for (const badge of badges) {
      if (badge.criteria.type === 'jobs') {
        await checkAndAwardBadge(supabase, userId, userType, badge.id)
      }
    }
  } catch (error) {
    console.error('[gamification] checkJobRelatedBadges error:', error)
  }
}

/**
 * Check and award rating-related badges
 */
async function checkRatingRelatedBadges(
  context: IntegrationContext,
  reviewId: string,
  rating: number
): Promise<void> {
  try {
    const { supabase, userId, userType } = context

    // Get all badges for this user type
    const badges = await getBadges(supabase, userType)

    // Check each badge that might be related to ratings
    for (const badge of badges) {
      if (badge.criteria.type === 'ratings') {
        await checkAndAwardBadge(supabase, userId, userType, badge.id)
      }
    }
  } catch (error) {
    console.error('[gamification] checkRatingRelatedBadges error:', error)
  }
}

/**
 * Check and award referral-related badges
 */
async function checkReferralRelatedBadges(context: IntegrationContext, referralId: string): Promise<void> {
  try {
    const { supabase, userId, userType } = context

    // Get all badges for this user type
    const badges = await getBadges(supabase, userType)

    // Check each badge that might be related to referrals
    for (const badge of badges) {
      if (badge.criteria.type === 'referrals') {
        await checkAndAwardBadge(supabase, userId, userType, badge.id)
      }
    }
  } catch (error) {
    console.error('[gamification] checkReferralRelatedBadges error:', error)
  }
}

/**
 * Check and award profile-related badges
 */
async function checkProfileRelatedBadges(context: IntegrationContext): Promise<void> {
  try {
    const { supabase, userId, userType } = context

    // Get all badges for this user type
    const badges = await getBadges(supabase, userType)

    // Check each badge that might be related to profile completion
    for (const badge of badges) {
      // Check custom badges that might be profile-related
      if (badge.criteria.type === 'custom') {
        await checkAndAwardBadge(supabase, userId, userType, badge.id)
      }
    }
  } catch (error) {
    console.error('[gamification] checkProfileRelatedBadges error:', error)
  }
}

/**
 * Handle level update and send notifications
 */
export async function handleLevelUpdate(context: IntegrationContext): Promise<void> {
  try {
    const { supabase, userId, userType } = context

    // Get current level before update
    const currentLevel = await getUserLevel(supabase, userId)
    const oldLevel = currentLevel?.current_level || 1

    // Recalculate level
    const result = await recalculateUserLevel(supabase, userId)

    if (result.success && result.newLevel > oldLevel) {
      // Level up! Send notification
      const newLevelData = await getUserLevel(supabase, userId)
      
      if (newLevelData) {
        await supabase.from('notifications').insert({
          user_id: userId,
          title: 'Level Up! 🎉',
          message: `Congratulations! You've reached ${newLevelData.level_name}!`,
          type: 'gamification',
          metadata: {
            level: result.newLevel,
            level_name: newLevelData.level_name,
            points: newLevelData.current_points,
          },
        })

        // Apply level rewards if any
        await applyLevelRewards(context, result.newLevel)
      }
    }
  } catch (error) {
    console.error('[gamification] handleLevelUpdate error:', error)
  }
}

/**
 * Apply rewards for reaching a new level
 */
async function applyLevelRewards(context: IntegrationContext, level: number): Promise<void> {
  try {
    const { supabase, userId, userType } = context

    // Get level details
    const { getLevelByNumber } = await import('./levels')
    const levelData = await getLevelByNumber(supabase, level, userType)

    if (levelData && levelData.rewards) {
      // Apply each reward
      for (const reward of levelData.rewards) {
        switch (reward.type) {
          case 'badge':
            // Award badge
            const { awardBadge } = await import('./badges')
            await awardBadge(supabase, userId, reward.value as string)
            break

          case 'points':
            // Award bonus points
            await awardPoints(supabase, {
              userId,
              userType,
              action: 'complete_profile', // Using existing action
              metadata: { level_reward: true, level, reward_type: reward.type },
              customPoints: Number(reward.value),
            })
            break

          case 'feature':
            // Unlock feature (would need feature flag system)
            console.log(`[gamification] Feature unlocked: ${reward.value} for user ${userId}`)
            break

          case 'discount':
            // Apply discount (would need discount system)
            console.log(`[gamification] Discount unlocked: ${reward.value}% for user ${userId}`)
            break
        }
      }
    }
  } catch (error) {
    console.error('[gamification] applyLevelRewards error:', error)
  }
}

/**
 * Update leaderboards after point awards
 */
export async function updateLeaderboards(
  context: IntegrationContext,
  leaderboardTypes: Array<'points' | 'jobs' | 'ratings' | 'referrals'> = ['points']
): Promise<void> {
  try {
    const { supabase, userType, tenantId } = context

    // Update each leaderboard type
    for (const type of leaderboardTypes) {
      // Refresh leaderboard (this will recalculate rankings)
      await getLeaderboard(supabase, {
        type,
        timeframe: 'all_time',
        userType,
        limit: 100,
        tenantId,
      })

      // Also refresh daily/weekly/monthly if needed
      for (const timeframe of ['daily', 'weekly', 'monthly'] as const) {
        await getLeaderboard(supabase, {
          type,
          timeframe,
          userType,
          limit: 100,
          tenantId,
        })
      }
    }
  } catch (error) {
    console.error('[gamification] updateLeaderboards error:', error)
  }
}

/**
 * Comprehensive handler that processes all gamification updates
 */
export async function processGamificationUpdates(
  context: IntegrationContext,
  action: 'job_posted' | 'job_completed' | 'rating_submitted' | 'referral_completed' | 'profile_completed',
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    switch (action) {
      case 'job_posted':
        await handleJobPosting(context, metadata?.jobId as string)
        break

      case 'job_completed':
        await handleJobCompletion(
          context,
          metadata?.jobId as string,
          metadata?.isCompany as boolean
        )
        break

      case 'rating_submitted':
        await handleRatingSubmission(
          context,
          metadata?.reviewId as string,
          metadata?.rating as number,
          metadata?.providerId as string
        )
        break

      case 'referral_completed':
        await handleReferralCompletion(
          context,
          metadata?.referralId as string,
          metadata?.refereeId as string
        )
        break

      case 'profile_completed':
        await handleProfileCompletion(context, metadata)
        break
    }

    // Update leaderboards (async, don't block)
    updateLeaderboards(context, ['points', 'jobs', 'ratings']).catch((err) => {
      console.error('[gamification] Leaderboard update error:', err)
    })
  } catch (error) {
    console.error('[gamification] processGamificationUpdates error:', error)
  }
}

