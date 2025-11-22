/**
 * Leaderboards service for gamification system
 */

import { createServerSupabase } from '@/lib/supabase'
import type { UserType, LeaderboardType, LeaderboardTimeframe, Leaderboard, LeaderboardEntry } from './types'

export interface GetLeaderboardParams {
  type: LeaderboardType
  timeframe: LeaderboardTimeframe
  userType: UserType
  limit?: number
  offset?: number
  tenantId?: string | null
}

/**
 * Get leaderboard entries with proper ranking criteria
 * Uses cached leaderboard data when available for better performance
 */
export async function getLeaderboard(
  supabase: ReturnType<typeof createServerSupabase>,
  params: GetLeaderboardParams
): Promise<Leaderboard> {
  try {
    const { type, timeframe, userType, limit = 100, offset = 0, tenantId = null } = params
    
    // Try to get from cache first (for all_time and recent timeframes)
    if (timeframe === 'all_time' || timeframe === 'monthly' || timeframe === 'weekly') {
      const cached = await getCachedLeaderboard(supabase, type, timeframe, userType, tenantId)
      if (cached && isCacheValid(cached.updated_at, timeframe)) {
        // Apply pagination to cached data
        const paginatedEntries = cached.entries.slice(offset, offset + limit)
        return {
          type,
          timeframe,
          user_type: userType,
          entries: paginatedEntries,
          generated_at: cached.updated_at,
          total_participants: cached.entries.length,
          cached: true,
        }
      }
    }

    const dateFilter = getTimeframeFilter(timeframe)
    let entries: LeaderboardEntry[] = []

    // Get rankings based on type
    if (type === 'points') {
      entries = await getPointsLeaderboard(supabase, userType, dateFilter, limit, offset, tenantId)
    } else if (type === 'jobs') {
      entries = await getJobsLeaderboard(supabase, userType, dateFilter, limit, offset, tenantId)
    } else if (type === 'ratings') {
      entries = await getRatingsLeaderboard(supabase, userType, dateFilter, limit, offset, tenantId)
    } else if (type === 'referrals') {
      entries = await getReferralsLeaderboard(supabase, userType, dateFilter, limit, offset, tenantId)
    }

    // Cache the result for future requests (async, don't wait)
    if (timeframe === 'all_time' || timeframe === 'monthly' || timeframe === 'weekly') {
      cacheLeaderboard(supabase, type, timeframe, userType, entries, tenantId).catch(err => {
        console.error('[gamification] Failed to cache leaderboard:', err)
      })
    }

    return {
      type,
      timeframe,
      user_type: userType,
      entries,
      generated_at: new Date().toISOString(),
      total_participants: entries.length,
      cached: false,
    }
  } catch (error) {
    console.error('[gamification] getLeaderboard error:', error)
    return createEmptyLeaderboard(params.type, params.timeframe, params.userType)
  }
}

/**
 * Get points-based leaderboard
 */
async function getPointsLeaderboard(
  supabase: ReturnType<typeof createServerSupabase>,
  userType: UserType,
  dateFilter: Date | null,
  limit: number,
  offset: number,
  tenantId: string | null
): Promise<LeaderboardEntry[]> {
  let query = supabase
    .from('gamification_points')
    .select('user_id, points, level, user_type')
    .eq('user_type', userType)

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  } else {
    query = query.is('tenant_id', null)
  }

  // If timeframe filter exists, we need to calculate points from transactions
  if (dateFilter) {
    // Get points from transactions within timeframe
    let txnQuery = supabase
      .from('gamification_points_transactions')
      .select('user_id, points_delta')
      .eq('user_type', userType)
      .gte('created_at', dateFilter.toISOString())

    if (tenantId) {
      txnQuery = txnQuery.eq('tenant_id', tenantId)
    } else {
      txnQuery = txnQuery.is('tenant_id', null)
    }

    const { data: transactions } = await txnQuery.order('created_at', { ascending: false })

    // Aggregate points by user
    const userPoints: Record<string, number> = {}
    for (const txn of transactions || []) {
      userPoints[txn.user_id] = (userPoints[txn.user_id] || 0) + (txn.points_delta || 0)
    }

    // Convert to entries
    const entries: LeaderboardEntry[] = []
    let rank = offset + 1

    const sortedUsers = Object.entries(userPoints)
      .sort(([, a], [, b]) => b - a)
      .slice(offset, offset + limit)

    for (const [userId, points] of sortedUsers) {
      const { data: user } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', userId)
        .single()

      entries.push({
        rank: rank++,
        user_id: userId,
        user_name: user?.full_name || user?.email || 'Unknown',
        user_type: userType,
        score: points,
        metadata: { points },
      })
    }

    return entries
  } else {
    // All-time: use gamification_points table
    query = query.order('points', { ascending: false })
    const { data: accounts } = await query.range(offset, offset + limit - 1)

    const entries: LeaderboardEntry[] = []
    let rank = offset + 1

    for (const account of accounts || []) {
      const { data: user } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', account.user_id)
        .single()

      entries.push({
        rank: rank++,
        user_id: account.user_id,
        user_name: user?.full_name || user?.email || 'Unknown',
        user_type: account.user_type as UserType,
        score: account.points || 0,
        metadata: { points: account.points, level: account.level },
      })
    }

    return entries
  }
}

