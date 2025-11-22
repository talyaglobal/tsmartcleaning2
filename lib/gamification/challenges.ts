/**
 * Challenges service for gamification system
 */

import { createServerSupabase } from '@/lib/supabase'
import { awardPoints } from './points'
import { awardBadge } from './badges'
import type { UserType, Challenge, UserChallenge, ChallengeCriteria, ChallengeReward } from './types'

export interface CreateChallengeParams {
  name: string
  description: string
  userType: UserType
  startDate: string
  endDate: string
  criteria: ChallengeCriteria
  rewards: ChallengeReward[]
}

export interface JoinChallengeParams {
  userId: string
  challengeId: string
}

export interface UpdateChallengeProgressParams {
  userId: string
  challengeId: string
  progress: number
}

/**
 * Create a new challenge
 */
export async function createChallenge(
  supabase: ReturnType<typeof createServerSupabase>,
  params: CreateChallengeParams
): Promise<{ success: boolean; challenge: Challenge | null; error?: string }> {
  try {
    const { name, description, userType, startDate, endDate, criteria, rewards } = params

    const { data: challenge, error } = await supabase
      .from('gamification_challenges')
      .insert({
        name,
        description,
        user_type: userType,
        start_date: startDate,
        end_date: endDate,
        criteria,
        rewards,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !challenge) {
      console.error('[gamification] Failed to create challenge:', error)
      return { success: false, challenge: null, error: 'Failed to create challenge' }
    }

    return { success: true, challenge: challenge as Challenge, error: undefined }
  } catch (error) {
    console.error('[gamification] createChallenge error:', error)
    return { success: false, challenge: null, error: 'Internal error' }
  }
}

/**
 * Get active challenges for a user type
 */
export async function getActiveChallenges(
  supabase: ReturnType<typeof createServerSupabase>,
  userType: UserType
): Promise<Challenge[]> {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('gamification_challenges')
      .select('*')
      .eq('user_type', userType)
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now)
      .order('start_date', { ascending: false })

    if (error) {
      console.error('[gamification] getActiveChallenges error:', error)
      return []
    }

    return (data as Challenge[]) || []
  } catch (error) {
    console.error('[gamification] getActiveChallenges error:', error)
    return []
  }
}

/**
 * Get user's challenges
 */
export async function getUserChallenges(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string
): Promise<UserChallenge[]> {
  try {
    const { data, error } = await supabase
      .from('gamification_user_challenges')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    if (error) {
      console.error('[gamification] getUserChallenges error:', error)
      return []
    }

    return (data as UserChallenge[]) || []
  } catch (error) {
    console.error('[gamification] getUserChallenges error:', error)
    return []
  }
}

/**
 * Join a challenge
 */
export async function joinChallenge(
  supabase: ReturnType<typeof createServerSupabase>,
  params: JoinChallengeParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, challengeId } = params

    // Check if challenge exists and is active
    const { data: challenge, error: challengeError } = await supabase
      .from('gamification_challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('status', 'active')
      .single()

    if (challengeError || !challenge) {
      return { success: false, error: 'Challenge not found or not active' }
    }

    // Check if user already joined
    const { data: existing } = await supabase
      .from('gamification_user_challenges')
      .select('id')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single()

    if (existing) {
      return { success: false, error: 'Already joined this challenge' }
    }

    // Join challenge
    const { error: joinError } = await supabase
      .from('gamification_user_challenges')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
        progress: 0,
        target: (challenge.criteria as ChallengeCriteria).target,
        completed: false,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (joinError) {
      console.error('[gamification] Failed to join challenge:', joinError)
      return { success: false, error: 'Failed to join challenge' }
    }

    return { success: true, error: undefined }
  } catch (error) {
    console.error('[gamification] joinChallenge error:', error)
    return { success: false, error: 'Internal error' }
  }
}

/**
 * Update challenge progress
 */
export async function updateChallengeProgress(
  supabase: ReturnType<typeof createServerSupabase>,
  params: UpdateChallengeProgressParams
): Promise<{ success: boolean; completed: boolean; error?: string }> {
  try {
    const { userId, challengeId, progress } = params

    // Get user challenge
    const { data: userChallenge, error: ucError } = await supabase
      .from('gamification_user_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single()

    if (ucError || !userChallenge) {
      return { success: false, completed: false, error: 'Challenge not found' }
    }

    // Check if already completed
    if (userChallenge.completed) {
      return { success: true, completed: true, error: undefined }
    }

    const target = userChallenge.target
    const newProgress = Math.min(progress, target)
    const completed = newProgress >= target

    // Update progress
    const { error: updateError } = await supabase
      .from('gamification_user_challenges')
      .update({
        progress: newProgress,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userChallenge.id)

    if (updateError) {
      console.error('[gamification] Failed to update progress:', updateError)
      return { success: false, completed: false, error: 'Failed to update progress' }
    }

    // If completed, award rewards
    if (completed) {
      await awardChallengeRewards(supabase, userId, challengeId)
    }

    return { success: true, completed, error: undefined }
  } catch (error) {
    console.error('[gamification] updateChallengeProgress error:', error)
    return { success: false, completed: false, error: 'Internal error' }
  }
}

/**
 * Award challenge rewards when completed
 */
async function awardChallengeRewards(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string,
  challengeId: string
): Promise<void> {
  try {
    // Get challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('gamification_challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (challengeError || !challenge) {
      return
    }

    const rewards = challenge.rewards as ChallengeReward[]

    for (const reward of rewards) {
      switch (reward.type) {
        case 'points':
          await awardPoints(supabase, {
            userId,
            userType: challenge.user_type as UserType,
            action: 'complete_certification', // Using existing action
            metadata: { challenge_id: challengeId },
            customPoints: typeof reward.value === 'number' ? reward.value : 0,
          })
          break

        case 'badge':
          if (typeof reward.value === 'string') {
            // Find badge by code
            const { data: badge } = await supabase
              .from('gamification_badges')
              .select('id')
              .eq('code', reward.value)
              .single()

            if (badge) {
              await awardBadge(supabase, userId, badge.id, { challenge_id: challengeId })
            }
          }
          break

        case 'discount':
        case 'feature':
          // These would need to be handled by other systems
          break
      }
    }
  } catch (error) {
    console.error('[gamification] awardChallengeRewards error:', error)
  }
}

/**
 * Get challenge statistics
 */
export async function getChallengeStats(
  supabase: ReturnType<typeof createServerSupabase>,
  challengeId: string
): Promise<{ totalParticipants: number; completedCount: number; completionRate: number }> {
  try {
    const { data: participants, error } = await supabase
      .from('gamification_user_challenges')
      .select('completed')
      .eq('challenge_id', challengeId)

    if (error) {
      console.error('[gamification] getChallengeStats error:', error)
      return { totalParticipants: 0, completedCount: 0, completionRate: 0 }
    }

    const totalParticipants = participants?.length || 0
    const completedCount = participants?.filter((p) => p.completed).length || 0
    const completionRate = totalParticipants > 0 ? (completedCount / totalParticipants) * 100 : 0

    return { totalParticipants, completedCount, completionRate }
  } catch (error) {
    console.error('[gamification] getChallengeStats error:', error)
    return { totalParticipants: 0, completedCount: 0, completionRate: 0 }
  }
}

