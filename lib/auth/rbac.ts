import { NextRequest, NextResponse } from 'next/server'
import { UserRole, isAdminRole as checkIsAdminRole } from './roles'
import { hasPermission } from './permissions'
import {
  authenticateRequest,
  requireAuth,
  requireRole,
  requireAdmin,
  requirePermission,
  requireRootAdmin,
  AuthResult,
} from './server-auth'

/**
 * RBAC middleware factory that wraps API route handlers with authentication and authorization
 * Supports both regular routes and dynamic routes with params
 */
export function withAuth<T = any>(
  handler: (request: NextRequest, auth: AuthResult, context?: any) => Promise<NextResponse<T>>,
  options?: {
    roles?: UserRole[]
    permissions?: string[]
    requireAdmin?: boolean
    requireRootAdmin?: boolean
  }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse<T>> => {
    try {
      // Root admin check takes precedence
      if (options?.requireRootAdmin) {
        await requireRootAdmin(request)
        // For root admin, we still need to get auth context
        const authResult = await requireAuth(request)
        return handler(request, authResult, context)
      }

      // Admin check
      if (options?.requireAdmin) {
        const authResult = await requireAdmin(request)
        return handler(request, authResult, context)
      }

      // Role-based check
      if (options?.roles && options.roles.length > 0) {
        const authResult = await requireRole(request, options.roles)
        return handler(request, authResult, context)
      }

      // Permission-based check
      if (options?.permissions && options.permissions.length > 0) {
        // Check all required permissions
        const authResult = await requireAuth(request)
        const missingPermissions = options.permissions.filter(
          (perm) => !hasPermission(authResult.user.role, perm)
        )

        if (missingPermissions.length > 0) {
          return NextResponse.json(
            {
              error: 'Insufficient permissions',
              missingPermissions,
            },
            { status: 403 }
          )
        }

        return handler(request, authResult, context)
      }

      // Just require authentication
      const authResult = await requireAuth(request)
      return handler(request, authResult, context)
    } catch (error) {
      // If it's already a NextResponse (from requireAuth, etc.), return it
      if (error instanceof NextResponse) {
        return error
      }

      // Otherwise, return a generic error
      console.error('[rbac] Middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper to check if user has any of the specified roles
 */
export function hasAnyRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

/**
 * Helper to check if user has all of the specified permissions
 */
export function hasAllPermissions(userRole: UserRole, requiredPermissions: string[]): boolean {
  return requiredPermissions.every((perm) => hasPermission(userRole, perm))
}

/**
 * Helper to check if user has any of the specified permissions
 */
export function hasAnyPermission(userRole: UserRole, requiredPermissions: string[]): boolean {
  return requiredPermissions.some((perm) => hasPermission(userRole, perm))
}

/**
 * Admin roles that can access admin endpoints
 */
export const ADMIN_ROLES: UserRole[] = [
  UserRole.ROOT_ADMIN,
  UserRole.PARTNER_ADMIN,
  UserRole.TSMART_TEAM,
  UserRole.CLEANING_COMPANY,
]

/**
 * Check if a role is an admin role (re-export from roles for convenience)
 */
export const isAdminRole = checkIsAdminRole

/**
 * RBAC middleware factory for root admin routes
 * Supports both regular routes and dynamic routes with params
 */
export function withRootAdmin<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse<T>> => {
    try {
      await requireRootAdmin(request)
      // If context has params that are a Promise, await them
      if (context?.params && typeof context.params === 'object' && 'then' in context.params) {
        context = { ...context, params: await context.params }
      }
      return handler(request, context)
    } catch (error) {
      // If it's already a NextResponse (from requireRootAdmin), return it
      if (error instanceof NextResponse) {
        return error
      }

      console.error('[rbac] Root admin middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Verifies that the authenticated user owns the customer resource (or is an admin)
 * Returns a NextResponse with 403 if unauthorized, or null if authorized
 */
export function verifyCustomerOwnership(
  customerId: string,
  auth: AuthResult
): NextResponse | null {
  // Admins can access any customer resource
  if (isAdminRole(auth.user.role)) {
    return null
  }

  // User must own the resource
  if (auth.user.id !== customerId) {
    return NextResponse.json(
      { error: 'You do not have permission to access this resource' },
      { status: 403 }
    )
  }

  return null
}

/**
 * Verifies that the authenticated user owns or has access to a booking
 * Users can access bookings if they are:
 * - The customer who created the booking
 * - The provider assigned to the booking
 * - An admin
 * 
 * @param bookingId - The ID of the booking to verify
 * @param userId - The authenticated user's ID
 * @param role - The authenticated user's role
 * @param supabase - The Supabase client instance
 * @returns Promise<boolean> - true if user has access, false otherwise
 */
export async function verifyBookingOwnership(
  bookingId: string,
  userId: string,
  role: UserRole,
  supabase: AuthResult['supabase']
): Promise<boolean> {
  // Admins can access any booking
  if (isAdminRole(role)) {
    return true
  }

  try {
    // Fetch the booking to check ownership
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('customer_id, provider_id')
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      return false
    }

    // Check if user is the customer
    if (booking.customer_id === userId) {
      return true
    }

    // Check if user is the provider
    // Note: provider_id may reference provider_profiles.id, so we need to check
    // if there's a provider_profile with this user_id
    if (booking.provider_id) {
      // First check direct match (in case provider_id stores user_id directly)
      if (booking.provider_id === userId) {
        return true
      }

      // Check via provider_profiles table
      const { data: providerProfile } = await supabase
        .from('provider_profiles')
        .select('id, user_id')
        .eq('id', booking.provider_id)
        .eq('user_id', userId)
        .single()

      if (providerProfile) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('[rbac] verifyBookingOwnership error:', error)
    return false
  }
}

/**
 * Verifies that the authenticated user is a member of a company (or is an admin)
 * 
 * @param companyId - The ID of the company to verify membership for
 * @param userId - The authenticated user's ID
 * @param role - The authenticated user's role (optional, for admin check)
 * @param supabase - The Supabase client instance
 * @returns Promise<boolean> - true if user is a member or admin, false otherwise
 */
export async function verifyCompanyMembership(
  companyId: string,
  userId: string,
  supabase: AuthResult['supabase'],
  role?: UserRole
): Promise<boolean> {
  // Admins can access any company
  if (role && isAdminRole(role)) {
    return true
  }

  try {
    // Check if user is a member of the company
    const { data: membership, error } = await supabase
      .from('company_users')
      .select('id, status')
      .eq('company_id', companyId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (error || !membership) {
      return false
    }

    return true
  } catch (error) {
    console.error('[rbac] verifyCompanyMembership error:', error)
    return false
  }
}

/**
 * RBAC middleware factory for dynamic routes with params
 * Supports both regular routes and dynamic routes with params
 */
export function withAuthAndParams<T = any, P = any>(
  handler: (
    request: NextRequest,
    auth: AuthResult,
    context: { params: P }
  ) => Promise<NextResponse<T>>,
  options?: {
    roles?: UserRole[]
    permissions?: string[]
    requireAdmin?: boolean
    requireRootAdmin?: boolean
  }
) {
  return async (request: NextRequest, context: { params: P | Promise<P> }): Promise<NextResponse<T>> => {
    try {
      // Await params if it's a Promise
      const resolvedParams = context.params && typeof context.params === 'object' && 'then' in context.params
        ? await context.params
        : context.params
      const resolvedContext = { params: resolvedParams }

      // Root admin check takes precedence
      if (options?.requireRootAdmin) {
        await requireRootAdmin(request)
        const authResult = await requireAuth(request)
        return handler(request, authResult, resolvedContext)
      }

      // Admin check
      if (options?.requireAdmin) {
        const authResult = await requireAdmin(request)
        return handler(request, authResult, resolvedContext)
      }

      // Role-based check
      if (options?.roles && options.roles.length > 0) {
        const authResult = await requireRole(request, options.roles)
        return handler(request, authResult, resolvedContext)
      }

      // Permission-based check
      if (options?.permissions && options.permissions.length > 0) {
        const authResult = await requireAuth(request)
        const missingPermissions = options.permissions.filter(
          (perm) => !hasPermission(authResult.user.role, perm)
        )

        if (missingPermissions.length > 0) {
          return NextResponse.json(
            {
              error: 'Insufficient permissions',
              missingPermissions,
            },
            { status: 403 }
          )
        }

        return handler(request, authResult, resolvedContext)
      }

      // Just require authentication
      const authResult = await requireAuth(request)
      return handler(request, authResult, resolvedContext)
    } catch (error) {
      // If it's already a NextResponse (from requireAuth, etc.), return it
      if (error instanceof NextResponse) {
        return error
      }

      // Otherwise, return a generic error
      console.error('[rbac] Middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

