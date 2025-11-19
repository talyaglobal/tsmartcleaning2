import { NextRequest, NextResponse } from 'next/server'
import { createAnonSupabase, createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { UserRole, UserSession, isAdminRole } from './roles'
import { hasPermission } from './permissions'

export type AuthResult = {
  user: UserSession
  supabase: ReturnType<typeof createServerSupabase>
  tenantId: string | null
}

export type AuthError = {
  error: string
  status: number
}

/**
 * Authenticates a user from a request and returns user session info.
 * Supports both Bearer token and cookie-based authentication.
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<AuthResult | AuthError> {
  try {
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createAnonSupabase(tenantId)

    // Try to get session from Authorization header (Bearer token)
    const authHeader = request.headers.get('authorization') || ''
    let token: string | null = null

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice('Bearer '.length)
    }

    // If no token in header, try to get session from cookies
    let userData: any = null
    if (token) {
      const { data, error } = await supabase.auth.getUser(token)
      if (error || !data.user) {
        return { error: 'Invalid or expired token', status: 401 }
      }
      userData = data.user
    } else {
      // Try to get session from cookies
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session || !data.session.user) {
        return { error: 'No valid session found', status: 401 }
      }
      userData = data.session.user
    }

    if (!userData) {
      return { error: 'Unauthorized', status: 401 }
    }

    // Extract user metadata
    const metadata = userData.user_metadata || {}
    const role = (metadata.role as UserRole) || UserRole.CLEANING_COMPANY

    // Get full user profile from database to ensure it exists and is active
    const serverSupabase = createServerSupabase(tenantId)
    const { data: userProfile, error: profileError } = await serverSupabase
      .from('users')
      .select('id, email, full_name, role, company_id, team_id, is_active, profile_image, created_at')
      .eq('id', userData.id)
      .single()

    if (profileError || !userProfile) {
      // User might not exist in users table yet, use auth metadata
      const userSession: UserSession = {
        id: userData.id,
        email: userData.email || '',
        name: metadata.name || userData.email || 'User',
        role,
        companyId: metadata.company_id || null,
        teamId: metadata.team_id || null,
        profileImage: metadata.avatar_url || metadata.profile_image || null,
        isActive: metadata.is_active !== false,
        createdAt: userData.created_at,
      }

      return {
        user: userSession,
        supabase: serverSupabase,
        tenantId,
      }
    }

    // Check if user is active
    if (userProfile.is_active === false) {
      return { error: 'Account is inactive', status: 403 }
    }

    // Use role from database if available, otherwise from metadata
    const dbRole = (userProfile.role as UserRole) || role

    const userSession: UserSession = {
      id: userProfile.id,
      email: userProfile.email || userData.email || '',
      name: userProfile.full_name || metadata.name || userData.email || 'User',
      role: dbRole,
      companyId: userProfile.company_id || null,
      teamId: userProfile.team_id || null,
      profileImage: userProfile.profile_image || metadata.avatar_url || null,
      isActive: userProfile.is_active !== false,
      createdAt: userProfile.created_at || userData.created_at,
    }

    return {
      user: userSession,
      supabase: serverSupabase,
      tenantId,
    }
  } catch (error) {
    console.error('[auth] Authentication error:', error)
    return { error: 'Authentication failed', status: 500 }
  }
}

/**
 * Authenticates a root admin from request (checks signed session token)
 */
export async function authenticateRootAdmin(
  request: NextRequest
): Promise<{ isRootAdmin: boolean; error?: string; email?: string }> {
  try {
    // Use the new signed session verification
    const { verifyRootAdminSession } = await import('./root-admin-session')
    const session = await verifyRootAdminSession(request)
    
    if (session.isValid && session.email) {
      // Verify email matches configured root admin email
      const allowEmail = process.env.ROOT_ADMIN_EMAIL ?? 'admin@tsmartcleaning.com'
      if (session.email === allowEmail) {
        return { isRootAdmin: true, email: session.email }
      }
    }
    
    // Fallback: Check legacy header (for backward compatibility with middleware)
    const roleHeader = request.headers.get('x-user-role')
    if (roleHeader === 'root_admin') {
      const allowEmail = process.env.ROOT_ADMIN_EMAIL ?? 'admin@tsmartcleaning.com'
      return { isRootAdmin: true, email: allowEmail }
    }

    return { isRootAdmin: false, error: session.error || 'Not authenticated as root admin' }
  } catch (error) {
    console.error('[auth] Root admin authentication error:', error)
    return { isRootAdmin: false, error: 'Authentication failed' }
  }
}

/**
 * Requires authentication and returns the authenticated user or throws an error response
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthResult> {
  const authResult = await authenticateRequest(request)
  
  if ('error' in authResult) {
    throw NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  return authResult
}

/**
 * Requires a specific role and returns the authenticated user or throws an error response
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<AuthResult> {
  const authResult = await requireAuth(request)
  
  if (!allowedRoles.includes(authResult.user.role)) {
    throw NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  return authResult
}

/**
 * Requires admin role (any admin role)
 */
export async function requireAdmin(
  request: NextRequest
): Promise<AuthResult> {
  const authResult = await requireAuth(request)
  
  if (!isAdminRole(authResult.user.role)) {
    throw NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  return authResult
}

/**
 * Requires a specific permission
 */
export async function requirePermission(
  request: NextRequest,
  permission: string
): Promise<AuthResult> {
  const authResult = await requireAuth(request)
  
  if (!hasPermission(authResult.user.role, permission)) {
    throw NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  return authResult
}

/**
 * Requires root admin access
 */
export async function requireRootAdmin(
  request: NextRequest
): Promise<void> {
  const { isRootAdmin, error } = await authenticateRootAdmin(request)
  
  if (!isRootAdmin) {
    throw NextResponse.json(
      { error: error || 'Root admin access required' },
      { status: 403 }
    )
  }
}

