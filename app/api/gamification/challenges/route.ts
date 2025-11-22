import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'
import { handleApiError, ApiErrors } from '@/lib/api/errors'
import { validateRequestBody, validateQueryParams } from '@/lib/api/validation'
import { getActiveChallenges, getUserChallenges, createChallenge, joinChallenge } from '@/lib/gamification/challenges'
import { z } from 'zod'

// Get challenges
export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const userType = searchParams.get('user_type') as 'company' | 'cleaner' | null

    // If user_id is provided, get user's challenges
    if (userId) {
      const isAdmin = isAdminRole(auth.user.role)
      const requestedUserId = userId || auth.user.id

      // Verify user can only access their own challenges (unless admin)
      if (!isAdmin && requestedUserId !== auth.user.id) {
        return ApiErrors.forbidden('You can only view your own challenges')
      }

      const challenges = await getUserChallenges(auth.supabase, requestedUserId)
      return NextResponse.json({ challenges })
    }

    // Otherwise, get active challenges for user type
    if (!userType) {
      return ApiErrors.badRequest('user_type is required when user_id is not provided')
    }

    const challenges = await getActiveChallenges(auth.supabase, userType)
    return NextResponse.json({ challenges })
  } catch (error) {
    return handleApiError('gamification/challenges', error)
  }
})

// Create a new challenge (admin only) or join a challenge
export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json()
    const action = body.action as 'create' | 'join' | undefined

    if (action === 'create') {
      // Create challenge (admin only)
      if (!isAdminRole(auth.user.role)) {
        return ApiErrors.forbidden('Only admins can create challenges')
      }

      const bodySchema = z.object({
        action: z.literal('create'),
        name: z.string().min(1),
        description: z.string().min(1),
        userType: z.enum(['company', 'cleaner']),
        startDate: z.string(),
        endDate: z.string(),
        criteria: z.object({
          type: z.enum(['points', 'jobs', 'ratings', 'streak', 'custom']),
          target: z.number().int().positive(),
          metadata: z.record(z.unknown()).optional(),
        }),
        rewards: z.array(
          z.object({
            type: z.enum(['points', 'badge', 'discount', 'feature']),
            value: z.union([z.string(), z.number()]),
            metadata: z.record(z.unknown()).optional(),
          })
        ),
      })

      const validation = await validateRequestBody(request, bodySchema)
      if (!validation.success) {
        return validation.response
      }

      const result = await createChallenge(auth.supabase, {
        name: validation.data.name,
        description: validation.data.description,
        userType: validation.data.userType,
        startDate: validation.data.startDate,
        endDate: validation.data.endDate,
        criteria: validation.data.criteria,
        rewards: validation.data.rewards,
      })

      if (!result.success) {
        return ApiErrors.internalError(result.error || 'Failed to create challenge')
      }

      return NextResponse.json({ success: true, challenge: result.challenge })
    } else if (action === 'join') {
      // Join challenge
      const bodySchema = z.object({
        action: z.literal('join'),
        challengeId: z.string().uuid(),
      })

      const validation = await validateRequestBody(request, bodySchema)
      if (!validation.success) {
        return validation.response
      }

      const result = await joinChallenge(auth.supabase, {
        userId: auth.user.id,
        challengeId: validation.data.challengeId,
      })

      if (!result.success) {
        return ApiErrors.internalError(result.error || 'Failed to join challenge')
      }

      return NextResponse.json({ success: true })
    } else {
      return ApiErrors.badRequest('Invalid action. Must be "create" or "join"')
    }
  } catch (error) {
    return handleApiError('gamification/challenges', error)
  }
})

