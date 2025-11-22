import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'
import { handleApiError, ApiErrors } from '@/lib/api/errors'
import { validateQueryParams, ValidationSchemas } from '@/lib/api/validation'
import { getPointsHistory } from '@/lib/gamification/points'
import { z } from 'zod'

// Get points transaction history
export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('user_id') || auth.user.id
    const isAdmin = isAdminRole(auth.user.role)

    // Verify user can only access their own history (unless admin)
    if (!isAdmin && requestedUserId !== auth.user.id) {
      return ApiErrors.forbidden('You can only view your own points history')
    }

    const querySchema = z.object({
      user_id: ValidationSchemas.uuid.optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      offset: z.coerce.number().int().nonnegative().optional(),
      action: z.string().optional(),
    })

    const validation = validateQueryParams(request, querySchema)
    if (!validation.success) {
      return validation.response
    }

    const result = await getPointsHistory(auth.supabase, {
      userId: requestedUserId,
      limit: validation.data.limit,
      offset: validation.data.offset,
      action: validation.data.action as any,
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError('gamification/points/history', error)
  }
})