/**
 * Get jobs-based leaderboard
 */
async function getJobsLeaderboard(
  supabase: ReturnType<typeof createServerSupabase>,
  userType: UserType,
  dateFilter: Date | null,
  limit: number,
  offset: number,
  tenantId: string | null
): Promise<LeaderboardEntry[]> {
  let query = supabase.from('bookings').select('*')

  if (dateFilter) {
    query = query.gte('created_at', dateFilter.toISOString())
  }

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  // Filter by user type
  if (userType === 'company') {
    query = query.eq('status', 'completed')
    // Count jobs per company (customer_id in bookings)
  } else {
    query = query.eq('status', 'completed')
    // Count jobs per cleaner (provider_id in bookings)
  }

  const { data: bookings } = await query

  // Aggregate jobs by user
  const userJobs: Record<string, number> = {}
  for (const booking of bookings || []) {
    const userId = userType === 'company' ? booking.customer_id : booking.provider_id
    if (userId) {
      userJobs[userId] = (userJobs[userId] || 0) + 1
    }
  }

  // Convert to entries
  const entries: LeaderboardEntry[] = []
  let rank = offset + 1

  const sortedUsers = Object.entries(userJobs)
    .sort(([, a], [, b]) => b - a)
    .slice(offset, offset + limit)

  for (const [userId, count] of sortedUsers) {
    const { data: user } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    entries.push({
      rank: rank++,
      user_id: userId,
      user_name: user?.full_name || user?.email || 'Unknown',
      user_type: userType,
      score: count,
      metadata: { jobs_completed: count },
    })
  }

  return entries
}

/**
 * Get ratings-based leaderboard
 */
