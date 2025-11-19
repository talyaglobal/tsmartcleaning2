import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'
import { handleApiError, ApiErrors, logError } from '@/lib/api/errors'
import { validateRouteParams, ValidationSchemas } from '@/lib/api/validation'
import { z } from 'zod'

// Get user profile
export const GET = withAuth(
  async (
    request: NextRequest,
    auth: { user: any, supabase: any, tenantId: string | null },
    context?: { params: { id: string } }
  ) => {
    try {
      if (!context?.params?.id) {
        return ApiErrors.badRequest('User ID is required')
      }

      // Validate route parameters
      const paramsSchema = z.object({
        id: ValidationSchemas.uuid,
      })
      
      const validation = validateRouteParams(context.params, paramsSchema)
      if (!validation.success) {
        return validation.response
      }
      
      const { id } = validation.data
      const tenantId = auth.tenantId || resolveTenantFromRequest(request)

      // Verify user can access this profile (own profile or admin)
      const isAdmin = isAdminRole(auth.user.role)
      
      if (!isAdmin && auth.user.id !== id) {
        return ApiErrors.forbidden('You can only view your own profile')
      }

      const { data, error } = await auth.supabase
        .from('users')
        .select('id, email, full_name, name, role, phone, avatar_url, created_at, updated_at')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return ApiErrors.notFound('User not found')
        }
        logError('users', error, { operation: 'get_user', userId: id, tenantId })
        return ApiErrors.databaseError('Failed to load user')
      }

      // Normalize name field
      const user = {
        ...data,
        name: data.name || data.full_name,
      }

      return NextResponse.json({ user })
    } catch (error) {
      return handleApiError('users', error, { operation: 'get_user' })
    }
  }
)

// Update user profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameters
    const paramsSchema = z.object({
      id: ValidationSchemas.uuid,
    })
    
    const paramsValidation = validateRouteParams(params, paramsSchema)
    if (!paramsValidation.success) {
      return paramsValidation.response
    }
    
    const { id } = paramsValidation.data
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)
    
    const updates = await request.json().catch(() => ({}))
    if (Object.keys(updates).length === 0) {
      return ApiErrors.badRequest('No update data provided')
    }

    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, full_name, name, role, phone, avatar_url, created_at, updated_at')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return ApiErrors.notFound('User not found')
      }
      logError('users', error, { operation: 'update_user', userId: id, tenantId })
      return ApiErrors.databaseError('Failed to update user')
    }

    // Normalize name field
    const user = {
      ...data,
      name: data.name || data.full_name,
    }

    return NextResponse.json({
      user,
      message: 'User profile updated successfully',
    })
  } catch (error) {
    return handleApiError('users', error, { operation: 'update_user' })
  }
}
