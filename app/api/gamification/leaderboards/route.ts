import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { handleApiError, ApiErrors } from '@/lib/api/errors'
import { validateQueryParams } from '@/lib/api/validation'
import { getLeaderboard, getUserRank } from '@/lib/gamification/leaderboards'
import { z } from 'zod'

// Get leaderboard
export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const querySchema = z.object({
      type: z.enum(['points', 'jobs', 'ratings', 'referrals']),
      timeframe: z.enum(['daily', 'weekly', 'monthly', 'all_time']),
      userType: z.enum(['company', 'cleaner']),
      limit: z.coerce.number().int().positive().max(100).optional(),
      offset: z.coerce.number().int().nonnegative().optional(),
      userId: z.string().uuid().optional(), // For getting user's rank
    })

    const validation = validateQueryParams(request, querySchema)
    if (!validation.success) {
      return validation.response
    }

    const { type, timeframe, userType, limit, userId, offset } = validation.data

    // If userId is provided, get user's rank
    if (userId) {
      const rank = await getUserRank(
        auth.supabase,
        userId,
        type,
        timeframe,
        userType
      )

      if (rank === null) {
        return ApiErrors.notFound('User not found in leaderboard')
      }

      return NextResponse.json({ rank })
    }

    // Get full leaderboard with pagination
    const leaderboard = await getLeaderboard(auth.supabase, {
      type,
      timeframe,
      userType,
      limit: limit || 50,
      offset: offset || 0,
      tenantId: auth.tenantId,
    })

    return NextResponse.json(leaderboard)
  } catch (error) {
    return handleApiError('gamification/leaderboards', error)
  }
})

