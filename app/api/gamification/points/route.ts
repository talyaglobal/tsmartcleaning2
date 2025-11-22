import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'
import { handleApiError, ApiErrors } from '@/lib/api/errors'
import { validateRequestBody, ValidationSchemas } from '@/lib/api/validation'
import { awardPoints, getPointsBalance, getPointsHistory, deductPoints } from '@/lib/gamification/points'
import { z } from 'zod'

// Get user's points balance
export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('user_id') || auth.user.id
    const isAdmin = isAdminRole(auth.user.role)

    // Verify user can only access their own balance (unless admin)
    if (!isAdmin && requestedUserId !== auth.user.id) {
      return ApiErrors.forbidden('You can only view your own points balance')
    }

    const balance = await getPointsBalance(auth.supabase, requestedUserId)

    if (!balance) {
      return ApiErrors.notFound('Gamification account not found')
    }

    return NextResponse.json(balance)
  } catch (error) {
    return handleApiError('gamification/points', error)
  }
})

// Award points to a user
export const POST = withAuth(
  async (request: NextRequest, auth) => {
    try {
      const isAdmin = isAdminRole(auth.user.role)

      if (!isAdmin) {
        return ApiErrors.forbidden('Only admins can award points')
      }

      const bodySchema = z.object({
        userId: ValidationSchemas.uuid,
        userType: z.enum(['company', 'cleaner']),
        action: z.string(),
        sourceId: ValidationSchemas.uuid.optional(),
        metadata: z.record(z.unknown()).optional(),
        customPoints: z.number().int().positive().optional(),
      })

      const validation = await validateRequestBody(request, bodySchema)
      if (!validation.success) {
        return validation.response
      }

      const result = await awardPoints(auth.supabase, {
        userId: validation.data.userId,
        userType: validation.data.userType,
        action: validation.data.action as any,
        sourceId: validation.data.sourceId,
        metadata: validation.data.metadata,
        customPoints: validation.data.customPoints,
      })

      if (!result.success) {
        return ApiErrors.internalError(result.error || 'Failed to award points')
      }

      return NextResponse.json({
        success: true,
        points: result.points,
        newTotal: result.newTotal,
      })
    } catch (error) {
      return handleApiError('gamification/points', error)
    }
  },
  { requireAdmin: true }
)

