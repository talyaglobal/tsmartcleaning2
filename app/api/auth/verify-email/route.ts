import { NextRequest, NextResponse } from 'next/server'
import { createAnonSupabase, resolveTenantFromRequest } from '@/lib/supabase'

/**
 * POST /api/auth/verify-email
 * 
 * Two modes:
 * 1. Resend verification: { email } - resends verification email
 * 2. Verify email: { token } - verifies email with token (handled via callback)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createAnonSupabase(tenantId)

    const origin = request.headers.get('origin') || request.headers.get('referer') || ''
    const baseUrl = origin.split('?')[0].split('#')[0]
    const redirectTo = `${baseUrl}/auth/callback`

    // Resend verification email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    })

    if (error) {
      // Don't reveal if email exists or not for security
      console.error('[verify-email] Error resending verification:', error)
    }

    // Always return success message to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists with this email and is unverified, a verification email has been sent.',
    })
  } catch (error) {
    console.error('[verify-email] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

