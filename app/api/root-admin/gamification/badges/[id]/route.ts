import { NextRequest, NextResponse } from 'next/server'
import { withRootAdmin } from '@/lib/auth/rbac'
import { handleApiError, ApiErrors } from '@/lib/api/errors'
import { validateRequestBody, validateRouteParams, ValidationSchemas } from '@/lib/api/validation'
import { createServerSupabase } from '@/lib/supabase'
import { z } from 'zod'

// Get badge by ID
export const GET = withRootAdmin(
  async (request: NextRequest, context?: { params: { id: string } }) => {
    try {
      if (!context?.params?.id) {
        return ApiErrors.badRequest('Badge ID is required')
      }

      const paramsSchema = z.object({
        id: ValidationSchemas.uuid,
      })

      const paramsValidation = validateRouteParams(context.params, paramsSchema)
      if (!paramsValidation.success) {
        return paramsValidation.response
      }

      const supabase = createServerSupabase()
      const { data: badge, error } = await supabase
        .from('gamification_badges')
        .select('*')
        .eq('id', paramsValidation.data.id)
        .single()

      if (error || !badge) {
        return ApiErrors.notFound('Badge not found')
      }

      // Get statistics
      const { count } = await supabase
        .from('gamification_user_badges')
        .select('*', { count: 'exact', head: true })
        .eq('badge_id', paramsValidation.data.id)

      return NextResponse.json({
        badge: {
          ...badge,
          totalEarned: count || 0,
        },
      })
    } catch (error) {
      return handleApiError('root-admin/gamification/badges/[id]', error)
    }
  }
)

// Update badge
export const PATCH = withRootAdmin(
  async (request: NextRequest, context?: { params: { id: string } }) => {
    try {
      if (!context?.params?.id) {
        return ApiErrors.badRequest('Badge ID is required')
      }

      const paramsSchema = z.object({
        id: ValidationSchemas.uuid,
      })

      const paramsValidation = validateRouteParams(context.params, paramsSchema)
      if (!paramsValidation.success) {
        return paramsValidation.response
      }

      const bodySchema = z.object({
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        icon: z.string().optional(),
        criteria: z
          .object({
            type: z.enum(['points', 'jobs', 'ratings', 'streak', 'referrals', 'custom']),
            threshold: z.number().int().nonnegative(),
            metadata: z.record(z.unknown()).optional(),
          })
          .optional(),
        pointsReward: z.number().int().nonnegative().optional(),
      })

      const bodyValidation = await validateRequestBody(request, bodySchema)
      if (!bodyValidation.success) {
        return bodyValidation.response
      }

      const supabase = createServerSupabase()

      // Check if badge exists
      const { data: existing, error: checkError } = await supabase
        .from('gamification_badges')
        .select('id')
        .eq('id', paramsValidation.data.id)
        .single()

      if (checkError || !existing) {
        return ApiErrors.notFound('Badge not found')
      }

      // Update badge
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (bodyValidation.data.name) updateData.name = bodyValidation.data.name
      if (bodyValidation.data.description) updateData.description = bodyValidation.data.description
      if (bodyValidation.data.icon !== undefined) updateData.icon = bodyValidation.data.icon
      if (bodyValidation.data.criteria) updateData.criteria = bodyValidation.data.criteria
      if (bodyValidation.data.pointsReward !== undefined)
        updateData.points_reward = bodyValidation.data.pointsReward

      const { data: badge, error: updateError } = await supabase
        .from('gamification_badges')
        .update(updateData)
        .eq('id', paramsValidation.data.id)
        .select()
        .single()

      if (updateError || !badge) {
        console.error('[gamification] Failed to update badge:', updateError)
        return ApiErrors.internalError('Failed to update badge')
      }

      return NextResponse.json({ success: true, badge })
    } catch (error) {
      return handleApiError('root-admin/gamification/badges/[id]', error)
    }
  }
)

// Delete badge
export const DELETE = withRootAdmin(
  async (request: NextRequest, context?: { params: { id: string } }) => {
    try {
      if (!context?.params?.id) {
        return ApiErrors.badRequest('Badge ID is required')
      }

      const paramsSchema = z.object({
        id: ValidationSchemas.uuid,
      })

      const paramsValidation = validateRouteParams(context.params, paramsSchema)
      if (!paramsValidation.success) {
        return paramsValidation.response
      }

      const supabase = createServerSupabase()

      // Check if badge exists
      const { data: existing, error: checkError } = await supabase
        .from('gamification_badges')
        .select('id')
        .eq('id', paramsValidation.data.id)
        .single()

      if (checkError || !existing) {
        return ApiErrors.notFound('Badge not found')
      }

      // Check if badge has been awarded to any users
      const { count } = await supabase
        .from('gamification_user_badges')
        .select('*', { count: 'exact', head: true })
        .eq('badge_id', paramsValidation.data.id)

      if (count && count > 0) {
        return ApiErrors.conflict(
          `Cannot delete badge. It has been awarded to ${count} user(s). Consider disabling it instead.`
        )
      }

      // Delete badge
      const { error: deleteError } = await supabase
        .from('gamification_badges')
        .delete()
        .eq('id', paramsValidation.data.id)

      if (deleteError) {
        console.error('[gamification] Failed to delete badge:', deleteError)
        return ApiErrors.internalError('Failed to delete badge')
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      return handleApiError('root-admin/gamification/badges/[id]', error)
    }
  }
)

