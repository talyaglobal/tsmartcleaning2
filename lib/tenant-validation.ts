/**
 * Tenant Validation Utilities
 * 
 * Provides explicit tenant context validation for API routes
 * to ensure proper tenant isolation security.
 */

import { createServerSupabase } from './supabase'
import { NextResponse } from 'next/server'

export interface TenantValidationResult {
  valid: boolean
  tenantId?: string
  userId?: string
  error?: string
}

/**
 * Validates that the current user session has proper tenant context
 * and returns the tenant ID for use in queries.
 * 
 * Usage in API routes:
 * ```typescript
 * const validation = await validateTenantContext()
 * if (!validation.valid) {
 *   return NextResponse.json({ error: validation.error }, { status: 401 })
 * }
 * // Use validation.tenantId in your queries
 * ```
 */
export async function validateTenantContext(): Promise<TenantValidationResult> {
  try {
    const supabase = createServerSupabase()
    
    // Get the current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        valid: false,
        error: 'Authentication required'
      }
    }

    // Check if user has tenant context in their session/JWT
    // This should be set when the user logs in and selects their tenant
    const tenantId = await getCurrentTenantId(supabase)
    
    if (!tenantId) {
      return {
        valid: false,
        error: 'Tenant context missing - please select your organization'
      }
    }

    // Verify the user actually belongs to this tenant
    const { data: userTenant, error: tenantError } = await supabase
      .from('user_tenants')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .single()

    if (tenantError || !userTenant) {
      return {
        valid: false,
        error: 'Access denied - user not authorized for this tenant'
      }
    }

    return {
      valid: true,
      tenantId,
      userId: user.id
    }
  } catch (error) {
    console.error('[Tenant Validation] Error:', error)
    return {
      valid: false,
      error: 'Internal server error during tenant validation'
    }
  }
}

/**
 * Gets the current tenant ID from the user's session/JWT claims
 * This should be set by the application when the user selects their tenant
 */
async function getCurrentTenantId(supabase: any): Promise<string | null> {
  try {
    // Try to get tenant_id from JWT custom claims
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.user_metadata?.tenant_id) {
      return user.user_metadata.tenant_id
    }
    
    // If not in JWT, could also check a session table or other mechanism
    // For now, return null to indicate missing tenant context
    return null
  } catch (error) {
    console.error('[Tenant ID Lookup] Error:', error)
    return null
  }
}

/**
 * Middleware function for API routes that require tenant validation
 * Returns a NextResponse with error if validation fails, null if valid
 */
export async function requireTenantContext(): Promise<{
  response: NextResponse | null
  tenantId?: string
  userId?: string
}> {
  const validation = await validateTenantContext()
  
  if (!validation.valid) {
    return {
      response: NextResponse.json(
        { error: validation.error },
        { status: validation.error?.includes('Authentication') ? 401 : 403 }
      )
    }
  }
  
  return {
    response: null,
    tenantId: validation.tenantId,
    userId: validation.userId
  }
}

/**
 * Admin-only tenant validation
 * Ensures user is admin within their tenant context
 */
export async function requireAdminTenantContext(): Promise<{
  response: NextResponse | null
  tenantId?: string
  userId?: string
}> {
  const validation = await validateTenantContext()
  
  if (!validation.valid) {
    return {
      response: NextResponse.json(
        { error: validation.error },
        { status: validation.error?.includes('Authentication') ? 401 : 403 }
      )
    }
  }

  // Check if user is admin
  const supabase = createServerSupabase()
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', validation.userId)
    .single()

  if (error || user?.role !== 'admin') {
    return {
      response: NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
  }
  
  return {
    response: null,
    tenantId: validation.tenantId,
    userId: validation.userId
  }
}