import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'
import { handleApiError, ApiErrors } from '@/lib/api/errors'
import { validateRequestBody, validateRouteParams, ValidationSchemas } from '@/lib/api/validation'
import { updateChallengeProgress } from '@/lib/gamification/challenges'
import { z } from 'zod'

// Update challenge progress
export const POST = withAuth(
  async (request: NextRequest, auth, context?: { params: { id: string } }) => {
    try {
      if (!context?.params?.id) {
        return ApiErrors.badRequest('Challenge ID is required')
      }

      const paramsSchema = z.object({
        id: ValidationSchemas.uuid,
      })

      const paramsValidation = validateRouteParams(context.params, paramsSchema)
      if (!paramsValidation.success) {
        return paramsValidation.response
      }

      const bodySchema = z.object({
        progress: z.number().int().nonnegative(),
        userId: z.string().uuid().optional(), // Optional for admin to update other users
      })

      const bodyValidation = await validateRequestBody(request, bodySchema)
      if (!bodyValidation.success) {
        return bodyValidation.response
      }

      const isAdmin = isAdminRole(auth.user.role)
      const userId = bodyValidation.data.userId || auth.user.id

      // Verify user can only update their own progress (unless admin)
      if (!isAdmin && userId !== auth.user.id) {
        return ApiErrors.forbidden('You can only update your own challenge progress')
      }

      const result = await updateChallengeProgress(auth.supabase, {
        userId,
        challengeId: paramsValidation.data.id,
        progress: bodyValidation.data.progress,
      })

      if (!result.success) {
        return ApiErrors.internalError(result.error || 'Failed to update progress')
      }

      return NextResponse.json({
        success: true,
        completed: result.completed,
      })
    } catch (error) {
      return handleApiError('gamification/challenges/progress', error)
    }
  }
)

