/**
 * Points service for gamification system
 */

import { createServerSupabase } from '@/lib/supabase'
import { ensureGamificationAccount, getPointValue, calculateLevel, getLevelName, getPointsForNextLevel, calculateProgress } from './utils'
import type { UserType, PointAction, PointTransaction } from './types'

export interface AwardPointsParams {
  userId: string
  userType: UserType
  action: PointAction
  sourceId?: string
  metadata?: Record<string, unknown>
  customPoints?: number
}

export interface PointsHistoryParams {
  userId: string
  limit?: number
  offset?: number
  action?: PointAction
}

/**
 * Award points to a user for an action
 */
export async function awardPoints(
  supabase: ReturnType<typeof createServerSupabase>,
  params: AwardPointsParams
): Promise<{ success: boolean; points: number; newTotal: number; error?: string }> {
  try {
    const { userId, userType, action, sourceId, metadata, customPoints } = params

    // Ensure account exists
    await ensureGamificationAccount(supabase, userId, userType)

    // Get point value
    const points = customPoints ?? getPointValue(action, userType)

    if (points <= 0) {
      return { success: false, points: 0, newTotal: 0, error: 'Invalid point value' }
    }

    // Record transaction
    const { data: transaction, error: txError } = await supabase
      .from('gamification_point_transactions')
      .insert({
        user_id: userId,
        user_type: userType,
        points,
        action,
        source_id: sourceId,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (txError || !transaction) {
      console.error('[gamification] Failed to record point transaction:', txError)
      return { success: false, points: 0, newTotal: 0, error: 'Failed to record transaction' }
    }

    // Update account
    const { data: account, error: accountError } = await supabase
      .from('gamification_accounts')
      .select('total_points, current_level')
      .eq('user_id', userId)
      .single()

    if (accountError || !account) {
      console.error('[gamification] Failed to fetch account:', accountError)
      return { success: false, points: 0, newTotal: 0, error: 'Failed to fetch account' }
    }

    const newTotal = (account.total_points || 0) + points
    const newLevel = calculateLevel(newTotal, userType)

    const { error: updateError } = await supabase
      .from('gamification_accounts')
      .update({
        total_points: newTotal,
        current_level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('[gamification] Failed to update account:', updateError)
      return { success: false, points: 0, newTotal: 0, error: 'Failed to update account' }
    }

    return { success: true, points, newTotal, error: undefined }
  } catch (error) {
    console.error('[gamification] awardPoints error:', error)
    return { success: false, points: 0, newTotal: 0, error: 'Internal error' }
  }
}

/**
 * Get user's current points balance
 */
export async function getPointsBalance(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string
): Promise<{ points: number; level: number; levelName: string; progress: number; pointsToNext: number } | null> {
  try {
    const { data: account, error } = await supabase
      .from('gamification_accounts')
      .select('total_points, current_level, user_type')
      .eq('user_id', userId)
      .single()

    if (error || !account) {
      return null
    }

    const points = account.total_points || 0
    const level = account.current_level || 1
    const userType = account.user_type as UserType
    const levelName = getLevelName(level, userType)
    const pointsToNext = getPointsForNextLevel(level, userType)
    const progress = calculateProgress(points, level, userType)

    return { points, level, levelName, progress, pointsToNext }
  } catch (error) {
    console.error('[gamification] getPointsBalance error:', error)
    return null
  }
}

/**
 * Get points transaction history
 */
export async function getPointsHistory(
  supabase: ReturnType<typeof createServerSupabase>,
  params: PointsHistoryParams
): Promise<{ transactions: PointTransaction[]; total: number }> {
  try {
    const { userId, limit = 50, offset = 0, action } = params

    let query = supabase
      .from('gamification_point_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (action) {
      query = query.eq('action', action)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('[gamification] getPointsHistory error:', error)
      return { transactions: [], total: 0 }
    }

    return {
      transactions: (data as PointTransaction[]) || [],
      total: count || 0,
    }
  } catch (error) {
    console.error('[gamification] getPointsHistory error:', error)
    return { transactions: [], total: 0 }
  }
}

/**
 * Deduct points from a user (for redemptions, etc.)
 */
export async function deductPoints(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string,
  points: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; newTotal: number; error?: string }> {
  try {
    if (points <= 0) {
      return { success: false, newTotal: 0, error: 'Invalid point value' }
    }

    // Get current balance
    const { data: account, error: accountError } = await supabase
      .from('gamification_accounts')
      .select('total_points')
      .eq('user_id', userId)
      .single()

    if (accountError || !account) {
      return { success: false, newTotal: 0, error: 'Account not found' }
    }

    const currentPoints = account.total_points || 0

    if (currentPoints < points) {
      return { success: false, newTotal: currentPoints, error: 'Insufficient points' }
    }

    // Record transaction
    await supabase.from('gamification_point_transactions').insert({
      user_id: userId,
      points: -points,
      action: 'redemption' as PointAction,
      metadata: { reason, ...metadata },
      created_at: new Date().toISOString(),
    })

    // Update account
    const newTotal = currentPoints - points
    await supabase
      .from('gamification_accounts')
      .update({
        total_points: newTotal,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    return { success: true, newTotal, error: undefined }
  } catch (error) {
    console.error('[gamification] deductPoints error:', error)
    return { success: false, newTotal: 0, error: 'Internal error' }
  }
}

