import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'
import { handleApiError, ApiErrors } from '@/lib/api/errors'
import { validateRequestBody, ValidationSchemas } from '@/lib/api/validation'
import { awardBadge } from '@/lib/gamification/badges'
import { z } from 'zod'

// Award a badge to a user (admin only)
export const POST = withAuth(
  async (request: NextRequest, auth) => {
    try {
      const bodySchema = z.object({
        userId: ValidationSchemas.uuid,
        badgeId: ValidationSchemas.uuid,
        metadata: z.record(z.unknown()).optional(),
      })

      const validation = await validateRequestBody(request, bodySchema)
      if (!validation.success) {
        return validation.response
      }

      const result = await awardBadge(auth.supabase, validation.data.userId, validation.data.badgeId, validation.data.metadata)

      if (!result.success) {
        return ApiErrors.internalError(result.error || 'Failed to award badge')
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      return handleApiError('gamification/badges/award', error)
    }
  },
  { requireAdmin: true }
)