async function getRatingsLeaderboard(
  supabase: ReturnType<typeof createServerSupabase>,
  userType: UserType,
  dateFilter: Date | null,
  limit: number,
  offset: number,
  tenantId: string | null
): Promise<LeaderboardEntry[]> {
  // For companies: average rating from reviews (need to join with bookings to get company)
  // For cleaners: average rating from reviews (provider_id in reviews)
  let query = supabase
    .from('reviews')
    .select('rating, provider_id, booking_id, created_at')

  if (dateFilter) {
    query = query.gte('created_at', dateFilter.toISOString())
  }

  // Note: reviews table may not have tenant_id directly, would need to join with bookings
  // For now, we'll skip tenant filtering on reviews

  const { data: reviews } = await query

  // Aggregate ratings by user
  const userRatings: Record<string, { sum: number; count: number }> = {}
  
  if (userType === 'cleaner') {
    // For cleaners: use provider_id from reviews
    for (const review of reviews || []) {
      const providerId = review.provider_id
      if (providerId && review.rating) {
        // Get user_id from provider_profiles
        const { data: provider } = await supabase
          .from('provider_profiles')
          .select('user_id')
          .eq('id', providerId)
          .single()
        
        if (provider?.user_id) {
          const userId = provider.user_id
          if (!userRatings[userId]) {
            userRatings[userId] = { sum: 0, count: 0 }
          }
          userRatings[userId].sum += Number(review.rating) || 0
          userRatings[userId].count += 1
        }
      }
    }
  } else {
    // For companies: need to get company from booking
    // This is more complex - would need to join bookings -> companies
    // For now, we'll use a simplified approach
    for (const review of reviews || []) {
      if (review.booking_id && review.rating) {
        // Get booking to find company
        const { data: booking } = await supabase
          .from('bookings')
          .select('customer_id')
          .eq('id', review.booking_id)
          .single()
        
        if (booking?.customer_id) {
          const userId = booking.customer_id
          if (!userRatings[userId]) {
            userRatings[userId] = { sum: 0, count: 0 }
          }
          userRatings[userId].sum += Number(review.rating) || 0
          userRatings[userId].count += 1
        }
      }
    }
  }

  // Convert to entries with average rating
  const entries: LeaderboardEntry[] = []
  let rank = offset + 1

  const sortedUsers = Object.entries(userRatings)
    .map(([userId, data]) => ({
      userId,
      avgRating: data.count > 0 ? data.sum / data.count : 0,
      count: data.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(offset, offset + limit)

  for (const { userId, avgRating, count } of sortedUsers) {
    const { data: user } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    entries.push({
      rank: rank++,
      user_id: userId,
      user_name: user?.full_name || user?.email || 'Unknown',
      user_type: userType,
      score: Math.round(avgRating * 100) / 100, // Round to 2 decimals
      metadata: { average_rating: avgRating, review_count: count },
    })
  }

  return entries
}

/**
 * Get referrals-based leaderboard
 */
async function getReferralsLeaderboard(
  supabase: ReturnType<typeof createServerSupabase>,
  userType: UserType,
  dateFilter: Date | null,
  limit: number,
  offset: number,
  tenantId: string | null
): Promise<LeaderboardEntry[]> {
  let query = supabase.from('referrals').select('*')

  if (dateFilter) {
    query = query.gte('created_at', dateFilter.toISOString())
  }

  // Note: referrals table may not have tenant_id, so we skip that filter
  // If tenant isolation is needed, it would need to be added to the referrals table

  const { data: referrals } = await query

  // Count referrals by referrer
  const userReferrals: Record<string, number> = {}
  for (const referral of referrals || []) {
    const referrerId = referral.referrer_id
    if (referrerId) {
      userReferrals[referrerId] = (userReferrals[referrerId] || 0) + 1
    }
  }

  // Convert to entries
  const entries: LeaderboardEntry[] = []
  let rank = offset + 1

  const sortedUsers = Object.entries(userReferrals)
    .sort(([, a], [, b]) => b - a)
    .slice(offset, offset + limit)

  for (const [userId, count] of sortedUsers) {
    const { data: user } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', userId)
      .single()

    entries.push({
      rank: rank++,
      user_id: userId,
      user_name: user?.full_name || user?.email || 'Unknown',
      user_type: userType,
      score: count,
      metadata: { referrals_count: count },
    })
  }

  return entries
}

/**
 * Get user's rank in a leaderboard
 */
export async function getUserRank(
  supabase: ReturnType<typeof createServerSupabase>,
  userId: string,
  type: LeaderboardType,
  timeframe: LeaderboardTimeframe,
  userType: UserType
): Promise<number | null> {
  try {
    const leaderboard = await getLeaderboard(supabase, { type, timeframe, userType, limit: 1000 })

    const userEntry = leaderboard.entries.find((entry) => entry.user_id === userId)
    return userEntry?.rank || null
  } catch (error) {
    console.error('[gamification] getUserRank error:', error)
    return null
  }
}

/**
 * Get top N users for a leaderboard
 */
export async function getTopUsers(
  supabase: ReturnType<typeof createServerSupabase>,
  type: LeaderboardType,
  userType: UserType,
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  try {
    const leaderboard = await getLeaderboard(supabase, {
      type,
      timeframe: 'all_time',
      userType,
      limit,
    })

    return leaderboard.entries
  } catch (error) {
    console.error('[gamification] getTopUsers error:', error)
    return []
  }
}

/**
 * Get total count for leaderboard (for pagination)
 */
export async function getLeaderboardCount(
  supabase: ReturnType<typeof createServerSupabase>,
  type: LeaderboardType,
  userType: UserType,
  timeframe: LeaderboardTimeframe,
  tenantId: string | null = null
): Promise<number> {
  try {
    const dateFilter = getTimeframeFilter(timeframe)

    if (type === 'points') {
      if (dateFilter) {
        const { data: transactions } = await supabase
          .from('gamification_points_transactions')
          .select('user_id', { count: 'exact', head: true })
          .eq('user_type', userType)
          .gte('created_at', dateFilter.toISOString())
        
        if (tenantId) {
          // Count unique users
          const { data } = await supabase
            .from('gamification_points_transactions')
            .select('user_id')
            .eq('user_type', userType)
            .eq('tenant_id', tenantId)
            .gte('created_at', dateFilter.toISOString())
          
          const uniqueUsers = new Set((data || []).map(t => t.user_id))
          return uniqueUsers.size
        }
        return transactions?.length || 0
      } else {
        const { count } = await supabase
          .from('gamification_points')
          .select('*', { count: 'exact', head: true })
          .eq('user_type', userType)
        
        if (tenantId) {
          const { count: tenantCount } = await supabase
            .from('gamification_points')
            .select('*', { count: 'exact', head: true })
            .eq('user_type', userType)
            .eq('tenant_id', tenantId)
          return tenantCount || 0
        }
        return count || 0
      }
    }

    // For other types, we'd need to query the respective tables
    // For now, return a reasonable estimate
    return 0
  } catch (error) {
    console.error('[gamification] getLeaderboardCount error:', error)
    return 0
  }
}

/**
 * Helper: Get timeframe filter date
 */
function getTimeframeFilter(timeframe: LeaderboardTimeframe): Date | null {
  const now = new Date()
  
  switch (timeframe) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'weekly':
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      return weekStart
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case 'all_time':
      return null
    default:
      return null
  }
}

/**
 * Helper: Create empty leaderboard
 */
function createEmptyLeaderboard(
  type: LeaderboardType,
  timeframe: LeaderboardTimeframe,
  userType: UserType
): Leaderboard {
  return {
    type,
    timeframe,
    user_type: userType,
    entries: [],
    generated_at: new Date().toISOString(),
    total_participants: 0,
    cached: false,
  }
}

/**
 * Get cached leaderboard from database
 */
async function getCachedLeaderboard(
  supabase: ReturnType<typeof createServerSupabase>,
  type: LeaderboardType,
  timeframe: LeaderboardTimeframe,
  userType: UserType,
  tenantId: string | null
): Promise<{ entries: LeaderboardEntry[]; updated_at: string } | null> {
  try {
    const timeframeKey = getTimeframeKey(timeframe)
    
    let query = supabase
      .from('gamification_leaderboards')
      .select('rankings, updated_at')
      .eq('leaderboard_type', type)
      .eq('user_type', userType)
      .eq('timeframe', timeframeKey)

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    } else {
      query = query.is('tenant_id', null)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return null
    }

    // Convert rankings JSONB to entries
    const rankings = data.rankings as any[]
    const entries: LeaderboardEntry[] = rankings.map((r: any) => ({
      rank: r.rank,
      user_id: r.user_id,
      user_name: r.full_name || r.email || 'Unknown',
      user_type: userType,
      score: r.points || r.score || 0,
      metadata: { ...r, points: r.points, level: r.level },
    }))

    return {
      entries,
      updated_at: data.updated_at,
    }
  } catch (error) {
    console.error('[gamification] getCachedLeaderboard error:', error)
    return null
  }
}

/**
 * Cache leaderboard in database
 */
async function cacheLeaderboard(
  supabase: ReturnType<typeof createServerSupabase>,
  type: LeaderboardType,
  timeframe: LeaderboardTimeframe,
  userType: UserType,
  entries: LeaderboardEntry[],
  tenantId: string | null
): Promise<void> {
  try {
    const timeframeKey = getTimeframeKey(timeframe)
    
    // Convert entries to rankings format
    const rankings = entries.map(entry => ({
      rank: entry.rank,
      user_id: entry.user_id,
      points: entry.score,
      level: entry.metadata?.level || 1,
      full_name: entry.user_name,
      email: entry.metadata?.email,
    }))

    const { error } = await supabase
      .from('gamification_leaderboards')
      .upsert({
        leaderboard_type: type,
        user_type: userType,
        timeframe: timeframeKey,
        tenant_id: tenantId,
        rankings: rankings as any,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'leaderboard_type,user_type,timeframe,tenant_id',
      })

    if (error) {
      console.error('[gamification] Failed to cache leaderboard:', error)
    }
  } catch (error) {
    console.error('[gamification] cacheLeaderboard error:', error)
  }
}

/**
 * Check if cache is still valid based on timeframe
 */
function isCacheValid(updatedAt: string, timeframe: LeaderboardTimeframe): boolean {
  const updated = new Date(updatedAt)
  const now = new Date()
  const ageMs = now.getTime() - updated.getTime()

  // Cache validity periods (in milliseconds)
  const cacheTTL: Record<LeaderboardTimeframe, number> = {
    daily: 15 * 60 * 1000,      // 15 minutes
    weekly: 60 * 60 * 1000,      // 1 hour
    monthly: 6 * 60 * 60 * 1000, // 6 hours
    all_time: 24 * 60 * 60 * 1000, // 24 hours
  }

  return ageMs < (cacheTTL[timeframe] || 60 * 60 * 1000)
}

/**
 * Get timeframe key for caching
 */
function getTimeframeKey(timeframe: LeaderboardTimeframe): string {
  if (timeframe === 'all_time') {
    return 'all_time'
  }

  const now = new Date()
  
  if (timeframe === 'daily') {
    return now.toISOString().slice(0, 10) // YYYY-MM-DD
  }
  
  if (timeframe === 'weekly') {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const year = weekStart.getFullYear()
    const week = Math.ceil((weekStart.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
    return `${year}-W${String(week).padStart(2, '0')}`
  }
  
  if (timeframe === 'monthly') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
  }

  return 'all_time'
}

