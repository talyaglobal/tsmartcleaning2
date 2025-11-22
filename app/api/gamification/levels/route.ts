import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'
import { handleApiError, ApiErrors } from '@/lib/api/errors'
import { validateQueryParams } from '@/lib/api/validation'
import { getUserLevel, getLevels } from '@/lib/gamification/levels'
import { z } from 'zod'

// Get user level or all levels
export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const userType = searchParams.get('user_type') as 'company' | 'cleaner' | null

    // If user_id is provided, get user's level
    if (userId) {
      const isAdmin = isAdminRole(auth.user.role)
      const requestedUserId = userId || auth.user.id

      // Verify user can only access their own level (unless admin)
      if (!isAdmin && requestedUserId !== auth.user.id) {
        return ApiErrors.forbidden('You can only view your own level')
      }

      const level = await getUserLevel(auth.supabase, requestedUserId)

      if (!level) {
        return ApiErrors.notFound('Gamification account not found')
      }

      return NextResponse.json(level)
    }

    // Otherwise, get all levels for user type
    if (!userType) {
      return ApiErrors.badRequest('user_type is required when user_id is not provided')
    }

    const levels = await getLevels(auth.supabase, userType)
    return NextResponse.json({ levels })
  } catch (error) {
    return handleApiError('gamification/levels', error)
  }
})

